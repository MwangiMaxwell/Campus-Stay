import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { sendError } from '@/utils/apiResponse';

const isTest = process.env.NODE_ENV === 'test';

function tooManyRequests(
  _req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
): void {
  sendError(res, 429, 'Too many attempts. Please try again later.');
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'Too many requests. Please try again later.');
  },
});
