import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

export class AmazonScraper {
  constructor(config = {}) {
    this.keywords = config.keywords || [];
    this.delayMin = config.delayMin || 2000;
    this.delayMax = config.delayMax || 5000;
    this.maxPages = config.maxPages || 3;

    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    };
  }

  async delay() {
    const ms = Math.floor(Math.random() * (this.delayMax - this.delayMin) + this.delayMin);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  extractAsin(url) {
    const asinMatch = url.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    return asinMatch ? asinMatch[1] : null;
  }

  parsePrice(priceText) {
    if (!priceText) return null;
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  parseRating(ratingText) {
    if (!ratingText) return null;
    const cleaned = ratingText.replace(/[^0-9.]/g, '');
    const rating = parseFloat(cleaned);
    return isNaN(rating) ? null : rating;
  }

  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async scrapeSearchPage(keyword, page = 1, retryCount = 0) {
    const maxRetries = 3;
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&page=${page}`;

    try {
      logger.info(`Scraping: ${searchUrl}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
      await this.delay();

      const headers = {
        ...this.headers,
        'User-Agent': this.getRandomUserAgent(),
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.amazon.com/',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      };

      const response = await axios.get(searchUrl, {
        headers,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status < 500;
        },
      });

      if (response.status === 503 || response.status === 403) {
        if (retryCount < maxRetries) {
          const waitTime = (retryCount + 1) * 5000; // Exponential backoff: 5s, 10s, 15s
          logger.warn(`Received ${response.status} error. Retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return this.scrapeSearchPage(keyword, page, retryCount + 1);
        } else {
          logger.error(`Failed after ${maxRetries} retries. Amazon may be blocking requests.`);
          logger.info(
            '💡 Tip: Try using specific product ASINs or wait a few minutes before retrying.'
          );
          return [];
        }
      }

      if (response.status !== 200) {
        logger.warn(`Received status ${response.status} for ${searchUrl}`);
        return [];
      }

      const $ = cheerio.load(response.data);
      const products = [];

      $('[data-asin]').each((i, element) => {
        const $el = $(element);
        const asin = $el.attr('data-asin');

        if (!asin || asin === '' || products.find((p) => p.asin === asin)) {
          return;
        }

        const title =
          $el.find('h2 a span').first().text().trim() ||
          $el.find('[data-cy="title-recipe"] span').first().text().trim() ||
          $el.find('h2').text().trim();

        // Extract price - try multiple selectors
        const priceText =
          $el.find('.a-price-whole').first().text() ||
          $el.find('.a-price .a-offscreen').first().text() ||
          $el.find('[data-a-color="price"] span').first().text() ||
          $el.find('.a-price-symbol + .a-price-whole').first().text();
        const price = this.parsePrice(priceText);

        // Extract rating
        const ratingText =
          $el.find('[aria-label*="stars"]').first().attr('aria-label') ||
          $el.find('.a-icon-alt').first().text();
        const rating = this.parseRating(ratingText);

        // Extract image URL - try multiple selectors
        let imageUrl =
          $el.find('img.s-image').first().attr('src') ||
          $el.find('img.s-image').first().attr('data-src') ||
          $el.find('img[data-image-latency]').first().attr('src') ||
          $el.find('img[data-image-latency]').first().attr('data-src') ||
          $el.find('.s-product-image-container img').first().attr('src') ||
          $el.find('.s-product-image-container img').first().attr('data-src') ||
          $el.find('img').first().attr('src') ||
          $el.find('img').first().attr('data-src');

        if (imageUrl) {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://www.amazon.com' + imageUrl;
          }

          imageUrl = imageUrl.replace(/\._AC_SL\d+_\./g, '._AC_.');

          if (!imageUrl.startsWith('http')) {
            imageUrl = null;
          }
        }

        if (asin && title && price) {
          products.push({
            asin,
            title: title.substring(0, 500),
            price,
            rating: rating || null,
            image_url: imageUrl || null,
            timestamp: new Date(),
          });
        }
      });

      logger.info(`Found ${products.length} products for keyword "${keyword}" page ${page}`);
      return products;
    } catch (error) {
      if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        const waitTime = (retryCount + 1) * 5000;
        logger.warn(`Network error. Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.scrapeSearchPage(keyword, page, retryCount + 1);
      }
      logger.error(`Error scraping ${searchUrl}:`, error.message);
      return [];
    }
  }

  async scrapeKeyword(keyword) {
    const allProducts = [];
    const pagesToScrape = Math.min(this.maxPages, 5);

    for (let page = 1; page <= pagesToScrape; page++) {
      const products = await this.scrapeSearchPage(keyword, page);
      if (products.length === 0) break;
      allProducts.push(...products);
      await this.delay();
    }

    const uniqueProducts = [];
    const seenAsins = new Set();
    for (const product of allProducts) {
      if (!seenAsins.has(product.asin)) {
        seenAsins.add(product.asin);
        uniqueProducts.push(product);
      }
    }

    return uniqueProducts;
  }

  async scrapeAll() {
    logger.info(`Starting scrape for keywords: ${this.keywords.join(', ')}`);
    const allProducts = [];

    for (const keyword of this.keywords) {
      logger.info(`Scraping keyword: ${keyword}`);
      const products = await this.scrapeKeyword(keyword);
      allProducts.push(...products);
      await this.delay();
    }

    logger.info(`Total products scraped: ${allProducts.length}`);
    return allProducts;
  }
}
