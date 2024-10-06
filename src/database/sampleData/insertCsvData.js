// This file is used to insert sample data from CSV files into the Postgres database.
// It can be ran by using the command `bun run src/database/sampleData/insertCsvData.js` bun can be replaced with npm, yarn, etc.


// .js script file so I ignored all the linting and ts warnings for my sanity.
/* eslint-disable */
// @ts-nocheck
// @ts-ignore
// eslint-disable-next-line
// @typescript-eslint/no-explicit-any
// @typescript-eslint/ban-ts-comment

import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import csv from 'csv-parser';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function insertData(tableName, filePath) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const data = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => data.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (const row of data) {
      try {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const query = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
          ON CONFLICT DO NOTHING
        `;
        await client.query(query, values);
      } catch (err) {
        console.error(`Error inserting row into ${tableName}:`, err.message);
        console.error('Problematic row:', row);
      }
    }

    await client.query('COMMIT');
    console.log(`Data inserted into ${tableName} from ${filePath}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error inserting data into ${tableName}:`, err.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const tables = [
      'Users',
      'Categories',
      'Products',
      'Inventory',
      'Orders',
      'OrderItems',
      'Carts',
      'Payments',
      'Reviews',
    ];

    for (const table of tables) {
      await insertData(table, path.join(__dirname, `${table}.csv`));
    }

    console.log('All data inserted successfully');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    await pool.end();
  }
}

main();

export { insertData };

/* eslint-enable */
