// Global progress tracker for scraping jobs
class ProgressTracker {
  constructor() {
    this.jobs = new Map();
  }

  createJob(jobId, keywords) {
    this.jobs.set(jobId, {
      jobId,
      keywords,
      status: 'running',
      currentKeyword: '',
      currentPage: 0,
      totalPages: 0,
      productsScraped: 0,
      productsProcessed: 0,
      startTime: Date.now(),
      errors: 0,
      completed: false,
    });
  }

  updateProgress(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
    }
  }

  getProgress(jobId) {
    return this.jobs.get(jobId) || null;
  }

  completeJob(jobId, result) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.completed = true;
      job.result = result;
      job.endTime = Date.now();
      job.duration = ((job.endTime - job.startTime) / 1000).toFixed(2);
    }
  }

  failJob(jobId, error) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.completed = true;
      job.error = error.message || error;
      job.endTime = Date.now();
    }
  }

  removeJob(jobId) {
    this.jobs.delete(jobId);
    // Auto-remove old completed jobs after 1 hour
    setTimeout(() => {
      this.jobs.delete(jobId);
    }, 3600000);
  }
}

export const progressTracker = new ProgressTracker();
