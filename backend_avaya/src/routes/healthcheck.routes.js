import { Router } from "express";
import { ApiResponse } from "../utils/apiResponse.util.js";

const router = Router();

router.route("/health").get((req, res) => {
    res.status(200).json(
        new ApiResponse(200, {
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV
        }, "Service is healthy")
    );
});

export default router;
