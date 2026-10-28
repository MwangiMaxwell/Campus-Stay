import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { User, toAuthUser } from '@/models';
import { AppError } from '@/utils/AppError';
import { asyncHandler } from '@/utils/asyncHandler';
import { COOKIE_NAME } from '@/utils/cookies';

async function userFromToken(token: string | undefined) {
  if (!token) {
    return undefined;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.sub) {
      return undefined;
    }
    const user = await User.findById(decoded.sub);
    if (!user || user.status !== 'active') {
      return undefined;
    }
    return toAuthUser(user);
  } catch {
    return undefined;
  }
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  const user = await userFromToken(token);
  if (!user) {
    throw new AppError(401, 'Authentication required');
  }
  req.user = user;
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  const user = await userFromToken(token);
  if (user) {
    req.user = user;
  }
  next();
});
