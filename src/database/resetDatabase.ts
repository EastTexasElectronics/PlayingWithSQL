import { Pool } from 'pg';
import { env } from '@/env';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetDatabase() {
  try {
    await pool.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
    `);
    console.log('All tables dropped successfully');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaSQL = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('Database schema recreated successfully');

    console.log('Database reset complete. To insert sample data, run: bun run src/database/sampleData/insertCsvData.js');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDatabase().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
