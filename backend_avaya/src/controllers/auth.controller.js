import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js"
import { ApiError } from "../utils/apiError.util.js";
import { User } from "../models/user.model.js";
import generateOTP from "../utils/otpGenerate.util.js"
import jwt from "jsonwebtoken"
import { sendEmail } from "../utils/email.util.js"
import OtpVerificationEmail from "../templates/otpverification.template.js"
import OTPSuccessEmail from "../templates/otpverifysuccess.template.js"

/**
 * Check if email exists for specific role - FlexiPay pattern
 */
const checkEmailAvailability = asyncHandler(
    async (req, res) => {
        const { email, role } = req.query;

        if (!email || !role) {
            throw new ApiError(400, "Email and role are required");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format");
        }

        const validRoles = ["agent", "admin"];
        if (!validRoles.includes(role)) {
            throw new ApiError(400, "Invalid role");
        }

        // Check if user exists with this email and role combination
        const existingUser = await User.findOne({ 
            email: email.toLowerCase(), 
            role: role 
        });

        const isAvailable = !existingUser;
        
        return res.status(200).json(
            new ApiResponse(
                200, 
                { 
                    isAvailable, 
                    email, 
                    role,
                    message: isAvailable 
                        ? "Email is available for this role" 
                        : `An ${role} account already exists with this email address`
                },
                "Email availability checked successfully"
            )
        );
    }
);

/**
 * Generate Access and Refresh Tokens - FlexiPay pattern
 */
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        const generatedAccessToken = user.generateAccessToken()
        const generatedRefreshToken = user.generateRefreshToken()

        user.refreshToken = generatedRefreshToken
        await user.save({ validateBeforeSave: false })

        return { generatedAccessToken, generatedRefreshToken }
    } catch (error) {
        throw new ApiError(500, `Something went wrong during token generation: ${error}`)
    }
}

const generatedOtps = new Set();

/**
 * Generate OTP Token - FlexiPay pattern
 */
const generateOTPToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const otp = generateOTP(generatedOtps);
        console.log("Generated OTP for testing:", otp);

        const otpToken = user.generateOTPToken(otp);
        user.otpToken = otpToken;
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        
        await user.save({ validateBeforeSave: false });

        return { otp, otpToken };
    } catch (error) {
        throw new ApiError(500, `Error generating OTP: ${error.message}`);
    }
}

/**
 * Register User - FlexiPay pattern adapted for Avaya (agent/admin roles)
 */
const registerUser = asyncHandler(
    async (req, res) => {
        const { firstname, lastname, email, password, phone, role = "agent" } = req.body;

        // 1. Validation - FlexiPay pattern
        const requiredFields = { firstname, lastname, email, password };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || value.trim() === "")
            .map(([key]) => key);

        if (missingFields.length > 0) {
            throw new ApiError(400, `Missing required fields: ${missingFields.join(", ")}`);
        }

        // 2. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format");
        }

        // 3. Password Validation - FlexiPay pattern
        if (password.length < 8) {
            throw new ApiError(400, "Password must be at least 8 characters long");
        }

        // 4. Role Validation - Avaya specific
        const validRoles = ["agent", "admin"];
        if (!validRoles.includes(role)) {
            throw new ApiError(400, "Invalid role. Must be 'agent' or 'admin'");
        }

        // 5. Check if user already exists (email + role combination)
        const existedUser = await User.findOne({ 
            email: email.toLowerCase(), 
            role: role 
        });

        if (existedUser) {
            throw new ApiError(409, `An ${role} account with ${email} already exists`);
        }

        // 6. Create User - FlexiPay pattern
        const createUser = await User.create({
            firstname,
            lastname,
            email: email.toLowerCase(),
            password,
            phone: phone || "",
            role,
            status: "pending", // Pending until email verified
            isVerified: false
        });

        const newUser = await User.findById(createUser._id)
            .select("-password -refreshToken");

        if (!newUser) {
            throw new ApiError(500, "Error creating the user");
        }

        // 7. Generate OTP - FlexiPay pattern
        const { otp, otpToken } = await generateOTPToken(newUser._id);

        // 8. Send verification email - FlexiPay pattern
        const fullName = `${newUser.firstname} ${newUser.lastname}`;
        await sendEmail(
            newUser.email,
            "Verify Your Email - Avaya",
            OtpVerificationEmail(fullName, otp)
        );

        // 9. Set OTP cookie - FlexiPay pattern
        const options = {
            httpOnly: true,
            maxAge: 5 * 60 * 1000, // 5 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        };

        return res.status(201)
            .cookie("otpToken", otpToken, options)
            .json(
                new ApiResponse(
                    201,
                    newUser,
                    `User with ${email} created successfully. Please verify your email.`
                )
            );
    }
);

/**
 * Verify OTP - FlexiPay pattern adapted for Avaya
 */
