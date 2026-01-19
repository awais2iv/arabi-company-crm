import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import logger from "./logger.util.js";

// Initialize S3 client - FlexiPay pattern
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to S3 - FlexiPay pattern
 * Supports: Buffer, file path string, or multer file object
 * 
 * @param {Buffer|string|Object} fileOrPathOrBuffer - File to upload
 * @param {string} key - S3 key (path) for the file
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} S3 URL of uploaded file
 */
export const uploadToS3 = async (fileOrPathOrBuffer, key, mimetype) => {
  try {
    let body;
    let unlinkPath = null;
    
    // Handle different input types
    if (Buffer.isBuffer(fileOrPathOrBuffer)) {
      body = fileOrPathOrBuffer;
    } else if (typeof fileOrPathOrBuffer === 'string') {
      // File path string
      body = fs.createReadStream(fileOrPathOrBuffer);
      unlinkPath = fileOrPathOrBuffer;
    } else if (fileOrPathOrBuffer?.path) {
      // Multer file object
      body = fs.createReadStream(fileOrPathOrBuffer.path);
      unlinkPath = fileOrPathOrBuffer.path;
      mimetype = mimetype || fileOrPathOrBuffer.mimetype;
    } else {
      throw new Error('Invalid file input type');
    }
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: mimetype,
    };
    
    await s3.send(new PutObjectCommand(params));
    
    // Clean up temp file after successful upload
    if (unlinkPath && fs.existsSync(unlinkPath)) {
      await fs.promises.unlink(unlinkPath);
      logger.info(`Temp file deleted: ${unlinkPath}`);
    }
    
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    logger.info(`File uploaded to S3: ${s3Url}`);
    
    return s3Url;
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw error;
  }
};

/**
 * Delete file from S3 - FlexiPay pattern
 * 
 * @param {string} url - Full S3 URL of file to delete
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (url) => {
  try {
    if (!url) return;
    
    // Extract key from URL
    const key = url.split('.com/')[1];
    if (!key) {
      logger.warn('Invalid S3 URL format:', url);
      return;
    }
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    
    await s3.send(new DeleteObjectCommand(params));
    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw error;
  }
};

/**
 * Generate unique S3 key for user images
 * Format: images/users/{userId}-{timestamp}.{ext}
 * 
 * @param {string} userId - User ID
 * @param {string} originalname - Original filename
 * @returns {string} S3 key
 */
export const generateImageKey = (userId, originalname) => {
  const timestamp = Date.now();
  const ext = originalname.split('.').pop();
  return `images/users/${userId}-${timestamp}.${ext}`;
};
