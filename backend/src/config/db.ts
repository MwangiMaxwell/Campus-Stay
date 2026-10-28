import mongoose from 'mongoose';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import '@/models';

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

let connecting: Promise<void> | null = null;

export function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (!connecting) {
    connecting = mongoose
      .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        logger.info('Connected to MongoDB');
      })
      .catch((error: unknown) => {
        connecting = null;
        throw error;
      });
  }

  return connecting;
}

export async function disconnectDb(): Promise<void> {
  connecting = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
