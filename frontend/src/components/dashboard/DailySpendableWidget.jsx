import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Wallet, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

const DailySpendableWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/insights/daily-spendable');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch daily spendable:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 w-32 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 w-48 rounded mb-6"></div>
        <div className="h-2 bg-gray-200 w-full rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  const { dailySpendable, spentToday, remainingToday, daysLeft, status, message } = data;

  const getStatusConfig = () => {
    switch (status) {
      case 'ON_TRACK':
        return { color: '#1D9E75', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700' };
      case 'TIGHT':
        return { color: '#EF9F27', icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'EXHAUSTED':
      case 'OVERSPENT':
        return { color: '#E24B4A', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700' };
      default:
        return { color: '#534AB7', icon: Wallet, bg: 'bg-indigo-50', text: 'text-indigo-700' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const percentage = dailySpendable > 0 ? Math.min(100, (spentToday / dailySpendable) * 100) : 100;

  const getBarColor = () => {
    if (percentage < 50) return '#1D9E75';
    if (percentage < 80) return '#EF9F27';
    return '#E24B4A';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
            <Wallet className="w-4 h-4" /> Today's Spendable
          </p>
          <h2 className="text-4xl font-black" style={{ color: config.color }}>
            ₹{dailySpendable.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">
            you can spend today
          </p>
        </div>
        <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
          <Icon className="w-3 h-3" /> {status.replace('_', ' ')}
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out flex justify-end"
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: getBarColor()
            }}
          >
             <div className="h-full w-1 bg-white/20"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-gray-600">
            ₹{remainingToday.toLocaleString('en-IN')} remaining today
          </p>
          <p className="text-xs text-gray-400">
            {daysLeft} days left in month
          </p>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded-xl border flex items-start gap-2 ${config.bg} border-current/10 ${config.text}`}>
        <Icon className="w-4 h-4 mt-0.5" />
        <p className="text-sm font-medium leading-tight">
          {message}
        </p>
      </div>
    </div>
  );
};

export default DailySpendableWidget;
