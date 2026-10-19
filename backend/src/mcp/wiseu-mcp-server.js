import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import prisma from "../config/prisma.js";
import express from "express";

// Initialize MCP Server
const server = new Server(
  {
    name: "wiseu-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_monthly_expenses",
        description: "Get a student's expenses grouped by category for a given month",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            month: { type: "string", description: "Format: YYYY-MM" },
          },
          required: ["userId", "month"],
        },
      },
      {
        name: "get_budget_status",
        description: "Get budget limits and current spending status for all categories",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            month: { type: "string", description: "Format: YYYY-MM" },
          },
          required: ["userId", "month"],
        },
      },
      {
        name: "get_daily_expenses",
        description: "Get all expenses for a specific day",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            date: { type: "string", description: "Format: YYYY-MM-DD" },
          },
          required: ["userId", "date"],
        },
      },
      {
        name: "get_savings_progress",
        description: "Get how much the student has saved vs their monthly goal",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            month: { type: "string", description: "Format: YYYY-MM" },
          },
          required: ["userId", "month"],
        },
      },
      {
        name: "get_top_spending_categories",
        description: "Get the top 3 categories where student spends most",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            month: { type: "string", description: "Format: YYYY-MM" },
          },
          required: ["userId", "month"],
        },
      },
    ],
  };
});

// Internal helper for non-MCP routes (direct handler call to avoid transport overhead)
export const callMCPTool = async (name, args) => {
  // Find the handler for CallToolRequestSchema
  // Note: In a real SDK scenario, we'd use server.executeTool
  // For this specific internal helper, we'll re-implement the logic or call the switch directly
  // To keep it simple and DRY, I'll extract the logic to a function
  return await handleToolCall(name, args);
};

const handleToolCall = async (name, args) => {
  // Logic from the handler above...
  // (Self-correction: I'll just keep the switch inside a shared function)
  try {
    switch (name) {
      case "get_monthly_expenses": {
        const { userId, month } = args;
        const [year, mon] = month.split("-").map(Number);
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 1);

        const grouped = await prisma.expense.groupBy({
          by: ["category"],
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
          _sum: { amount: true },
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");
        
        const totalSpent = grouped.reduce((sum, g) => sum + (g._sum.amount || 0), 0);
        return {
          byCategory: grouped.map(g => ({ category: g.category, spent: g._sum.amount })),
          totalSpent,
          income: user.monthlyIncome,
          savingsGoal: user.savingsGoal,
          currentSavings: user.monthlyIncome - totalSpent
        };
      }
      case "get_budget_status": {
        const { userId, month } = args;
        const [year, mon] = month.split("-").map(Number);
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 1);

        const budgets = await prisma.budget.findMany({ where: { userId, month } });
        const expenses = await prisma.expense.groupBy({
          by: ["category"],
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
          _sum: { amount: true },
        });

        const expenseMap = expenses.reduce((acc, curr) => {
          acc[curr.category] = curr._sum.amount || 0;
          return acc;
        }, {});

        return budgets.map(b => {
          const spent = expenseMap[b.category] || 0;
          const percentUsed = (spent / b.monthlyLimit) * 100;
          return {
            category: b.category,
            limit: b.monthlyLimit,
            spent,
            percentUsed: Math.round(percentUsed * 100) / 100,
            status: percentUsed > 100 ? "EXCEEDED" : percentUsed > 80 ? "WARNING" : "OK"
          };
        });
      }
      case "get_daily_expenses": {
        const { userId, date } = args;
        const day = new Date(date);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);

        const expenses = await prisma.expense.findMany({
          where: { userId, date: { gte: day, lt: nextDay } }
        });

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        return { expenses, total };
      }
      case "get_savings_progress": {
        const { userId, month } = args;
        const [year, mon] = month.split("-").map(Number);
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 1);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");
        
        const totalExpenses = await prisma.expense.aggregate({
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
          _sum: { amount: true },
        });

        const spent = totalExpenses._sum.amount || 0;
        const currentSavings = user.monthlyIncome - spent;
        const progress = user.savingsGoal > 0 ? (currentSavings / user.savingsGoal) * 100 : 100;

        return {
          savingsGoal: user.savingsGoal,
          currentSavings,
          progress: Math.round(progress * 100) / 100
        };
      }
      case "get_top_spending_categories": {
        const { userId, month } = args;
        const [year, mon] = month.split("-").map(Number);
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 1);

        const grouped = await prisma.expense.groupBy({
          by: ["category"],
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 3
        });

        return grouped.map(g => ({ category: g.category, amount: g._sum.amount }));
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw error;
  }
};

// Implementation of Tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleToolCall(name, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Transport setup (SSE)
export const setupMCPServer = (app) => {
  const mcpApp = express();
  let transport;

  mcpApp.get("/sse", async (req, res) => {
    console.log("🔌 MCP Client connected via SSE");
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  });

  mcpApp.post("/messages", async (req, res) => {
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No active SSE transport");
    }
  });

  const mcpPort = process.env.MCP_PORT || (parseInt(process.env.PORT || 5000) + 1);
  mcpApp.listen(mcpPort, () => {
    console.log(`📡 WiseU MCP Server running on port ${mcpPort}`);
  });
};
