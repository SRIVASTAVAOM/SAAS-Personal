import { z } from 'zod';

describe('Production Environment Safety Validation', () => {
  const envSchema = z.object({
    PORT: z.string().default('5001'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    JWT_SECRET: z.string().default('super_secret_dev_school_erp_jwt_key_2026_m1'),
  }).refine((data) => {
    if (data.NODE_ENV === 'production') {
      return data.JWT_SECRET && data.JWT_SECRET.length >= 32 && data.JWT_SECRET !== 'super_secret_dev_school_erp_jwt_key_2026_m1';
    }
    return true;
  }, {
    message: 'In production, JWT_SECRET must be explicitly provided, at least 32 characters long, and distinct from development defaults.',
    path: ['JWT_SECRET'],
  });

  it('should allow default JWT_SECRET in development/test', () => {
    const parsed = envSchema.safeParse({ NODE_ENV: 'development' });
    expect(parsed.success).toBe(true);
  });

  it('should REJECT default JWT_SECRET in production', () => {
    const parsed = envSchema.safeParse({ NODE_ENV: 'production' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].message).toContain('In production, JWT_SECRET must be explicitly provided');
    }
  });

  it('should REJECT short (<32 chars) JWT_SECRET in production', () => {
    const parsed = envSchema.safeParse({
      NODE_ENV: 'production',
      JWT_SECRET: 'short_key_under_32_characters!',
    });
    expect(parsed.success).toBe(false);
  });

  it('should ACCEPT strong custom JWT_SECRET in production', () => {
    const parsed = envSchema.safeParse({
      NODE_ENV: 'production',
      JWT_SECRET: 'a_very_strong_production_secret_key_exceeding_32_characters_12345',
    });
    expect(parsed.success).toBe(true);
  });
});
