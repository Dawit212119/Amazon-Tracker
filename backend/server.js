import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './utils/db.js';
import { logger } from './utils/logger.js';
import { startScheduler } from './jobs/scheduler.js';
import productRoutes from './routes/products.js';
import refreshRoutes from './routes/refresh.js';
import topChangesRoutes from './routes/topChanges.js';
import * as productController from './controllers/productController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', msg: error });
  }
});

app.use('/api/products', productRoutes);
app.use('/api/refresh', refreshRoutes);
app.use('/api/top-changes', topChangesRoutes);

app.get('/api/stats', productController.getStats);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start scheduler
    startScheduler();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
