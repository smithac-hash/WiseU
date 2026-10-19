import "dotenv/config";

import express from "express";
import cors from "cors";
import prisma from "./config/prisma.js";
import redis from "./config/redis.js";

import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from "./routes/user.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { initCronJobs } from "./cron.js";
import { setupMCPServer } from "./mcp/wiseu-mcp-server.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (_req, res) => {
  res.send("<h1>🎓 WiseU API is Running</h1><p>The API is healthy. Use <code>/api</code> prefixed routes for data.</p>");
});

// ── Health Check ───────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ app: "WiseU", status: "ok" });
});

// ── Start Server ───────────────────────────────────────
async function main() {
  try {
    // Connect to Redis (lazy connect)
    await redis.connect().catch((err) => {
      console.warn("⚠️  Redis not available, continuing without cache:", err.message);
    });

    initCronJobs();
    setupMCPServer(app);

    app.listen(PORT, () => {
      console.log(`
  ╔══════════════════════════════════════════╗
  ║   🎓 WiseU API Server                   ║
  ║   Spend smart. Save more. Graduate rich. ║
  ║   Running on http://localhost:${PORT}      ║
  ╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
