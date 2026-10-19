import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY_MAP, CATEGORIES, formatCurrency } from '../../utils/constants';

const MonthlyOverviewCard = ({ summary }) => {
  if (!summary || !summary.categories?.length) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Overview</h3>
        <div className="flex items-center justify-center h-48 text-gray-300">
          <p>No spending data this month</p>
        </div>
      </div>
    );
  }

  const chartData = summary.categories.map((c) => ({
    name: CATEGORY_MAP[c.category]?.label || c.category,
    value: c.total,
    color: CATEGORY_MAP[c.category]?.color || '#9CA3AF',
    icon: CATEGORY_MAP[c.category]?.icon || '📦',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow">
          {d.icon} {d.name}: {formatCurrency(d.value)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Overview</h3>

      <div className="flex items-center gap-4">
        <div className="w-40 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400">Spent</p>
            <p className="text-sm font-bold text-gray-800">{formatCurrency(summary.totalSpent)}</p>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-hidden">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-gray-600 truncate">{d.icon} {d.name}</span>
              <span className="ml-auto font-medium text-gray-800 flex-shrink-0">{formatCurrency(d.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex justify-between text-xs">
        <span className="text-gray-400">Income: {formatCurrency(summary.monthlyIncome)}</span>
        <span className={summary.remaining >= 0 ? 'text-success font-medium' : 'text-danger font-medium'}>
          Remaining: {formatCurrency(summary.remaining)}
        </span>
      </div>
    </div>
  );
};

export default MonthlyOverviewCard;
