import cron from 'node-cron';
import { ETLService } from '../services/etl.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

let isRunning = false;

export const startScheduler = () => {
  const schedule = process.env.CRON_SCHEDULE || '0 * * * *'; // Default: hourly

  logger.info(`Starting scheduler with cron: ${schedule}`);

  cron.schedule(schedule, async () => {
    if (isRunning) {
      logger.warn('Previous ETL job still running, skipping this cycle');
      return;
    }

    isRunning = true;
    logger.info('=== Scheduled ETL Job Triggered ===');

    const etlService = new ETLService();
    try {
      const result = await etlService.run();
      logger.info('Scheduled ETL completed:', result);
    } catch (error) {
      logger.error('Scheduled ETL failed:', error);
    } finally {
      isRunning = false;
    }
  });

  logger.info('Scheduler started successfully');
};

