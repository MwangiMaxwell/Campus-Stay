import type { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
): void {
  const error: { message: string; details?: unknown } = { message };
  if (details !== undefined) {
    error.details = details;
  }
  res.status(statusCode).json({ success: false, error });
}
