import express from 'express';
import prisma from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getSpendingInsights,
  getSavingsTips,
  getDailyInsight
} from '../utils/membrain.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.id;
  const month = new Date().toISOString().slice(0, 7);

  try {
    console.log(`🔍 [Insights] Fetching for user ${userId}...`);
    const start = Date.now();

    const [spendingInsights, savingsTips, dailyInsight] = await Promise.all([
      getSpendingInsights(userId, month).then(res => { console.log("✅ Spending insights done"); return res; }),
      getSavingsTips(userId).then(res => { console.log("✅ Savings tips done"); return res; }),
      getDailyInsight(userId).then(res => { console.log("✅ Daily insight done"); return res; })
    ]);

    console.log(`✨ [Insights] Completed in ${Date.now() - start}ms`);

    res.json({
      spendingInsights,
      savingsTips,
      dailyInsight
    });
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

router.get('/daily-spendable', async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const month = now.toISOString().slice(0, 7);

  const [year, mon] = month.split('-').map(Number);
  const startOfMonth = new Date(year, mon - 1, 1);
  const endOfMonth = new Date(year, mon, 1);
  const totalDaysInMonth = new Date(year, mon, 0).getDate();
  const todayNum = now.getDate();
  const daysLeft = totalDaysInMonth - todayNum + 1; // including today

  try {
    const [user, monthExpenses, todayExpenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lt: endOfMonth }
        }
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      })
    ]);

    const totalSpentThisMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const spentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingIncome = user.monthlyIncome - totalSpentThisMonth + spentToday; // Income left before today's spending
    const targetSavings = user.savingsGoal;

    const dailySpendable = Math.max(0, Math.round((remainingIncome - targetSavings) / daysLeft));
    const remainingToday = Math.max(0, dailySpendable - spentToday);

    let status = 'ON_TRACK';
    let message = `You can spend ₹${dailySpendable} today and still hit your savings goal!`;

    if (dailySpendable <= 0) {
      status = 'OVERSPENT';
      message = "You've overspent vs your savings goal. Try to recover tomorrow.";
    } else if (spentToday >= dailySpendable) {
      status = 'EXHAUSTED';
      message = "Today's budget used up. No more spending today!";
    } else if (spentToday > dailySpendable * 0.5) {
      status = 'TIGHT';
      message = "Slow down! You're halfway through today's budget.";
    } else {
      status = 'ON_TRACK';
      message = `You're on track to hit your ₹${targetSavings} savings goal! 🎯`;
    }

    res.json({
      dailySpendable,
      spentToday,
      remainingToday,
      daysLeft,
      monthlyIncome: user.monthlyIncome,
      totalSpentThisMonth,
      savingsGoal: targetSavings,
      status,
      message
    });
  } catch (error) {
    console.error("Daily spendable error:", error);
    res.status(500).json({ error: "Failed to calculate daily spendable" });
  }
});

router.get('/memory-graph', async (req, res) => {
  const userId = req.user.id;

  try {
    const { getMemoryGraphRaw } = await import('../utils/membrain.js');
    
    // 1. Fetch data from DB and Membrain
    const [user, expenses, budgets, membrainData] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({ 
        where: { userId }, 
        orderBy: { date: 'desc' }, 
        take: 20 
      }),
      prisma.budget.findMany({ where: { userId } }),
      getMemoryGraphRaw(userId)
    ]);

    const { total } = membrainData;
    const nodes = [];
    const edges = [];

    // 2. Central Nodes
    nodes.push({ id: 'user', label: user.name || 'User', type: 'user', size: 40 });
    nodes.push({ id: 'goal', label: `Goal ₹${user.savingsGoal}`, type: 'goal', size: 35 });
    nodes.push({ id: 'income', label: `Income ₹${user.monthlyIncome}`, type: 'profile', size: 30 });
    nodes.push({ id: 'summary', label: `${new Date().toLocaleString('default', { month: 'long' })} Summary`, type: 'summary', size: 30 });

    // 3. User Connections
    edges.push({ source: 'user', target: 'goal', label: 'aims for' });
    edges.push({ source: 'user', target: 'income', label: 'earns' });
    edges.push({ source: 'user', target: 'summary', label: 'has' });
    edges.push({ source: 'income', target: 'goal', label: 'funds' });
    edges.push({ source: 'summary', target: 'goal', label: 'impacts' });

    // 4. Budget Nodes
    budgets.forEach(b => {
      const budgetId = `budget_${b.category}`;
      nodes.push({
        id: budgetId,
        label: `${b.category} Budget ₹${b.monthlyLimit}`,
        type: 'budget',
        size: 25
      });
      edges.push({ source: 'user', target: budgetId, label: 'manages' });
    });

    // 5. Expense Nodes
    expenses.forEach(e => {
      nodes.push({
        id: e.id,
        label: `₹${e.amount} ${e.category}`,
        type: 'expense',
        size: Math.min(10 + e.amount / 100, 50),
        amount: e.amount,
        date: e.date.toISOString().split('T')[0],
        note: e.note || '',
        category: e.category
      });

      // Link to summary
      edges.push({ source: e.id, target: 'summary', label: 'part of' });

      // Link to its budget category if exists
      const hasBudget = budgets.some(b => b.category === e.category);
      if (hasBudget) {
        edges.push({ source: e.id, target: `budget_${e.category}`, label: 'counts against' });
      }
    });

    res.json({
      nodes,
      edges,
      totalMemories: total || 0,
      userName: user.name
    });
  } catch (error) {
    console.error("Memory graph error:", error);
    res.status(500).json({ error: "Failed to generate memory graph" });
  }
});

export default router;
