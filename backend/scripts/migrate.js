import pool from '../utils/db.js';
import { logger } from '../utils/logger.js';

const migrate = async () => {
  const client = await pool.connect();

  try {
    logger.info('Running database migrations...');

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        asin TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        rating DECIMAL(3, 2),
        image_url TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add image_url column if it doesn't exist (for existing databases)
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);

    // Create product_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_history (
        id SERIAL PRIMARY KEY,
        asin TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        rating DECIMAL(3, 2),
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
      CREATE INDEX IF NOT EXISTS idx_products_timestamp ON products(timestamp);
      CREATE INDEX IF NOT EXISTS idx_history_asin ON product_history(asin);
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON product_history(timestamp);
    `);

    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
