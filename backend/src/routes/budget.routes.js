import express from 'express';
import {
  upsertBudget,
  getBudgets,
  deleteBudget,
  getBudgetStatus,
  copyLastMonthBudgets,
} from '../controllers/budget.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', upsertBudget);
router.get('/', getBudgets);
router.get('/status', getBudgetStatus);
router.post('/copy', copyLastMonthBudgets);
router.delete('/:id', deleteBudget);

export default router;
