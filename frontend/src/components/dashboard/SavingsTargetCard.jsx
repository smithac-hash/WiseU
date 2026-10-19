import React from 'react';
import { formatCurrency } from '../../utils/constants';

const SavingsTargetCard = ({ summary }) => {
  const goal = summary?.savingsGoal || 0;
  const income = summary?.monthlyIncome || 0;
  const spent = summary?.totalSpent || 0;
  const saved = Math.max(income - spent, 0);
  const progress = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;

  let status, statusColor;
  if (progress >= 100) {
    status = 'Goal reached! 🎉';
    statusColor = 'text-success';
  } else if (progress >= 50) {
    status = 'On track!';
    statusColor = 'text-success';
  } else if (progress > 0) {
    status = 'Falling behind';
    statusColor = 'text-warning';
  } else {
    status = 'No savings yet';
    statusColor = 'text-gray-400';
  }

  // SVG circle dimensions
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Savings Goal</h3>

      <div className="flex items-center gap-5">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={progress >= 100 ? '#1D9E75' : '#534AB7'}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-800">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-xs text-gray-400">Saved</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(saved)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Goal</p>
            <p className="text-sm font-medium text-gray-600">{formatCurrency(goal)}</p>
          </div>
          <p className={`text-sm font-semibold ${statusColor}`}>{status}</p>
        </div>
      </div>
    </div>
  );
};

export default SavingsTargetCard;
