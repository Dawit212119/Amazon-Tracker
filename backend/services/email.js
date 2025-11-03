import { logger } from '../utils/logger.js';

// Email notification service stub
// In production, integrate with services like SendGrid, AWS SES, etc.
export class EmailService {
  async sendPriceAlert(recipient, product, priceChange) {
    // Stub implementation - logs to console
    logger.info('📧 EMAIL ALERT (stub):');
    logger.info(`To: ${recipient}`);
    logger.info(`Product: ${product.title}`);
    logger.info(`ASIN: ${product.asin}`);
    logger.info(`Price Drop: ${priceChange.percentChange.toFixed(2)}%`);
    logger.info(`Old Price: $${priceChange.previousPrice}`);
    logger.info(`New Price: $${priceChange.currentPrice}`);
    logger.info('---');

    // In production:
    // const emailBody = this.formatPriceAlertEmail(product, priceChange);
    // await sendGrid.send({ to: recipient, subject: 'Price Alert', html: emailBody });
  }

  async sendWeeklyDigest(recipient, stats) {
    logger.info('📧 WEEKLY DIGEST (stub):');
    logger.info(`To: ${recipient}`);
    logger.info(`Stats: ${JSON.stringify(stats, null, 2)}`);
    logger.info('---');
  }
}

