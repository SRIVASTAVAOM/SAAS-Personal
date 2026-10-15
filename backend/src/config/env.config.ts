import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_USER: z.string().default('omsrivastava'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('school_erp_db'),
  JWT_SECRET: z.string().default('super_secret_dev_school_erp_jwt_key_2026_m1'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET_NAME: z.string().default('school-erp-dev-private-storage'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  MAX_UPLOAD_SIZE_BYTES: z.string().default('10485760'), // Provisional 10MB default
  ALLOWED_MIME_TYPES: z.string().default('application/pdf,image/jpeg,image/png'),
}).refine((data) => {
  if (data.NODE_ENV === 'production') {
    return data.JWT_SECRET && data.JWT_SECRET.length >= 32 && data.JWT_SECRET !== 'super_secret_dev_school_erp_jwt_key_2026_m1';
  }
  return true;
}, {
  message: 'In production, JWT_SECRET must be explicitly provided, at least 32 characters long, and distinct from development defaults.',
  path: ['JWT_SECRET'],
});

export const env = envSchema.parse(process.env);
