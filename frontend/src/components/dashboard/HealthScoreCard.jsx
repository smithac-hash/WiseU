import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Trophy } from 'lucide-react';

const BreakdownBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-medium">
      <span className="text-gray-600">{label}</span>
      <span style={{ color }}>{value}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

const HealthScoreCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    axios.get('/api/analytics/health-score')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    let start = 0;
    const target = data.score;
    const duration = 1200;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setAnimatedScore(target); clearInterval(timer); }
      else setAnimatedScore(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 w-40 rounded mb-4" />
        <div className="flex justify-center"><div className="w-36 h-36 bg-gray-100 rounded-full" /></div>
      </div>
    );
  }

  if (!data) return null;

  const { score, grade, label, color, breakdown, message } = data;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-[#534AB7]" />
        <h3 className="text-lg font-bold text-gray-900">Financial Health Score</h3>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke={color} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black" style={{ color }}>{grade}</span>
            <span className="text-sm font-semibold text-gray-500">{animatedScore}</span>
          </div>
        </div>

        {/* Breakdown + Message */}
        <div className="flex-grow w-full space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: `${color}18`, color }}>{label}</span>
          </div>
          <div className="space-y-3">
            <BreakdownBar label="Budget Adherence" value={breakdown.budgetAdherence} color={color} />
            <BreakdownBar label="Savings Progress" value={breakdown.savingsProgress} color={color} />
            <BreakdownBar label="Spending Consistency" value={breakdown.spendingConsistency} color={color} />
          </div>
          <p className="text-sm text-gray-600 italic">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreCard;
