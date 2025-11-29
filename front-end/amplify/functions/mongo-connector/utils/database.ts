/**
 * @file database.ts
 * @description MongoDB connection management with connection pooling
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-11-28
 */

import { MongoClient, Db } from 'mongodb';
import { env } from '$amplify/env/mongo-connector';
import { DatabaseError } from '../errors/AppError';
import { Logger } from './logger';

// Cached connection for Lambda reuse
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const DATABASE_NAME = 'aws-quiz-db';

/**
 * Gets or creates a MongoDB database connection
 * Reuses existing connection across Lambda invocations for performance
 * 
 * @param logger - Logger instance for connection events
 * @returns MongoDB database instance
 * @throws {DatabaseError} If connection fails
 * 
 * @example
 * const db = await getDatabase(logger);
 * const questions = await db.collection('questions').find({}).toArray();
 */
export async function getDatabase(logger: Logger): Promise<Db> {
  try {
    // Return cached connection if available
    if (cachedDb && cachedClient) {
      logger.logInfo('Using cached MongoDB connection');
      return cachedDb;
    }
    
    logger.logInfo('Creating new MongoDB connection', { 
      database: DATABASE_NAME 
    });
    
    // Create new connection
    const client = new MongoClient(env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    
    // Cache for reuse
    cachedClient = client;
    cachedDb = db;
    
    logger.logInfo('MongoDB connection established', { 
      database: DATABASE_NAME 
    });
    
    return db;
    
  } catch (error) {
    logger.logError('Database connection failed', error as Error);
    throw new DatabaseError(
      'Failed to connect to database',
      { error: (error as Error).message }
    );
  }
}

/**
 * Closes the MongoDB connection (for cleanup)
 * Note: In Lambda, connections are typically kept alive for reuse
 */
export async function closeDatabase(logger: Logger): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    logger.logInfo('MongoDB connection closed');
  }
}
