import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGetExpenses, useMonthlySummary, useDailySummary } from '../hooks/useExpenses';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseList from '../components/ExpenseList';
import DailySummaryCard from '../components/dashboard/DailySummaryCard';
import MonthlyOverviewCard from '../components/dashboard/MonthlyOverviewCard';
import SpendHistoryChart from '../components/dashboard/SpendHistoryChart';
import BudgetProgressBars from '../components/dashboard/BudgetProgressBars';
import SavingsTargetCard from '../components/dashboard/SavingsTargetCard';
import HealthScoreCard from '../components/dashboard/HealthScoreCard';
import AnomalyAlert from '../components/dashboard/AnomalyAlert';
import ForecastCard from '../components/dashboard/ForecastCard';
import DailySpendableWidget from '../components/dashboard/DailySpendableWidget';
import SMSSimulatorModal from '../components/SMSSimulatorModal';
import { MessageSquare, Zap } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsData, setSmsData] = useState(null);

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0);
  const getMonth = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toISOString().slice(0, 7);
  };
  const currentMonth = getMonth(monthOffset);
  const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const today = new Date().toISOString().split('T')[0];

  // Data hooks
  const { data: expenses, isLoading } = useGetExpenses({ month: currentMonth });
  const { data: summary } = useMonthlySummary(currentMonth);
  const { data: dailyData } = useDailySummary(today);

  // For 30-day chart, fetch a wider range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: historyExpenses } = useGetExpenses({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today,
  });

  return (
    <div className="pb-8">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Daily Spendable Widget */}
        <DailySpendableWidget />

        {/* Health Score */}
        <HealthScoreCard />

        {/* Anomaly Alert */}
        <AnomalyAlert />

        {/* Spending Forecast */}
        <ForecastCard />

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((p) => p - 1)}
            className="p-2 hover:bg-white rounded-lg transition text-gray-500 hover:text-primary"
          >
            ← Prev
          </button>
          <h2 className="text-lg font-semibold text-gray-800">{monthLabel}</h2>
          <button
            onClick={() => setMonthOffset((p) => Math.min(p + 1, 0))}
            disabled={monthOffset >= 0}
            className="p-2 hover:bg-white rounded-lg transition text-gray-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Top Row: Daily Summary + Savings + Monthly Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DailySummaryCard dailyData={dailyData} />
          <SavingsTargetCard summary={summary} />
          <MonthlyOverviewCard summary={summary} />
        </div>

        {/* Middle Row: Spend History Chart + Budget Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <SpendHistoryChart expenses={historyExpenses || []} />
          </div>
          <div className="lg:col-span-2">
            <BudgetProgressBars categories={summary?.categories || []} budgets={[]} />
          </div>
        </div>

        {/* Bottom: Expense List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Expenses</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition shadow"
            >
              + Add Expense
            </button>
          </div>
          <ExpenseList expenses={expenses || []} isLoading={isLoading} />
        </div>
      </main>

      <AddExpenseModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          setSmsData(null);
        }} 
        initialData={smsData}
      />

      {/* Floating SMS Simulator Button */}
      <button
        onClick={() => setShowSmsModal(true)}
        className="fixed bottom-8 right-8 bg-[#534AB7] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group z-50 overflow-hidden"
        title="Simulate Bank SMS"
      >
        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
        <Zap className="w-6 h-6 fill-white/20" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Simulate Bank SMS
        </span>
      </button>

      <SMSSimulatorModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        onExtract={(data) => {
          setSmsData(data);
          setShowAddModal(true);
        }}
      />
    </div>
  );
};

export default Dashboard;
