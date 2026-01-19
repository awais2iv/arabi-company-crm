import { Router } from "express"
import {
    userLogin,
    registerUser,
    verifyOtp,
    resendOtp,
    logout,
    refreshAccessToken,
    checkEmailAvailability
} from "../controllers/auth.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyOtpToken } from "../middlewares/verifyOtp.middleware.js";

const router = Router();

// Public routes
router.route("/check-email").get(checkEmailAvailability);
router.route("/register").post(registerUser);
router.route("/verify-otp").post(verifyOtpToken, verifyOtp);
router.route("/resend-otp").post(resendOtp);
router.route("/login").post(userLogin);
router.route("/refresh").post(refreshAccessToken);

// Protected routes
router.route("/logout").post(verifyJWT, logout);

export default router;
