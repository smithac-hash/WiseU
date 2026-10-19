import prisma from '../config/prisma.js';

export const createExpense = async (req, res) => {
  try {
    const { amount, category, note, date } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ error: 'Amount and category are required' });
    }

    const expenseAmount = parseFloat(amount);
    const expenseDate = date ? new Date(date) : new Date();
    const month = expenseDate.toISOString().slice(0, 7);

    // Hard budget enforcement — no override
    const [year, mon] = month.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 1);

    const budget = await prisma.budget.findFirst({
      where: { userId: req.user.id, category, month }
    });

    if (budget) {
      const agg = await prisma.expense.aggregate({
        where: { userId: req.user.id, category, date: { gte: startOfMonth, lt: endOfMonth } },
        _sum: { amount: true }
      });
      const alreadySpent = agg._sum.amount || 0;
      const remaining = Math.round((budget.monthlyLimit - alreadySpent) * 100) / 100;

      if (alreadySpent + expenseAmount > budget.monthlyLimit) {
        return res.status(422).json({
          error: 'BUDGET_EXCEEDED',
          message: `You've used up your ${category} budget for this month.`,
          budgetLimit: budget.monthlyLimit,
          alreadySpent,
          remaining: Math.max(0, remaining)
        });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        amount: expenseAmount,
        category,
        note: note || null,
        date: expenseDate,
        userId: req.user.id,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { month, category, startDate, endDate } = req.query;
    const where = { userId: req.user.id };

    if (category) where.category = category;

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      where.date = {
        gte: new Date(year, mon - 1, 1),
        lt: new Date(year, mon, 1),
      };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const { amount, category, note, date } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(note !== undefined && { note }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

    const day = new Date(date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const grouped = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: req.user.id,
        date: { gte: day, lt: nextDay },
      },
      _sum: { amount: true },
      _count: true,
    });

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: day, lt: nextDay },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      date,
      categories: grouped.map((g) => ({
        category: g.category,
        total: g._sum.amount,
        count: g._count,
      })),
      expenses,
    });
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({ error: 'Failed to get daily summary' });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const [year, mon] = month.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 1);

    const grouped = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: req.user.id,
        date: { gte: startOfMonth, lt: endOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalSpent = grouped.reduce((sum, g) => sum + (g._sum.amount || 0), 0);
    const { monthlyIncome, savingsGoal } = req.user;
    const remaining = monthlyIncome - totalSpent;
    const actualSavings = remaining > 0 ? remaining : 0;
    const savingsProgress = savingsGoal > 0 ? Math.min((actualSavings / savingsGoal) * 100, 100) : 0;

    res.json({
      month,
      totalSpent,
      remaining,
      monthlyIncome,
      savingsGoal,
      actualSavings,
      savingsProgress: Math.round(savingsProgress * 100) / 100,
      categories: grouped.map((g) => ({
        category: g.category,
        total: g._sum.amount,
        count: g._count,
      })),
    });
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ error: 'Failed to get monthly summary' });
  }
};

export const getCalendarData = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const [year, mon] = month.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 1);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: startOfMonth, lt: endOfMonth },
      },
      select: { amount: true, date: true },
    });

    const days = {};
    expenses.forEach((exp) => {
      const key = new Date(exp.date).toISOString().split('T')[0];
      if (!days[key]) days[key] = { total: 0, count: 0 };
      days[key].total += exp.amount;
      days[key].count += 1;
    });

    // Round totals
    Object.values(days).forEach((d) => {
      d.total = Math.round(d.total * 100) / 100;
    });

    res.json(days);
  } catch (error) {
    console.error('Calendar data error:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
};
export const parseSMS = async (req, res) => {
  try {
    const { smsText } = req.body;
    if (!smsText) return res.status(400).json({ error: 'SMS text is required' });

    // 1. Extract Amount (INR, Rs, ₹ formats)
    const amountRegex = /(?:INR|Rs|₹)\s?(\d+(?:\.\d{1,2})?)/i;
    const amountMatch = smsText.match(amountRegex);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // 2. Extract Merchant (keywords after "at", "to", "vpa")
    const merchantRegex = /(?:at|to|vpa)\s+([A-Z0-9\s\.]+?)(?:\.|\s+on|\s+Avl|$)/i;
    const merchantMatch = smsText.match(merchantRegex);
    let merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown';

    // 3. Extract Date (DD-MM-YY, DD/MM/YYYY, etc.)
    const dateRegex = /(\d{1,2}[-\/\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[-\/\s]\d{2,4})/i;
    const dateMatch = smsText.match(dateRegex);
    let date = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate)) {
        date = parsedDate.toISOString().split('T')[0];
      }
    }

    // 4. Smart Category Mapping
    const categoryMapping = {
      'FOOD': ['SWIGGY', 'ZOMATO', 'DOMINOS', 'RESTAURANT', 'CAFE', 'FOOD', 'DINING'],
      'TRANSPORT': ['OLA', 'UBER', 'RAPIDO', 'IRCTC', 'METRO', 'AUTO', 'FUEL', 'PETROL'],
      'SHOPPING': ['AMAZON', 'FLIPKART', 'MYNTRA', 'RELIANCE', 'AJIO', 'MALL', 'STORE'],
      'ENTERTAINMENT': ['NETFLIX', 'SPOTIFY', 'BOOKMYSHOW', 'CINEMA', 'THEATRE', 'HOTSTAR'],
      'EDUCATION': ['COLLEGE', 'UDEMY', 'COURSERA', 'FEE', 'STATIONERY', 'BOOK'],
      'HEALTH': ['PHARMACY', 'APOLLO', 'MEDPLUS', 'HOSPITAL', 'CLINIC', 'LAB'],
      'UTILITIES': ['ELECTRICITY', 'BESCOM', 'AIRTEL', 'JIO', 'RECHARGE', 'BILL', 'WATER'],
    };

    let suggestedCategory = 'OTHER';
    const upperMerchant = merchant.toUpperCase();
    for (const [cat, keywords] of Object.entries(categoryMapping)) {
      if (keywords.some(kw => upperMerchant.includes(kw))) {
        suggestedCategory = cat;
        break;
      }
    }

    res.json({
      amount,
      merchant,
      date,
      suggestedCategory
    });
  } catch (error) {
    console.error('SMS parse error:', error);
    res.status(500).json({ error: 'Failed to parse SMS' });
  }
};
