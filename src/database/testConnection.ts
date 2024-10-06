import { Pool, type QueryResult } from 'pg';
import { env } from '@/env';

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connection successful. Current time:', (result.rows[0] as { now: Date }).now);

    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Tables in the database:');
    tablesResult.rows.forEach((row: { table_name: string }) => {
      console.log(row.table_name);
    });
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    await pool.end();
  }
}

void testConnection();
