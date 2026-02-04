import mongoose from 'mongoose';
import { dbLogger } from './logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    dbLogger.info({ host: conn.connection.host }, 'MongoDB connected');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      dbLogger.error({ err }, 'MongoDB connection error');
    });
    
    mongoose.connection.on('disconnected', () => {
      dbLogger.warn('MongoDB disconnected');
    });
    
    return conn;
  } catch (error) {
    dbLogger.fatal({ err: error }, 'MongoDB connection failed');
    // Give time for logs to flush before exit
    setTimeout(() => process.exit(1), 1000);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    dbLogger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    dbLogger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
});
