import React from 'react';
import { useDeleteExpense } from '../hooks/useExpenses';

const CATEGORY_MAP = {
  FOOD: { icon: '🍔', label: 'Food' },
  TRANSPORT: { icon: '🚌', label: 'Transport' },
  SHOPPING: { icon: '🛍', label: 'Shopping' },
  ENTERTAINMENT: { icon: '🎮', label: 'Entertainment' },
  EDUCATION: { icon: '📚', label: 'Education' },
  HEALTH: { icon: '💊', label: 'Health' },
  UTILITIES: { icon: '⚡', label: 'Utilities' },
  OTHER: { icon: '📦', label: 'Other' },
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const groupByDate = (expenses) => {
  const grouped = {};
  expenses.forEach((exp) => {
    const key = new Date(exp.date).toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(exp);
  });
  return Object.entries(grouped).sort(([a], [b]) => new Date(b) - new Date(a));
};

const ExpenseList = ({ expenses = [], isLoading }) => {
  const { mutate: deleteExpense } = useDeleteExpense();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-5xl mb-3">📭</p>
        <p className="font-medium">No expenses yet</p>
        <p className="text-sm">Tap the + button to add your first expense</p>
      </div>
    );
  }

  const grouped = groupByDate(expenses);

  return (
    <div className="space-y-6">
      {grouped.map(([dateKey, items]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            {formatDate(items[0].date)}
          </h3>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {items.map((expense) => {
              const cat = CATEGORY_MAP[expense.category] || CATEGORY_MAP.OTHER;
              return (
                <div key={expense.id} className="flex items-center gap-3 p-4 group hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-bg-light flex items-center justify-center text-xl flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{cat.label}</p>
                    {expense.note && (
                      <p className="text-xs text-gray-400 truncate">{expense.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-danger text-sm">-₹{expense.amount.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-danger text-xs"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
