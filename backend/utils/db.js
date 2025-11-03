import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Support both connection string and individual config
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string if provided (e.g., Neon, Supabase)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  };
} else {
  // Use individual config for local PostgreSQL
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'amazon_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  };
}

const pool = new Pool(poolConfig);

export default pool;
