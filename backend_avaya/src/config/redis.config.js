// src/config/redis.config.js
import Redis from 'ioredis';
import logger from '../utils/logger.util.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
  }

  connect() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    try {
      // Main client for general operations
      this.client = new Redis(redisConfig);

      // Subscriber client for pub/sub
      this.subscriber = new Redis(redisConfig);

      // Publisher client for pub/sub
      this.publisher = new Redis(redisConfig);

      // Connection event handlers
      this.client.on('connect', () => {
        logger.info('✅ Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client ready');
      });

      this.client.on('error', (err) => {
        logger.error('❌ Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('⚠️ Redis client connection closed');
        this.isConnected = false;
      });

      this.subscriber.on('connect', () => {
        logger.info('✅ Redis subscriber connected');
      });

      this.publisher.on('connect', () => {
        logger.info('✅ Redis publisher connected');
      });

      return this.client;
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  getSubscriber() {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized. Call connect() first.');
    }
    return this.subscriber;
  }

  getPublisher() {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized. Call connect() first.');
    }
    return this.publisher;
  }

  async disconnect() {
    try {
      if (this.client) await this.client.quit();
      if (this.subscriber) await this.subscriber.quit();
      if (this.publisher) await this.publisher.quit();
      this.isConnected = false;
      logger.info('✅ Redis connections closed');
    } catch (error) {
      logger.error('❌ Error disconnecting Redis:', error);
    }
  }

  // Utility methods for common operations
  async set(key, value, expirySeconds = null) {
    try {
      if (expirySeconds) {
        return await this.client.setex(key, expirySeconds, JSON.stringify(value));
      }
      return await this.client.set(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const redisClient = new RedisClient();
export default redisClient;
