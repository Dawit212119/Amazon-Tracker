import express from 'express';
import * as refreshController from '../controllers/refreshController.js';

const router = express.Router();

router.post('/', refreshController.triggerRefresh);
router.get('/progress/:jobId', refreshController.getProgress);

export default router;
