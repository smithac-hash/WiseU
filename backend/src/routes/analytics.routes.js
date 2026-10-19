import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();
router.use(requireAuth);

// ── Helpers ────────────────────────────────────────────

const clamp = (val, min = 0, max = 1) => Math.max(min, Math.min(max, val));

const getGrade = (score) => {
  if (score >= 90) return { grade: 'A', label: 'Excellent', color: '#1D9E75' };
  if (score >= 75) return { grade: 'B', label: 'Good', color: '#1D9E75' };
  if (score >= 60) return { grade: 'C', label: 'Fair', color: '#EF9F27' };
  if (score >= 40) return { grade: 'D', label: 'Needs Work', color: '#E24B4A' };
  return { grade: 'F', label: 'Critical', color: '#E24B4A' };
};

const stdDev = (arr) => {
  if (arr.length <= 1) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
};

// ── GET /api/analytics/health-score ────────────────────

router.get('/health-score', async (req, res) => {
  try {
    const userId = req.user.id;
    const month = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(month + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

    const [user, budgets, expenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.budget.findMany({ where: { userId, month } }),
      prisma.expense.findMany({ where: { userId, date: { gte: startOfMonth, lt: endOfMonth } } })
    ]);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 1. Budget Adherence (35%)
    let budgetScore = 1;
    if (budgets.length > 0) {
      const catSpend = {};
      expenses.forEach(e => { catSpend[e.category] = (catSpend[e.category] || 0) + e.amount; });
      const scores = budgets.map(b => clamp(1 - (catSpend[b.category] || 0) / b.monthlyLimit));
      budgetScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    // 2. Savings Progress (35%)
    const savingsGoal = user.savingsGoal || 1;
    const actualSavings = Math.max(0, (user.monthlyIncome || 0) - totalSpent);
    const savingsScore = clamp(actualSavings / savingsGoal);

    // 3. Spending Consistency (30%) — lower std dev of daily spend = higher score
    const dailySpend = {};
    expenses.forEach(e => {
      const day = e.date.toISOString().slice(0, 10);
      dailySpend[day] = (dailySpend[day] || 0) + e.amount;
    });
    const dailyAmounts = Object.values(dailySpend);
    let consistencyScore = 1;
    if (dailyAmounts.length > 1) {
      const mean = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
      const sd = stdDev(dailyAmounts);
      const cv = mean > 0 ? sd / mean : 0; // coefficient of variation
      consistencyScore = clamp(1 - cv);
    }

    const budgetAdherence = Math.round(budgetScore * 100);
    const savingsProgress = Math.round(savingsScore * 100);
    const spendingConsistency = Math.round(consistencyScore * 100);
    const score = Math.round(budgetAdherence * 0.35 + savingsProgress * 0.35 + spendingConsistency * 0.30);
    const { grade, label, color } = getGrade(score);

    let message = '';
    if (score >= 90) message = "Outstanding! You're a financial rockstar! 🌟";
    else if (score >= 75) message = "You're managing well! Small tweaks can push you to an A.";
    else if (score >= 60) message = "Decent progress. Tighten a few categories to level up.";
    else if (score >= 40) message = "You're slipping — review your biggest expenses.";
    else message = "Time for a financial reset. Let's build better habits!";

    res.json({ score, grade, label, color, breakdown: { budgetAdherence, savingsProgress, spendingConsistency }, message });
  } catch (error) {
    console.error('Health score error:', error);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// ── GET /api/analytics/anomalies ───────────────────────

router.get('/anomalies', async (req, res) => {
  try {
    const userId = req.user.id;
    const month = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(month + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

    const [user, expenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({ where: { userId, date: { gte: startOfMonth, lt: endOfMonth } }, orderBy: { date: 'desc' } })
    ]);

    // Category averages
    const catTotals = {};
    const catCounts = {};
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    });
    const catAvg = {};
    Object.keys(catTotals).forEach(c => { catAvg[c] = catTotals[c] / catCounts[c]; });

    const anomalies = [];
    const incomeThreshold = (user.monthlyIncome || Infinity) * 0.4;

    expenses.forEach(e => {
      const reasons = [];
      const avg = catAvg[e.category] || 0;

      if (avg > 0 && e.amount > avg * 2.5) {
        reasons.push(`${(e.amount / avg).toFixed(0)}x higher than your average ${e.category} spend`);
      }
      if (e.amount > incomeThreshold && user.monthlyIncome > 0) {
        reasons.push(`This single transaction is over 40% of your monthly income`);
      }

      if (reasons.length > 0) {
        anomalies.push({
          id: e.id,
          amount: e.amount,
          category: e.category,
          note: e.note || 'Unknown',
          date: e.date.toISOString().split('T')[0],
          reason: reasons.join('. '),
          severity: e.amount > incomeThreshold ? 'high' : 'medium'
        });
      }
    });

    res.json({ anomalies });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// ── GET /api/analytics/forecast ────────────────────────

router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const startOfMonth = new Date(month + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);
    const totalDaysInMonth = Math.round((endOfMonth - startOfMonth) / (1000 * 60 * 60 * 24));

    const [user, expenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({ where: { userId, date: { gte: startOfMonth, lt: endOfMonth } } })
    ]);

    const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
    const daysElapsed = Math.max(1, Math.ceil((now - startOfMonth) / (1000 * 60 * 60 * 24)));
    const daysRemaining = totalDaysInMonth - daysElapsed;
    const dailyAverage = Math.round(spentSoFar / daysElapsed);
    const forecastTotal = Math.round((spentSoFar / daysElapsed) * totalDaysInMonth);
    const monthlyIncome = user.monthlyIncome || 0;

    let status, message, recommendation;
    if (forecastTotal > monthlyIncome && monthlyIncome > 0) {
      status = 'OVER';
      message = `At this pace you'll overspend by ₹${(forecastTotal - monthlyIncome).toLocaleString('en-IN')} this month!`;
      const safeDaily = daysRemaining > 0 ? Math.round((monthlyIncome - spentSoFar) / daysRemaining) : 0;
      recommendation = safeDaily > 0
        ? `Reduce daily spend to ₹${safeDaily} to stay within income.`
        : 'You have already exceeded your monthly income.';
    } else if (forecastTotal > monthlyIncome * 0.9 && monthlyIncome > 0) {
      status = 'WARNING';
      message = `You're close to your income limit — projected spend ₹${forecastTotal.toLocaleString('en-IN')}.`;
      recommendation = 'Be mindful the next few days to avoid going over.';
    } else {
      status = 'ON_TRACK';
      message = `Great pace! You're projected to spend ₹${forecastTotal.toLocaleString('en-IN')} this month.`;
      recommendation = 'Keep up the good habits!';
    }

    res.json({ spentSoFar, forecastTotal, monthlyIncome, daysElapsed, daysRemaining, dailyAverage, status, message, recommendation });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

export default router;
