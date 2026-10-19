import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForecastCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics/forecast')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-5 bg-gray-200 w-40 rounded mb-4" />
        <div className="h-4 bg-gray-100 w-full rounded mb-3" />
        <div className="h-8 bg-gray-100 w-full rounded" />
      </div>
    );
  }

  if (!data) return null;

  const { spentSoFar, forecastTotal, monthlyIncome, daysElapsed, daysRemaining, dailyAverage, status, message, recommendation } = data;

  const statusConfig = {
    ON_TRACK: { badge: 'On Track', badgeColor: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    WARNING: { badge: 'Warning', badgeColor: 'bg-amber-100 text-amber-700', icon: AlertCircle, iconColor: 'text-amber-500' },
    OVER: { badge: 'Over Budget', badgeColor: 'bg-red-100 text-red-700', icon: AlertCircle, iconColor: 'text-red-500' }
  };
  const config = statusConfig[status] || statusConfig.ON_TRACK;
  const StatusIcon = config.icon;

  const maxVal = Math.max(forecastTotal, monthlyIncome, 1);
  const spentPct = Math.min(100, (spentSoFar / maxVal) * 100);
  const forecastPct = Math.min(100, (forecastTotal / maxVal) * 100);
  const incomePct = monthlyIncome > 0 ? Math.min(100, (monthlyIncome / maxVal) * 100) : 100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#534AB7]" />
          <h3 className="text-lg font-bold text-gray-900">Spending Forecast</h3>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.badgeColor}`}>{config.badge}</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center">
          <div className="text-2xl font-black text-[#534AB7]">₹{spentSoFar.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Spent so far</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-amber-600">₹{forecastTotal.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Projected total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900">₹{dailyAverage.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Daily avg</div>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden mb-2">
        {/* Safe zone (income marker) */}
        {monthlyIncome > 0 && (
          <div className="absolute top-0 h-full border-r-2 border-dashed border-emerald-500 z-10" style={{ left: `${incomePct}%` }}>
            <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-bold text-emerald-600 whitespace-nowrap">Income</span>
          </div>
        )}
        {/* Forecast zone */}
        <div className="absolute top-0 h-full bg-amber-200 rounded-full transition-all duration-700" style={{ width: `${forecastPct}%` }} />
        {/* Spent zone */}
        <div className="absolute top-0 h-full bg-[#534AB7] rounded-full transition-all duration-700" style={{ width: `${spentPct}%` }} />
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 mb-4">
        <span>{daysElapsed} days gone</span>
        <span>{daysRemaining} days left</span>
      </div>

      {/* Message */}
      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: status === 'OVER' ? '#FEF2F2' : status === 'WARNING' ? '#FFFBEB' : '#F0FDF4' }}>
        <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div>
          <p className="text-sm font-medium text-gray-800">{message}</p>
          <p className="text-xs text-gray-500 mt-1">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

export default ForecastCard;
