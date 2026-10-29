import app from './app';
import { env } from './config/env.config';
import { pool } from './config/db.config';

const PORT = parseInt(env.PORT, 10) || 5001;

// Schema safety bootstrap
pool.query('ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS document_url TEXT NULL;')
  .catch((e) => console.warn('[DB Bootstrap Warning]:', e.message));

app.listen(PORT, () => {
  console.log(`[School ERP Server]: Running on http://localhost:${PORT} in ${env.NODE_ENV} mode`);
});
