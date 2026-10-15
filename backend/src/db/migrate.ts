import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.config';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('[Migration]: Starting database migrations...');
    await client.query('BEGIN');

    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const { rows } = await client.query(
          'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
          [file]
        );

        if (rows.length === 0) {
          console.log(`[Migration]: Executing ${file}...`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
            [file]
          );
          console.log(`[Migration]: Successfully applied ${file}`);
        } else {
          console.log(`[Migration]: Skipping already applied ${file}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('[Migration]: All migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Migration Error]: Migration failed, rolled back.', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
