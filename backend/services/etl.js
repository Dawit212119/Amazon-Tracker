import { AmazonScraper } from './scraper.js';
import { DatabaseService } from './database.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

export class ETLService {
  constructor() {
    this.scraper = new AmazonScraper({
      keywords: process.env.SCRAPER_KEYWORDS ? process.env.SCRAPER_KEYWORDS.split(',') : [],
      delayMin: parseInt(process.env.SCRAPER_DELAY_MIN) || 2000,
      delayMax: parseInt(process.env.SCRAPER_DELAY_MAX) || 5000,
      maxPages: parseInt(process.env.SCRAPER_MAX_PAGES) || 3,
    });
    this.db = new DatabaseService();
  }

  cleanProduct(product) {
    const cleaned = {
      asin: product.asin?.trim().toUpperCase(),
      title: product.title?.trim().substring(0, 500),
      price: product.price ? parseFloat(product.price) : null,
      rating: product.rating ? parseFloat(product.rating) : null,
      image_url: product.image_url || null,
    };

    if (!cleaned.asin || cleaned.asin.length !== 10) {
      return null;
    }
    if (!cleaned.title || cleaned.title.length < 5) {
      return null;
    }
    if (!cleaned.price || cleaned.price <= 0 || cleaned.price > 100000) {
      return null;
    }
    if (cleaned.rating && (cleaned.rating < 0 || cleaned.rating > 5)) {
      cleaned.rating = null;
    }

    return cleaned;
  }

  async processProducts(products) {
    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const cleaned = this.cleanProduct(product);
        if (!cleaned) {
          logger.warn(`Skipping invalid product: ${product.asin || 'unknown'}`);
          errors++;
          continue;
        }

        const existing = await this.db.getProductByAsin(cleaned.asin);
        const previousPrice = existing ? parseFloat(existing.price) : null;
        const currentPrice = cleaned.price;

        await this.db.upsertProduct(cleaned);
        updated++;

        await this.db.insertHistory(cleaned.asin, cleaned.price, cleaned.rating);

        if (previousPrice && previousPrice !== currentPrice) {
          const change = ((currentPrice - previousPrice) / previousPrice) * 100;
          logger.info(
            `Price change for ${cleaned.asin}: $${previousPrice} -> $${currentPrice} (${change.toFixed(2)}%)`
          );
        }

        processed++;
      } catch (error) {
        logger.error(`Error processing product ${product.asin}:`, error.message);
        errors++;
      }
    }

    return { processed, updated, errors };
  }

  async run(jobId = null, progressCallback = null) {
    const startTime = Date.now();
    logger.info('=== ETL Job Started ===');

    try {
      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      logger.info('Step 1: Extracting data...');
      const allProducts = [];

      for (let keywordIndex = 0; keywordIndex < this.scraper.keywords.length; keywordIndex++) {
        const keyword = this.scraper.keywords[keywordIndex];

        if (progressCallback) {
          progressCallback({
            currentKeyword: keyword,
            keywordIndex: keywordIndex + 1,
            totalKeywords: this.scraper.keywords.length,
          });
        }

        const pagesToScrape = Math.min(this.scraper.maxPages, 5);
        for (let page = 1; page <= pagesToScrape; page++) {
          if (progressCallback) {
            progressCallback({
              currentKeyword: keyword,
              currentPage: page,
              totalPages: pagesToScrape,
            });
          }

          const products = await this.scraper.scrapeSearchPage(keyword, page);

          if (products.length === 0 && page === 1) {
            break;
          }

          if (products.length > 0) {
            const results = await this.processProducts(products);
            totalProcessed += results.processed;
            totalUpdated += results.updated;
            totalErrors += results.errors;

            if (progressCallback) {
              progressCallback({
                productsScraped: products.length,
                productsProcessed: totalProcessed,
                productsUpdated: totalUpdated,
                errors: totalErrors,
              });
            }

            allProducts.push(...products);
          }

          await this.scraper.delay();
        }
      }

      if (allProducts.length === 0) {
        logger.warn('No products scraped. ETL job completed with no data.');
        return { success: false, message: 'No products found' };
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info('=== ETL Job Completed ===');
      logger.info(`Duration: ${duration}s`);
      logger.info(`Processed: ${totalProcessed}`);
      logger.info(`Updated: ${totalUpdated}`);
      logger.info(`Errors: ${totalErrors}`);

      return {
        success: true,
        duration,
        processed: totalProcessed,
        updated: totalUpdated,
        errors: totalErrors,
      };
    } catch (error) {
      logger.error('ETL Job Failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
