import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDailySummary,
  getMonthlySummary,
  getCalendarData,
  parseSMS,
} from '../controllers/expense.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Summary routes (must be above /:id to avoid conflicts)
router.get('/summary/daily', getDailySummary);
router.get('/summary/monthly', getMonthlySummary);
router.get('/calendar', getCalendarData);
router.post('/parse-sms', parseSMS);

// CRUD routes
router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
