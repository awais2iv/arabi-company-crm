import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware.js';
import logger from './utils/logger.util.js';

// Import routes
import HealthCheckRoutes from './routes/healthcheck.routes.js';
import AuthRoutes from './routes/auth.routes.js';
import UserRoutes from './routes/user.routes.js';
import TranscriberRoutes from './routes/transcriber.routes.js';
import WorkOrderRoutes from './routes/workOrder.routes.js';

const app = express();

// Configure CORS with proper origin handling
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
            : ['http://localhost:5173', 'http://localhost:3000'];
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));

// Enable keep-alive for persistent connections
app.use((req, res, next) => {
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=5');
    next();
});

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Request logging
app.use(
    morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    })
);

// API Routes
app.use('/api/v1', HealthCheckRoutes);
app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/users', UserRoutes);
app.use('/api/v1/transcriber', TranscriberRoutes);
app.use('/api/v1/work-orders', WorkOrderRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
