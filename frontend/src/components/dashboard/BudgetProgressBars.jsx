import React from 'react';
import { CATEGORY_MAP, formatCurrency } from '../../utils/constants';

const getBarColor = (percent) => {
  if (percent >= 85) return { bg: 'bg-danger/15', fill: 'bg-danger', text: 'text-danger' };
  if (percent >= 60) return { bg: 'bg-warning/15', fill: 'bg-warning', text: 'text-warning' };
  return { bg: 'bg-success/15', fill: 'bg-success', text: 'text-success' };
};

const BudgetProgressBars = ({ categories = [], budgets = [] }) => {
  // Merge budget limits with actual spending
  const items = categories.map((cat) => {
    const budget = budgets.find((b) => b.category === cat.category);
    const limit = budget?.monthlyLimit || 0;
    const spent = cat.total || 0;
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const catInfo = CATEGORY_MAP[cat.category];
    return { ...cat, limit, spent, percent, catInfo };
  });

  if (!items.length) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Category Spending</h3>
        <p className="text-sm text-gray-300 text-center py-4">No spending data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Category Spending</h3>
      <div className="space-y-3">
        {items
          .sort((a, b) => b.spent - a.spent)
          .map((item) => {
            const colors = item.limit > 0 ? getBarColor(item.percent) : { bg: 'bg-primary/10', fill: 'bg-primary', text: 'text-primary' };
            return (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">
                    {item.catInfo?.icon} {item.catInfo?.label}
                  </span>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {formatCurrency(item.spent)}
                    {item.limit > 0 && <span className="text-gray-400"> / {formatCurrency(item.limit)}</span>}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${colors.bg} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full ${colors.fill} transition-all duration-700 ease-out`}
                    style={{ width: item.limit > 0 ? `${item.percent}%` : '100%' }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default BudgetProgressBars;
