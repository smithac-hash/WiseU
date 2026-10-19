import React from 'react';
import { CATEGORY_MAP, formatCurrency } from '../../utils/constants';

const DailySummaryCard = ({ dailyData }) => {
  if (!dailyData) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today</h3>
        <p className="text-3xl font-bold text-gray-800">₹0</p>
        <p className="text-sm text-gray-400 mt-1">No spending today</p>
      </div>
    );
  }

  const { categories, expenses } = dailyData;
  const totalToday = categories.reduce((sum, c) => sum + (c.total || 0), 0);
  const txCount = expenses?.length || 0;
  const topCategory = categories.length
    ? categories.reduce((a, b) => (a.total > b.total ? a : b))
    : null;
  const topCat = topCategory ? CATEGORY_MAP[topCategory.category] : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today</h3>
      <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalToday)}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-500">
          {txCount} transaction{txCount !== 1 ? 's' : ''}
        </span>
        {topCat && (
          <span className="text-sm text-gray-500">
            Top: {topCat.icon} {topCat.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default DailySummaryCard;
