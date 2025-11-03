import express from 'express';
import * as productController from '../controllers/productController.js';

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/:asin', productController.getProductByAsin);
router.get('/stats/summary', productController.getStats);
router.get('/alerts/price', productController.getPriceAlerts);

export default router;
