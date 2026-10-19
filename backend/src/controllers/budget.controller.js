import prisma from '../config/prisma.js';

export const upsertBudget = async (req, res) => {
  try {
    const { category, monthlyLimit, month } = req.body;

    if (!category || monthlyLimit === undefined || !month) {
      return res.status(400).json({ error: 'Category, monthlyLimit, and month are required' });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId: req.user.id,
          category,
          month,
        },
      },
      update: {
        monthlyLimit: parseFloat(monthlyLimit),
      },
      create: {
        userId: req.user.id,
        category,
        month,
        monthlyLimit: parseFloat(monthlyLimit),
      },
    });

    res.status(200).json(budget);
  } catch (error) {
    console.error('Upsert budget error:', error);
    res.status(500).json({ error: 'Failed to upsert budget' });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Month is required (YYYY-MM)' });

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.user.id,
        month,
      },
    });

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await prisma.budget.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!budget) return res.status(404).json({ error: 'Budget not found' });

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

export const getBudgetStatus = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Month is required (YYYY-MM)' });

    const [year, mon] = month.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 1);

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id, month },
    });

    // Get expenses grouped by category for the month
    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: req.user.id,
        date: { gte: startOfMonth, lt: endOfMonth },
      },
      _sum: { amount: true },
    });

    const expenseMap = expenses.reduce((acc, curr) => {
      acc[curr.category] = curr._sum.amount || 0;
      return acc;
    }, {});

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === mon;
    
    let daysLeft = 0;
    if (isCurrentMonth) {
      const lastDayOfMonth = new Date(year, mon, 0).getDate();
      daysLeft = Math.max(lastDayOfMonth - now.getDate() + 1, 1);
    } else {
      // For future/past months, we can either set to total days or 0
      daysLeft = new Date(year, mon, 0).getDate();
    }

    const status = budgets.map((b) => {
      const spent = expenseMap[b.category] || 0;
      const remaining = b.monthlyLimit - spent;
      const percentUsed = (spent / b.monthlyLimit) * 100;
      
      let zone = 'SAFE';
      if (percentUsed > 100) zone = 'EXCEEDED';
      else if (percentUsed > 80) zone = 'RED';
      else if (percentUsed > 50) zone = 'CAUTION';

      const idealDailySpend = remaining > 0 ? (remaining / daysLeft) : 0;

      return {
        id: b.id,
        category: b.category,
        limit: b.monthlyLimit,
        spent,
        remaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
        zone,
        daysLeft,
        idealDailySpend: Math.round(idealDailySpend * 100) / 100,
        enforced: true,
      };
    });

    res.json(status);
  } catch (error) {
    console.error('Get budget status error:', error);
    res.status(500).json({ error: 'Failed to fetch budget status' });
  }
};

export const copyLastMonthBudgets = async (req, res) => {
  try {
    const { currentMonth } = req.body; // YYYY-MM
    if (!currentMonth) return res.status(400).json({ error: 'currentMonth is required' });

    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    const lastMonth = date.toISOString().slice(0, 7);

    const lastMonthBudgets = await prisma.budget.findMany({
      where: { userId: req.user.id, month: lastMonth },
    });

    if (lastMonthBudgets.length === 0) {
      return res.status(404).json({ error: 'No budgets found in the previous month to copy' });
    }

    const newBudgets = await Promise.all(
      lastMonthBudgets.map((b) =>
        prisma.budget.upsert({
          where: {
            userId_category_month: {
              userId: req.user.id,
              category: b.category,
              month: currentMonth,
            },
          },
          update: { monthlyLimit: b.monthlyLimit },
          create: {
            userId: req.user.id,
            category: b.category,
            month: currentMonth,
            monthlyLimit: b.monthlyLimit,
          },
        })
      )
    );

    res.json(newBudgets);
  } catch (error) {
    console.error('Copy budgets error:', error);
    res.status(500).json({ error: 'Failed to copy budgets' });
  }
};
