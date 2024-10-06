import fs from 'fs';
import { Pool } from 'pg';
import { env } from '@/env';

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS Inventory CASCADE;
      DROP TABLE IF EXISTS Payments CASCADE;
      DROP TABLE IF EXISTS OrderItems CASCADE;
      DROP TABLE IF EXISTS Orders CASCADE;
      DROP TABLE IF EXISTS Carts CASCADE;
      DROP TABLE IF EXISTS Reviews CASCADE;
      DROP TABLE IF EXISTS Products CASCADE;
      DROP TABLE IF EXISTS Categories CASCADE;
      DROP TABLE IF EXISTS Users CASCADE;
    `);
    console.log('Existing tables dropped successfully');

    const schemaSQL = fs.readFileSync(new URL('schema.sql', import.meta.url), 'utf8');
    await pool.query(schemaSQL);
    console.log('Database schema created successfully');

    console.log('Database setup complete. To insert sample data, run: bun run src/database/sampleData/insertCsvData.js');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

await setupDatabase();
