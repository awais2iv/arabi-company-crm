import dotenv from "dotenv"
import { createServer } from "http";
import connectDB from "./db/dbConnect.js";
import app from "./app.js";
import log from "./utils/logger.util.js";

// Load environment variables
dotenv.config();

// Create HTTP server
const httpServer = createServer(app);

/**
 * Initialize services
 * TODO: Add Redis, Socket.io, or other service initializations here
 */
const initializeServices = async () => {
    try {
        // TODO: Connect to Redis if needed
        // log.info('Connecting to Redis...');
        // await redisClient.connect();
        // log.info('Redis connected successfully');

        // TODO: Initialize other services (Socket.io, Firebase, etc.)
        
        log.info('All services initialized successfully');
    } catch (error) {
        log.error('Error initializing services:', error);
        // Don't crash the server - services are optional
        log.warn('Server will continue without optional services');
    }
};

/**
 * Start the server
 */
connectDB()
    .then(async () => {
        log.info('Database connected successfully');
        
        // Initialize additional services
        await initializeServices();
        
        // Configure server timeouts for persistent connections
        httpServer.keepAliveTimeout = 65000; // 65 seconds
        httpServer.headersTimeout = 66000; // Slightly more than keepAliveTimeout
        
        // TODO: Initialize cron jobs or scheduled tasks here
        // Example:
        // initializeCronJobs();
        
        // Listen on all network interfaces (0.0.0.0) to allow external connections
        const PORT = process.env.PORT || 8000;
        httpServer.listen(PORT, '0.0.0.0', () => {
            try {
                log.info(`Server is running at port ${PORT} on all network interfaces`);
                log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                log.info(`Health check: http://localhost:${PORT}/api/v1/health`);
            } catch (err) {
                log.error('Error during server startup:', err);
            }
        });
    })
    .catch((err) => {
        log.error("Server startup failed:", err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    log.info('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        log.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log.info('SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
        log.info('HTTP server closed');
        process.exit(0);
    });
});
