import { Pool, PoolConfig } from 'pg';
import { env } from './env.config';

const isProduction = env.NODE_ENV === 'production';

let poolConfig: PoolConfig;

if (env.DATABASE_URL) {
  const needsSsl =
    isProduction ||
    env.DATABASE_URL.includes('sslmode=require') ||
    env.DATABASE_URL.includes('neon.tech') ||
    env.DATABASE_URL.includes('render.com') ||
    env.DATABASE_URL.includes('supabase.co');

  poolConfig = {
    connectionString: env.DATABASE_URL,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  poolConfig = {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});
