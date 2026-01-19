import { Router } from "express";
import {
    getCurrentUser,
    updateUserProfile,
    changePassword,
    getUserById,
    getAllUsers
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";

const router = Router();

// Protected user routes
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/update-profile").patch(verifyJWT, updateUserProfile);
router.route("/change-password").post(verifyJWT, changePassword);

// Admin routes
router.route("/").get(verifyAdmin, getAllUsers);
router.route("/:userId").get(verifyAdmin, getUserById);

export default router;
