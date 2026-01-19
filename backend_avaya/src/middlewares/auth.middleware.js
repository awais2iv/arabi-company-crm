/**
 * Unified Authentication Middleware for Avaya Backend
 * 
 * This middleware handles authentication for all user types:
 * - Admins
 * - Users
 * - Customers
 * 
 * It automatically detects the user type from the JWT token and loads
 * the appropriate model, setting req.user for consistency.
 */

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // Extract token from cookies or Authorization header
        let token = req.cookies?.accessToken || req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        
        console.log('\n=== Auth Middleware ===');
        console.log('Request URL:', req.originalUrl);
        console.log('Cookies:', req.cookies);
        console.log('Token received:', token ? 'Present' : 'Missing');
        
        if (!token || typeof token !== "string") {
            console.log('ERROR: Token is missing or invalid type');
            throw new ApiError(401, "Unauthorized: Token is missing or invalid");
        }
        
        // Trim any whitespace and validate JWT format
        token = token.trim();
        console.log('Token length:', token.length);
        console.log('Token preview:', token.substring(0, 20) + '...');
        
        // Basic JWT format validation (should have 3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.log('ERROR: Invalid JWT format. Parts count:', tokenParts.length);
            throw new ApiError(401, "Invalid token format");
        }
    
        // Verify and decode the JWT token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log('Token decoded successfully. User ID:', decodedToken._id);
        } catch (jwtError) {
            console.log('ERROR: JWT verification failed:', jwtError.message);
            console.log('ERROR: JWT error name:', jwtError.name);
            throw jwtError;
        }

        // Load user from database
        const authenticatedUser = await User.findById(decodedToken._id).select("-password -refreshToken");
        
        if (!authenticatedUser) {
            console.log('ERROR: User not found in database');
            throw new ApiError(401, "Invalid Access Token");
        }
        
        console.log('User authenticated:', authenticatedUser.email, '| Type:', authenticatedUser.type);
        
        // Check if user account is suspended
        if (authenticatedUser.status === 'suspended') {
            console.log(`Access denied: user ${authenticatedUser.email} is suspended`);
            throw new ApiError(403, 'Account suspended. Please contact support');
        }
        
        // Set req.user for all authenticated requests
        req.user = authenticatedUser;

        console.log('=== Authentication Successful ===\n');
        
        next();
        
    } catch (error) {
        console.log('=== Authentication Failed ===');
        console.log('Error:', error?.message || error);
        console.log('=============================\n');
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
