import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EXAMPLE_JWT_SECRET = 'dev-only-change-me-before-any-shared-deployment-32';

if (process.env.NODE_ENV === 'test') {
  const uriFile = path.resolve(process.cwd(), '.test-mongo-uri');
  if (!fs.existsSync(uriFile)) {
    throw new Error(
      'Test MongoDB URI file is missing. Run tests with vitest so the in-memory database can start.',
    );
  }
  const uri = fs.readFileSync(uriFile, 'utf8').trim();
  if (!uri) {
    throw new Error('Test MongoDB URI file is empty.');
  }
  process.env.MONGODB_URI = uri;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .default('4000')
    .transform((value) => Number(value)),
  MONGODB_URI: z
    .string()
    .refine((value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'), {
      message: 'MONGODB_URI must be a MongoDB connection string',
    }),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/)
    .default('15m'),
  CLIENT_URL: z.string().refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'CLIENT_URL must be an absolute http(s) URL' },
  ),
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CONSUMER_KEY: z.string().default(''),
  MPESA_CONSUMER_SECRET: z.string().default(''),
  MPESA_SHORTCODE: z.string().default(''),
  MPESA_PASSKEY: z.string().default(''),
  MPESA_CALLBACK_URL: z.string().default(''),
  ORG_NAME: z.string().min(1).default('CampusStay'),
  ORG_LOGO_URL: z.string().default('http://localhost:3000/logo.svg'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${details}`);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET === EXAMPLE_JWT_SECRET) {
  throw new Error(
    'Refusing to start with the example JWT_SECRET. Set a unique secret in production.',
  );
}

export const env = parsed.data;
export type Env = typeof env;
