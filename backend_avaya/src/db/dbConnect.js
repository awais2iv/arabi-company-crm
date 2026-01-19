import mongoose from 'mongoose';
import { DBNAME } from "../constants.js";
import logger from '../utils/logger.util.js';

const connectDB = async () => {
    try {
        logger.info(`DBNAME imported from constants: ${DBNAME}`);
        
        // Parse the MongoDB URI and add the database name properly
        const baseUri = process.env.MONGO_DB_URI;
        const hasQueryParams = baseUri.includes('?');
        
        // Insert database name before query parameters
        const connectionString = hasQueryParams 
            ? baseUri.replace('/?', `/${DBNAME}?`)
            : `${baseUri}/${DBNAME}`;
            
        logger.info(`Connecting to MongoDB database: ${DBNAME}`);
        logger.info(`Connection string: ${connectionString}`);
        
        const connection = await mongoose.connect(connectionString);
        logger.info(`MongoDB Server Connected: ${connection.connection.host}`);
        logger.info(`✅ Connected to database: ${connection.connection.db.databaseName}`);
        
        // TODO: Add any post-connection initialization hooks here
        // Example: Initialize indexes, run migrations, etc.
        
    } catch (error) {
        logger.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

export default connectDB;
