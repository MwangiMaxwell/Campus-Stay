import mongoose from 'mongoose';
import { sendError, sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

const DB_LABELS: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getHealth = asyncHandler(async (_req, res) => {
  const state = mongoose.connection.readyState;
  const database = DB_LABELS[state] ?? 'unknown';
  if (state !== 1) {
    sendError(res, 503, 'Database unavailable', { status: 'degraded', database });
    return;
  }
  sendSuccess(res, {
    status: 'ok',
    service: 'campusstay-api',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
