import pool from '../utils/db.js';
import { logger } from '../utils/logger.js';

export class DatabaseService {
  async upsertProduct(product) {
    const { asin, title, price, rating, image_url } = product;
    const query = `
      INSERT INTO products (asin, title, price, rating, image_url, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (asin) 
      DO UPDATE SET 
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        rating = EXCLUDED.rating,
        image_url = COALESCE(EXCLUDED.image_url, products.image_url),
        timestamp = NOW()
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [asin, title, price, rating, image_url || null]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error upserting product:', error);
      throw error;
    }
  }

  async insertHistory(asin, price, rating) {
    const query = `
      INSERT INTO product_history (asin, price, rating, timestamp)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [asin, price, rating]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error inserting history:', error);
      throw error;
    }
  }

  async getProducts(limit = 50) {
    const query = `
      SELECT * FROM products
      ORDER BY timestamp DESC
      LIMIT $1;
    `;
    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get product by ASIN with history
  async getProductByAsin(asin) {
    const productQuery = `SELECT * FROM products WHERE asin = $1;`;
    const historyQuery = `
      SELECT * FROM product_history
      WHERE asin = $1
      ORDER BY timestamp DESC
      LIMIT 100;
    `;
    try {
      const [productResult, historyResult] = await Promise.all([
        pool.query(productQuery, [asin.toUpperCase()]),
        pool.query(historyQuery, [asin.toUpperCase()]),
      ]);

      if (productResult.rows.length === 0) {
        return null;
      }

      return {
        ...productResult.rows[0],
        history: historyResult.rows,
      };
    } catch (error) {
      logger.error('Error fetching product by ASIN:', error);
      throw error;
    }
  }

  async searchProducts(searchTerm) {
    const query = `
      SELECT * FROM products
      WHERE asin ILIKE $1 OR title ILIKE $1
      ORDER BY timestamp DESC
      LIMIT 20;
    `;
    try {
      const searchPattern = `%${searchTerm}%`;
      const result = await pool.query(query, [searchPattern]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        AVG(price) as avg_price,
        AVG(rating) as avg_rating,
        MAX(timestamp) as last_updated
      FROM products;
    `;
    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Get top price changes (last 24h) or recent products if no changes
  async getTopChanges() {
    const query = `
      WITH latest_prices AS (
        SELECT DISTINCT ON (asin)
          asin,
          price as current_price,
          timestamp
        FROM product_history
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY asin, timestamp DESC
      ),
      previous_prices AS (
        SELECT DISTINCT ON (asin)
          asin,
          price as previous_price
        FROM product_history
        WHERE timestamp < NOW() - INTERVAL '24 hours'
        ORDER BY asin, timestamp DESC
      ),
      price_changes AS (
        SELECT 
          lp.asin,
          p.title,
          p.image_url,
          lp.current_price,
          COALESCE(pp.previous_price, lp.current_price) as previous_price,
          lp.current_price - COALESCE(pp.previous_price, lp.current_price) as price_change,
          CASE 
            WHEN pp.previous_price IS NULL THEN NULL
            ELSE ((lp.current_price - COALESCE(pp.previous_price, lp.current_price)) / NULLIF(COALESCE(pp.previous_price, lp.current_price), 0) * 100)
          END as percent_change,
          CASE 
            WHEN pp.previous_price IS NULL THEN true
            ELSE false
          END as is_new_product,
          lp.timestamp
        FROM latest_prices lp
        LEFT JOIN previous_prices pp ON lp.asin = pp.asin
        JOIN products p ON lp.asin = p.asin
        WHERE lp.current_price < COALESCE(pp.previous_price, lp.current_price) OR pp.previous_price IS NULL
      )
      SELECT * FROM price_changes
      ORDER BY 
        CASE WHEN is_new_product THEN 1 ELSE 0 END,
        percent_change ASC NULLS LAST,
        timestamp DESC
      LIMIT 20;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching top changes:', error);
      throw error;
    }
  }

  // Get products with price drop alerts (>5% in 24h)
  async getPriceAlerts() {
    const query = `
      WITH latest_prices AS (
        SELECT DISTINCT ON (asin)
          asin,
          price as current_price,
          timestamp
        FROM product_history
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY asin, timestamp DESC
      ),
      previous_prices AS (
        SELECT DISTINCT ON (asin)
          asin,
          price as previous_price
        FROM product_history
        WHERE timestamp < NOW() - INTERVAL '24 hours'
        ORDER BY asin, timestamp DESC
      ),
      alerts AS (
        SELECT 
          lp.asin,
          p.title,
          lp.current_price,
          COALESCE(pp.previous_price, lp.current_price) as previous_price,
          ((lp.current_price - COALESCE(pp.previous_price, lp.current_price)) / NULLIF(COALESCE(pp.previous_price, lp.current_price), 0) * 100) as percent_change
        FROM latest_prices lp
        LEFT JOIN previous_prices pp ON lp.asin = pp.asin
        JOIN products p ON lp.asin = p.asin
        WHERE ((lp.current_price - COALESCE(pp.previous_price, lp.current_price)) / NULLIF(COALESCE(pp.previous_price, lp.current_price), 0) * 100) < -5
      )
      SELECT * FROM alerts
      ORDER BY percent_change ASC;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching price alerts:', error);
      throw error;
    }
  }
}
