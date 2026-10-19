import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getMonthlyAnalysis,
  getDailyTip,
  getSavingsPlan
} from '../controllers/ai.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post('/monthly-analysis', getMonthlyAnalysis);
router.post('/daily-tip', getDailyTip);
router.post('/savings-plan', getSavingsPlan);

export default router;
