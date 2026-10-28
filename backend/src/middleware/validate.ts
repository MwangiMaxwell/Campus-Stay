import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { sanitizeInput } from '@/utils/sanitize';

type SchemaBundle = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

function plain(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => plain(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>));
  }
  return value;
}

export function validate(schemas: SchemaBundle): RequestHandler {
  return (req, _res, next) => {
    try {
      req.validated = {
        body: schemas.body ? schemas.body.parse(sanitizeInput(plain(req.body ?? {}))) : {},
        query: schemas.query ? schemas.query.parse(sanitizeInput(plain(req.query ?? {}))) : {},
        params: schemas.params ? schemas.params.parse(sanitizeInput(plain(req.params ?? {}))) : {},
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
