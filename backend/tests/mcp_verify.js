import { callMCPTool } from "../src/mcp/wiseu-mcp-server.js";
import prisma from "../src/config/prisma.js";

async function runTests() {
  console.log("🧪 Starting MCP Tool Internal Verification...");

  try {
    // 1. Find a test user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error("❌ No user found in DB to test with.");
      return;
    }
    const userId = user.id;
    const month = new Date().toISOString().slice(0, 7);
    const date = new Date().toISOString().slice(0, 10);

    console.log(`👤 Testing with User: ${user.name} (${userId}) for ${month}`);

    // Test 1: get_monthly_expenses
    console.log("\n1. Testing get_monthly_expenses...");
    const monthly = await callMCPTool("get_monthly_expenses", { userId, month });
    console.log("✅ Result:", JSON.stringify(monthly, null, 2));

    // Test 2: get_budget_status
    console.log("\n2. Testing get_budget_status...");
    const status = await callMCPTool("get_budget_status", { userId, month });
    console.log("✅ Result:", JSON.stringify(status, null, 2));

    // Test 3: get_daily_expenses
    console.log("\n3. Testing get_daily_expenses...");
    const daily = await callMCPTool("get_daily_expenses", { userId, date });
    console.log("✅ Result:", JSON.stringify(daily, null, 2));

    // Test 4: get_savings_progress
    console.log("\n4. Testing get_savings_progress...");
    const savings = await callMCPTool("get_savings_progress", { userId, month });
    console.log("✅ Result:", JSON.stringify(savings, null, 2));

    // Test 5: get_top_spending_categories
    console.log("\n5. Testing get_top_spending_categories...");
    const top = await callMCPTool("get_top_spending_categories", { userId, month });
    console.log("✅ Result:", JSON.stringify(top, null, 2));

    console.log("\n✨ All internal MCP tool checks PASSED!");
  } catch (error) {
    console.error("\n❌ MCP Verification FAILED:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
