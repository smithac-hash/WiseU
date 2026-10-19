import axios from 'axios';
import prisma from '../config/prisma.js';

const MEMBRAIN_URL = "https://mem-brain-api-cutover-v4-production.up.railway.app";
const MEMBRAIN_KEY = process.env.MEMBRANE_API_KEY;

const IS_REAL_API = MEMBRAIN_KEY && MEMBRAIN_KEY !== 'your-membrane-api-key';

if (IS_REAL_API) {
  console.log("🚀 [Membrain] Using real API");
} else {
  console.log("🧪 [Membrain] Mock fallback active");
}

const apiClient = axios.create({
  baseURL: MEMBRAIN_URL,
  headers: {
    'X-API-Key': MEMBRAIN_KEY,
    'Content-Type': 'application/json',
  },
});

/**
 * Polls a job until it's completed or failed
 */
const pollJob = async (jobId) => {
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max

  while (attempts < maxAttempts) {
    try {
      const { data } = await apiClient.get(`/api/v1/memories/jobs/${jobId}`);
      if (data.status === 'completed') return data;
      if (data.status === 'failed') throw new Error(`Job ${jobId} failed`);
    } catch (error) {
      console.error(`Polling error for job ${jobId}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  throw new Error(`Job ${jobId} timed out`);
};

/**
 * Stores a memory ONLY if a similar one doesn't exist for the given tags (to avoid bloat)
 */
export const storeMemory = async (content, tags, force = false) => {
  if (!IS_REAL_API) return { status: 'mocked' };

  try {
    if (!force) {
      // Check if we recently stored this (last 24h)
      const { data: searchRes } = await apiClient.post('/api/v1/memories/search', {
        query: content.substring(0, 100),
        keyword_filter: tags,
        limit: 1
      });
      
      if (searchRes?.interpreted?.memories?.length > 0) {
        console.log("⏭️ [Membrain] Skipping redundant memory store for tags:", tags);
        return { status: 'skipped' };
      }
    }

    const { data } = await apiClient.post('/api/v1/memories', { content, tags });
    if (data.job_id) {
      return await pollJob(data.job_id);
    }
    return data;
  } catch (error) {
    console.error("Store memory error:", error.response?.data || error.message);
    return null;
  }
};

/**
 * Searches memories with interpreted response
 */
export const searchMemories = async (query, tags) => {
  if (!IS_REAL_API) return null;

  try {
    const { data } = await apiClient.post('/api/v1/memories/search', {
      query,
      keyword_filter: tags, // API uses keyword_filter, not tags
      response_format: 'interpreted'
    });

    console.log("🧠 [Membrain] RAW search response:", JSON.stringify(data, null, 2));

    const raw = data?.interpreted?.answer_summary || null;
    if (!raw) return null;
    // Strip memory ID references like (abc123-...) and [abc123-...]
    const clean = raw
      .replace(/\s*[\(\[][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[,\s0-9a-f-]*[\)\]]/gi, '')
      .replace(/\s*\(Memory [0-9a-f-]+\)/gi, '')
      .replace(/\s*\(ID:\s*[0-9a-f-]+\)/gi, '')
      .trim();
    return clean;
  } catch (error) {
    console.error("Search memories error:", error.response?.data || error.message);
    return null;
  }
};

export async function getSpendingInsights(userId, month) {
  if (!IS_REAL_API) return "Mock Spending Insight: You're doing great with your food budget!";

  try {
    const startOfMonth = new Date(month + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

    const [user, budgets, expenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.budget.findMany({ where: { userId, month } }),
      prisma.expense.findMany({ where: { userId, date: { gte: startOfMonth, lt: endOfMonth } } })
    ]);

    console.log(`📊 [Membrain] Found ${expenses.length} expenses, ${budgets.length} budgets for user ${userId}`);

    if (expenses.length > 0) {
      const summary = expenses.map(e => `₹${e.amount} on ${e.category} (${e.note || 'Merchant'}) on ${e.date.toISOString().split('T')[0]}`).join('. ');
      const budgetSummary = budgets.map(b => `${b.category} budget: ₹${b.monthlyLimit}`).join(', ');
      const content = `Student financial profile for ${month}: Monthly income ₹${user.monthlyIncome}, Savings goal ₹${user.savingsGoal}. Budgets set: ${budgetSummary || 'none'}. Expenses: ${summary}`;

      console.log(`📤 [Membrain] Storing rich spending memory for ${month}...`);
      await storeMemory(content, [
        `user.${userId}`,
        `month.${month}`,
        "type.spending-profile"
      ]);
    }

    console.log(`🔎 [Membrain] Searching spending insights for user ${userId}...`);
    return await searchMemories(
      "As a financial coach, analyze my spending for this month. Which categories am I overspending in? Give me 3 specific actionable tips to improve. Be friendly and encouraging like a personal finance advisor.",
      [`user.${userId}`, `month.${month}`]
    );
  } catch (error) {
    console.error("❌ [Membrain] getSpendingInsights error:", error);
    return null;
  }
}

export async function getSavingsTips(userId) {
  if (!IS_REAL_API) return "Mock Savings Tip: Try cutting down on dining out.";

  try {
    const month = new Date().toISOString().slice(0, 7);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    console.log(`💰 [Membrain] Storing savings profile for user ${userId}...`);
    await storeMemory(
      `Student savings profile: Monthly income ₹${user.monthlyIncome}, Savings goal ₹${user.savingsGoal} per month. Help them reach this goal.`,
      [`user.${userId}`, `month.${month}`, 'type.savings-goal']
    );

    return await searchMemories(
      "As a friendly financial coach, give me 3 practical saving tips based on my income and spending habits. How close am I to my savings goal this month? Be specific with rupee amounts and encouraging.",
      [`user.${userId}`]
    );
  } catch (error) {
    console.error("❌ [Membrain] getSavingsTips error:", error);
    return null;
  }
}

export async function getDailyInsight(userId) {
  if (!IS_REAL_API) return "Mock Daily Insight: You spent ₹200 today. Good job!";

  try {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const startOfDay = new Date(today + 'T00:00:00');
    const endOfDay = new Date(today + 'T23:59:59');

    const [user, todayExpenses] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({ where: { userId, date: { gte: startOfDay, lt: endOfDay } } })
    ]);

    const todaySummary = todayExpenses.map(e => `₹${e.amount} on ${e.category} (${e.note || 'Unknown'})`).join(', ');
    const dailyBudget = Math.round(user.monthlyIncome / 30);

    console.log(`🌅 [Membrain] Storing daily spending for ${today} (${todayExpenses.length} expenses)...`);
    await storeMemory(
      `Today's spending (${today}): ${todaySummary || 'No expenses today'}. Daily budget based on ₹${user.monthlyIncome}/30 = ₹${dailyBudget} per day.`,
      [`user.${userId}`, `month.${month}`, `day.${today}`, 'type.daily']
    );

    return await searchMemories(
      "As my daily finance buddy, how did I do with my spending today compared to my daily budget? Give me one encouraging tip for tomorrow. Be warm and friendly.",
      [`user.${userId}`]
    );
  } catch (error) {
    console.error("❌ [Membrain] getDailyInsight error:", error);
    return null;
  }
}

/**
 * Fetches all memories and total count for graph visualization
 */
export async function getMemoryGraphRaw(userId) {
  if (!IS_REAL_API) return { memories: [], total: 0 };

  try {
    const [searchRes, countRes] = await Promise.all([
      apiClient.post('/api/v1/memories/search', {
        query: "financial transactions and goals",
        keyword_filter: [`user.${userId}`],
        limit: 50, // Limit to prevent graph explosion
        response_format: 'interpreted'
      }),
      apiClient.get('/api/v1/memories/count')
    ]);

    return {
      memories: searchRes.data?.interpreted?.memories || [],
      total: countRes.data?.total || 0
    };
  } catch (error) {
    console.error("❌ [Membrain] getMemoryGraphRaw error:", error.response?.data || error.message);
    return { memories: [], total: 0 };
  }
}
