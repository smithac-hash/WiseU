import { safeRedisGet, safeRedisSet } from '../config/redis.js';
import { callMCPTool } from '../mcp/wiseu-mcp-server.js';
import { 
  getSpendingInsights, 
  getDailyInsight, 
  getSavingsTips 
} from '../utils/membrain.js';

export const getMonthlyAnalysis = async (req, res) => {
  const { month } = req.body;
  const userId = req.user.id;

  if (!month) return res.status(400).json({ error: "Month is required (YYYY-MM)" });

  const cacheKey = `wiseu:analysis:${userId}:${month}`;

  try {
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const expenses = await callMCPTool('get_monthly_expenses', { userId, month });
    const budgets = await callMCPTool('get_budget_status', { userId, month });
    const savings = await callMCPTool('get_savings_progress', { userId, month });

    const prompt = `
      You are WiseU, a friendly AI financial coach for Indian students.
      Monthly income: ₹${expenses.income}
      Savings goal: ₹${expenses.savingsGoal}
      Current savings: ₹${savings.currentSavings}
      Spending by category: ${JSON.stringify(expenses.byCategory)}
      Budget status: ${JSON.stringify(budgets)}
      
      Return ONLY valid JSON:
      {
        "summary": "string (2 sentences)",
        "tips": ["string", "string", "string"],
        "cutbackCategory": "string",
        "savingsOutlook": "string",
        "savingsOutlookEmoji": "string",
        "projectedSavings": number
      }
    `;

    const result = await getSpendingInsights(prompt);

    await safeRedisSet(cacheKey, JSON.stringify(result), "EX", 6 * 60 * 60);
    res.json(result);
  } catch (error) {
    console.error("Monthly analysis error:", error);
    res.status(500).json({ error: "Failed to generate AI analysis" });
  }
};

export const getDailyTip = async (req, res) => {
  const { date } = req.body;
  const userId = req.user.id;
  const today = date || new Date().toISOString().slice(0, 10);

  const cacheKey = `wiseu:dailytip:${userId}:${today}`;

  try {
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json({ tip: cached });

    const daily = await callMCPTool('get_daily_expenses', { userId, date: today });
    const categories = [...new Set(daily.expenses.map(e => e.category))];
    const dailyBudget = Math.round(req.user.monthlyIncome / 30);

    const prompt = `
      You are WiseU, a supportive student finance friend. 
      The student spent ₹${daily.total} today on ${categories.join(', ') || 'nothing yet'}. 
      Their safe daily budget is ₹${dailyBudget}. 
      Give ONE friendly tip under 18 words. Sound like a supportive friend.
      Return ONLY the tip text.
    `;

    const tip = await getDailyInsight(prompt);
    
    await safeRedisSet(cacheKey, tip, "EX", 24 * 60 * 60);
    res.json({ tip });
  } catch (error) {
    console.error("Daily tip error:", error);
    res.status(500).json({ error: "Failed to generate daily tip" });
  }
};

export const getSavingsPlan = async (req, res) => {
  const userId = req.user.id;
  const month = new Date().toISOString().slice(0, 7);
  const cacheKey = `wiseu:savingsplan:${userId}`;

  try {
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const top3 = await callMCPTool('get_top_spending_categories', { userId, month });
    const savings = await callMCPTool('get_savings_progress', { userId, month });
    const user = req.user;

    const prompt = `
      You are WiseU, a financial planning expert.
      Income: ₹${user.monthlyIncome}, Goal: ₹${user.savingsGoal}/month, actual savings so far this month: ₹${savings.currentSavings}.
      Top categories of spending: ${top3.map(c => c.category + ' ₹' + c.amount).join(', ')}.
      
      Return ONLY valid JSON:
      {
        "canAchieveGoal": boolean,
        "shortfallAmount": number,
        "plan": ["string", "string", "string"],
        "encouragement": "string"
      }
    `;

    const result = await getSavingsTips(prompt);

    await safeRedisSet(cacheKey, JSON.stringify(result), "EX", 12 * 60 * 60);
    res.json(result);
  } catch (error) {
    console.error("Savings plan error:", error);
    res.status(500).json({ error: "Failed to generate savings plan" });
  }
};

