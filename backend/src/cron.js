import cron from 'node-cron';
import prisma from './config/prisma.js';

export const initCronJobs = () => {
  // Run daily at 8:00 PM IST (14:30 UTC)
  // IST is UTC + 5:30. So 20:00 IST = 14:30 UTC.
  cron.schedule('30 14 * * *', async () => {
    console.log('🚀 Running daily budget and savings check...');
    try {
      const users = await prisma.user.findMany({
        include: {
          budgets: true,
          expenses: true,
        },
      });

      const now = new Date();
      const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
      const [year, mon] = currentMonthStr.split('-').map(Number);
      const startOfMonth = new Date(year, mon - 1, 1);
      const endOfMonth = new Date(year, mon, 1);

      const daysInMonth = new Date(year, mon, 0).getDate();
      const currentDay = now.getDate();
      const monthProgress = currentDay / daysInMonth;

      for (const user of users) {
        // 1. Check Budget Thresholds
        const currentBudgets = user.budgets.filter((b) => b.month === currentMonthStr);
        
        for (const budget of currentBudgets) {
          const totalSpent = await prisma.expense.aggregate({
            where: {
              userId: user.id,
              category: budget.category,
              date: { gte: startOfMonth, lt: endOfMonth },
            },
            _sum: { amount: true },
          });

          const spent = totalSpent._sum.amount || 0;
          const percentUsed = (spent / budget.monthlyLimit) * 100;

          if (percentUsed > 80) {
            const remaining = Math.max(0, budget.monthlyLimit - spent);
            const message = `You've used ${Math.round(percentUsed)}% of your ${budget.category} budget this month. ₹${remaining.toFixed(2)} left.`;
            
            // Avoid duplicate notifications for the same budget/message on the same day if needed, 
            // but for simplicity, we create one.
            await prisma.notification.create({
              data: {
                userId: user.id,
                message,
              },
            });
          }
        }

        // 2. Check Savings Target Pace
        if (user.savingsGoal > 0) {
          const totalExpenses = await prisma.expense.aggregate({
            where: {
              userId: user.id,
              date: { gte: startOfMonth, lt: endOfMonth },
            },
            _sum: { amount: true },
          });

          const spent = totalExpenses._sum.amount || 0;
          const currentSavings = user.monthlyIncome - spent;
          const targetSavingsAtThisPoint = user.savingsGoal * monthProgress;

          if (currentSavings < targetSavingsAtThisPoint) {
            const gap = targetSavingsAtThisPoint - currentSavings;
            const message = `WiseU tip: You need to save ₹${gap.toFixed(2)} more to hit your goal this month.`;
            
            await prisma.notification.create({
              data: {
                userId: user.id,
                message,
              },
            });
          }
        }
      }
      console.log('✅ Daily checks completed.');
    } catch (error) {
      console.error('❌ Cron job error:', error);
    }
  });
};