const verifyOtp = asyncHandler(
    async (req, res) => {
        const { otp } = req.body;

        // 1. Validation
        if (!otp) {
            throw new ApiError(400, "OTP is required");
        }

        // 2. Get decoded data from middleware
        const decoded = req.otpData;
        
        if (!decoded || !decoded._id) {
            throw new ApiError(401, "Invalid OTP token");
        }

        // 3. Find user and validate
        const user = await User.findById(decoded._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (user.isVerified) {
            throw new ApiError(400, "Email already verified");
        }

        // 4. Check OTP expiry first
        if (new Date() > user.otpExpiry) {
            throw new ApiError(401, "OTP has expired. Please request a new one.");
        }

        // 5. Check OTP match - compare with decoded OTP from token
        console.log('🔍 OTP Verification Debug:');
        console.log('Decoded OTP from token:', decoded.otp, 'Type:', typeof decoded.otp);
        console.log('OTP from request:', otp, 'Type:', typeof otp);
        console.log('Correct OTP for this user:', user.otp); // Add this for debugging
        console.log('Comparison result:', Number(decoded.otp) === Number(otp));

        if (Number(decoded.otp) !== Number(otp)) {
            throw new ApiError(401, "Invalid OTP");
        }

        // 6. Mark user as verified - FlexiPay pattern
        user.isVerified = true;
        user.status = "active";
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpToken = undefined;
        user.otpToken = undefined;
        await user.save({ validateBeforeSave: false });

        // 7. Generate access and refresh tokens - FlexiPay pattern (auto-login)
        const { generatedAccessToken, generatedRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // 8. Get verified user
        const verifiedUser = await User.findById(user._id)
            .select("-password -refreshToken");

        // 9. Send success email - FlexiPay pattern
        const fullName = `${verifiedUser.firstname} ${verifiedUser.lastname}`;
        await sendEmail(
            verifiedUser.email,
            "Email Verified Successfully - Avaya",
            OTPSuccessEmail(fullName, otp)
        );

        // 10. Set cookies - FlexiPay pattern
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        };

        return res.status(200)
            .cookie("accessToken", generatedAccessToken, options)
            .cookie("refreshToken", generatedRefreshToken, options)
            .clearCookie("otpToken") // Clear OTP token
            .json(
                new ApiResponse(
                    200,
                    {
                        user: verifiedUser,
                        accessToken: generatedAccessToken,
                        refreshToken: generatedRefreshToken
                    },
                    "Email verified successfully"
                )
            );
    }
);

/**
 * Resend OTP - FlexiPay pattern adapted for Avaya
 */
const resendOtp = asyncHandler(
    async (req, res) => {
        const { email, role = "agent" } = req.body;

        // 1. Validation
        if (!email) {
            throw new ApiError(400, "Email is required");
        }

        // 2. Find user - FlexiPay pattern with email + role
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: role 
        });

        if (!user) {
            throw new ApiError(404, `No ${role} account found with this email`);
        }

        if (user.isVerified) {
            throw new ApiError(400, "Email is already verified");
        }

        // 3. Generate new OTP - FlexiPay pattern
        const { otp, otpToken } = await generateOTPToken(user._id);

        // 4. Send new OTP email - FlexiPay pattern
        const fullName = `${user.firstname} ${user.lastname}`;
        await sendEmail(
            user.email,
            "Verify Your Email - Avaya",
            OtpVerificationEmail(fullName, otp)
        );

        // 5. Set OTP cookie - FlexiPay pattern
        const options = {
            httpOnly: true,
            maxAge: 5 * 60 * 1000, // 5 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        };

        return res.status(200)
            .cookie("otpToken", otpToken, options)
            .json(
                new ApiResponse(200, null, "OTP resent successfully. Please check your email.")
            );
    }
);

/**
 * User Login - FlexiPay pattern adapted for Avaya
 */
const userLogin = asyncHandler(
    async (req, res) => {
        const { email, password, role = "agent" } = req.body;

        // 1. Validation
        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }

        // 2. Find user by email + role - FlexiPay pattern
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: role 
        });

        if (!user) {
            throw new ApiError(404, `No ${role} account found with this email`);
        }

        // 3. Check if email is verified - FlexiPay pattern
        if (!user.isVerified) {
            throw new ApiError(401, "Please verify your email before logging in");
        }

        // 4. Check password - FlexiPay pattern
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials");
        }

        // 5. Check account status - FlexiPay pattern
        if (user.status === "suspended") {
            throw new ApiError(403, "Your account has been suspended. Please contact support.");
        }

        if (user.status !== "active") {
            throw new ApiError(403, `Your account is ${user.status}. Please contact support.`);
        }

        // 6. Generate access and refresh tokens - FlexiPay pattern
        const { generatedAccessToken, generatedRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // 7. Get logged-in user
        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken");

        // 8. Set cookies - FlexiPay pattern
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        };

        return res.status(200)
            .cookie("accessToken", generatedAccessToken, options)
            .cookie("refreshToken", generatedRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken: generatedAccessToken,
                        refreshToken: generatedRefreshToken
                    },
                    "User logged in successfully"
                )
            );
    }
);

/**
 * User Logout
 */
const logout = asyncHandler(
    async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            { new: true }
        );

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict'
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"));
    }
);

/**
 * Refresh Access Token
 */
const refreshAccessToken = asyncHandler(
    async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            );

            const user = await User.findById(decodedToken?._id);

            if (!user) {
                throw new ApiError(401, "Invalid refresh token");
            }

            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used");
            }

            const { generatedAccessToken, generatedRefreshToken } = 
                await generateAccessAndRefreshToken(user._id);

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: 'strict',
                maxAge: 8 * 60 * 60 * 1000
            };

            return res
                .status(200)
                .cookie("accessToken", generatedAccessToken, options)
                .cookie("refreshToken", generatedRefreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {
                            accessToken: generatedAccessToken,
                            refreshToken: generatedRefreshToken
                        },
                        "Access token refreshed"
                    )
                );
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token");
        }
    }
);

export {
    checkEmailAvailability,
    registerUser,
    verifyOtp,
    resendOtp,
    userLogin,
    logout,
    refreshAccessToken
};
