import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.util.js';

/**
 * Middleware to verify OTP token - FlexiPay pattern
 * Used during registration/verification flow
 */
export const verifyOtpToken = async (req, res, next) => {
    try {
        // Get otpToken from cookies or body
        const otpToken = req.cookies?.otpToken || req.body?.otpToken;

        if (!otpToken) {
            throw new ApiError(401, 'OTP token is required');
        }

        // Verify the OTP token
        const decoded = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
        
        if (!decoded._id) {
            throw new ApiError(401, 'Invalid OTP token structure');
        }

        // Find the user (optional check, controller will also verify)
        const user = await User.findById(decoded._id);
        if (!user) {
            throw new ApiError(401, 'Invalid or expired OTP token');
        }

        // Attach decoded data and user to request - FlexiPay pattern
        req.otpData = decoded;
        req.user = user;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'OTP has expired. Please request a new one.');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid OTP token');
        }
        throw new ApiError(401, error.message || 'Invalid OTP token');
    }
};
