import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/AppError';
import { sendError } from '@/utils/apiResponse';
import { logger } from '@/utils/logger';

function fieldErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    details[key] ??= [];
    details[key].push(issue.message);
  }
  return details;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, 'Check the form and try again', { fieldErrors: fieldErrors(err) });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  if (typeof err === 'object' && err !== null && 'name' in err) {
    const name = (err as { name?: string }).name;
    if (name === 'ValidationError' || name === 'CastError') {
      sendError(res, 400, 'Invalid data');
      return;
    }
    if ('code' in err && (err as { code?: number }).code === 11000) {
      sendError(res, 409, 'That record already exists');
      return;
    }
  }

  if (err instanceof SyntaxError) {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 500, 'Internal server error');
};
