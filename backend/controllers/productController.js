import { DatabaseService } from '../services/database.js';
import { logger } from '../utils/logger.js';

const dbService = new DatabaseService();

export const getProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const products = await dbService.getProducts(limit);
    res.json(products);
  } catch (error) {
    logger.error('Error in getProducts:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductByAsin = async (req, res) => {
  try {
    const { asin } = req.params;
    const product = await dbService.getProductByAsin(asin.toUpperCase());
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    logger.error('Error in getProductByAsin:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await dbService.getStats();
    res.json({
      totalProducts: parseInt(stats.total_products) || 0,
      avgPrice: parseFloat(stats.avg_price) || 0,
      avgRating: parseFloat(stats.avg_rating) || 0,
      lastUpdated: stats.last_updated || null,
    });
  } catch (error) {
    logger.error('Error in getStats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getTopChanges = async (req, res) => {
  try {
    const changes = await dbService.getTopChanges();
    res.json(changes);
  } catch (error) {
    logger.error('Error in getTopChanges:', error);
    res.status(500).json({ error: 'Failed to fetch top changes' });
  }
};

export const getPriceAlerts = async (req, res) => {
  try {
    const alerts = await dbService.getPriceAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Error in getPriceAlerts:', error);
    res.status(500).json({ error: 'Failed to fetch price alerts' });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const products = await dbService.searchProducts(q.trim());
    res.json(products);
  } catch (error) {
    logger.error('Error in searchProducts:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};
