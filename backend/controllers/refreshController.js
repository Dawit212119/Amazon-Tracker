import { ETLService } from '../services/etl.js';
import { logger } from '../utils/logger.js';
import { progressTracker } from '../utils/progressTracker.js';
import { randomUUID } from 'crypto';

const runningJobs = new Set();

export const triggerRefresh = async (req, res) => {
  // Only use keywords provided by user - no defaults
  let keywords = [];

  // Get keywords from request body
  if (req.body && req.body.keywords) {
    if (typeof req.body.keywords === 'string') {
      keywords = req.body.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    } else if (Array.isArray(req.body.keywords)) {
      keywords = req.body.keywords.map((k) => String(k).trim()).filter((k) => k.length > 0);
    }
  }

  // Require user to provide keywords - no default fallback
  if (keywords.length === 0) {
    return res.status(400).json({
      error: 'No keywords provided. Please provide at least one keyword to search for.',
    });
  }

  // Generate unique job ID
  const jobId = randomUUID();
  logger.info(`Manual refresh triggered with keywords: ${keywords.join(', ')} (Job ID: ${jobId})`);

  // Create progress tracking
  progressTracker.createJob(jobId, keywords);
  runningJobs.add(jobId);

  // Run ETL asynchronously with custom keywords
  const etlService = new ETLService();
  etlService.scraper.keywords = keywords; // Override keywords

  // Progress callback
  const progressCallback = (progress) => {
    progressTracker.updateProgress(jobId, progress);
  };

  etlService
    .run(jobId, progressCallback)
    .then((result) => {
      progressTracker.completeJob(jobId, result);
      runningJobs.delete(jobId);
      logger.info(`Manual refresh completed (Job ID: ${jobId}):`, result);
    })
    .catch((error) => {
      progressTracker.failJob(jobId, error);
      runningJobs.delete(jobId);
      logger.error(`Manual refresh failed (Job ID: ${jobId}):`, error);
    });

  // Return immediately with job ID
  res.json({
    message: `Refresh job started with keywords: ${keywords.join(', ')}.`,
    status: 'processing',
    keywords: keywords,
    jobId: jobId,
  });
};

export const getProgress = async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID required' });
  }

  const progress = progressTracker.getProgress(jobId);

  if (!progress) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(progress);
};
