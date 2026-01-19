import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";

/**
 * verifyAdmin middleware
 * - Verifies JWT if present and ensures user.type === 'admin'
 * - In development, allows bypass when header 'x-dev-admin' === '1'
 */
export const verifyAdmin = async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // If token present, validate and ensure user is admin
        if (token && typeof token === 'string') {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("-password -refreshToken");
            if (!user) throw new ApiError(401, "Invalid access token");
            if (user.type !== 'admin') throw new ApiError(403, "Forbidden: admin access required");
            req.user = user;
            return next();
        }

        // No token: allow dev bypass when explicitly requested and running in development
        const devHeader = req.header('x-dev-admin');
        if (process.env.NODE_ENV === 'development' && devHeader === '1') {
            // attach a minimal admin marker so downstream handlers can rely on req.user.type if needed
            req.user = { type: 'admin', _id: null };
            return next();
        }

        throw new ApiError(401, "Unauthorized: admin credentials required");
    } catch (error) {
        return next(new ApiError(error.statusCode || 401, error.message || 'Unauthorized'));
    }
};

export default verifyAdmin;
