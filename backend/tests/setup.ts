import { afterAll, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '@/config/db';

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});
