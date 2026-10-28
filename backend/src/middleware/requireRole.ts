import type { RequestHandler } from 'express';
import type { UserRole } from '@/types';
import { AppError } from '@/utils/AppError';

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'You do not have permission to do that'));
      return;
    }
    next();
  };
}
