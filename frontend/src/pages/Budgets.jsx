import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useMonthlySummary } from '../hooks/useExpenses';
import toast from 'react-hot-toast';

const Budgets = () => {
  const [monthOffset, setMonthOffset] = useState(0);
  const getMonth = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toISOString().slice(0, 7);
  };
  const currentMonth = getMonth(monthOffset);
  const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const [budgetStatus, setBudgetStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/budgets/status?month=${currentMonth}`);
      setBudgetStatus(data);
    } catch (error) {
      console.error('Failed to fetch budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [currentMonth]);

  const handleUpdateLimit = async (category, limit) => {
    try {
      const numLimit = parseFloat(limit);
      if (isNaN(numLimit)) throw new Error('Invalid limit');
      await axios.post('/api/budgets', { category, monthlyLimit: numLimit, month: currentMonth });
      toast.success('Budget updated');
      setEditingId(null);
      fetchStatus();
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || 'Failed to update budget';
      toast.error(errMsg);
      console.error('Budget update error:', error);
    }
  };

  const handleCopyLastMonth = async () => {
    try {
      await axios.post('/api/budgets/copy', { currentMonth });
      toast.success('Budgets copied successfully');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to copy budgets');
    }
  };

  const categories = [
    { id: 'FOOD', name: 'Food & Dining', icon: '🍔', color: 'bg-orange-100 text-orange-600' },
    { id: 'TRANSPORT', name: 'Transport', icon: '🚗', color: 'bg-blue-100 text-blue-600' },
    { id: 'SHOPPING', name: 'Shopping', icon: '🛍️', color: 'bg-purple-100 text-purple-600' },
    { id: 'ENTERTAINMENT', name: 'Entertainment', icon: '🎬', color: 'bg-red-100 text-red-600' },
    { id: 'EDUCATION', name: 'Education', icon: '📚', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'HEALTH', name: 'Health', icon: '🏥', color: 'bg-green-100 text-green-600' },
    { id: 'UTILITIES', name: 'Utilities', icon: '💡', color: 'bg-yellow-100 text-yellow-600' },
    { id: 'OTHER', name: 'Other', icon: '✨', color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Budgets</h1>
          <p className="text-gray-500 text-sm">Control your spending, save for your future.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setMonthOffset((p) => p - 1)}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
          >
            ←
          </button>
          <span className="px-4 font-bold text-gray-700 min-w-[140px] text-center">{monthLabel}</span>
          <button
            onClick={() => setMonthOffset((p) => Math.min(p + 1, 0))}
            disabled={monthOffset >= 0}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors disabled:opacity-20"
          >
            →
          </button>
        </div>

        <button 
          onClick={handleCopyLastMonth}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition shadow-sm flex items-center gap-2"
        >
          📋 Copy last month
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const budget = budgetStatus.find(b => b.category === cat.id);
          const zone = budget?.zone || 'NONE';
          
          const zoneStyles = {
            SAFE: { badge: 'bg-[#1D9E75]/10 text-[#1D9E75]', label: 'Safe Zone', bar: 'bg-[#1D9E75]' },
            CAUTION: { badge: 'bg-[#EF9F27]/10 text-[#EF9F27]', label: 'Caution Zone', bar: 'bg-[#EF9F27]' },
            RED: { badge: 'bg-[#E24B4A]/10 text-[#E24B4A]', label: 'Red Zone', bar: 'bg-[#E24B4A]' },
            EXCEEDED: { badge: 'bg-[#E24B4A]/20 text-[#E24B4A]', label: 'Exceeded', bar: 'bg-[#E24B4A]' },
            NONE: { badge: 'bg-gray-100 text-gray-400', label: 'Not Set', bar: 'bg-gray-200' }
          };

          const style = zoneStyles[zone];

          return (
            <div key={cat.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
              {/* Decorative background element */}
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] ${style.bar}`}></div>

              <div className="flex items-start justify-between mb-5">
                <div className={`p-4 rounded-2xl ${cat.color} text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                  {style.label}
                </span>
              </div>

              <h3 className="font-bold text-gray-800 text-lg mb-1">{cat.name}</h3>
              
              <div className="space-y-5">
                {/* Limit Input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Monthly Limit:</span>
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                      <input 
                        type="number"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 px-2 py-1 border-2 border-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button 
                         onClick={() => handleUpdateLimit(cat.id, editValue)}
                         className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-sm shadow-primary/20"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditValue(budget?.limit || '');
                      }}
                      className="text-xl font-black text-gray-900 hover:text-primary transition-colors flex items-center gap-1 group/btn"
                    >
                      ₹{budget?.limit?.toLocaleString('en-IN') || '0'}
                      <span className="opacity-0 group-hover/btn:opacity-100 text-[10px] text-gray-400 font-normal ml-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">✎ Edit</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Spent</span>
                      <span className="text-sm font-bold text-gray-700">₹{budget?.spent?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    <span className={`text-sm font-black ${zone === 'EXCEEDED' ? 'text-[#E24B4A]' : 'text-gray-400'}`}>
                      {budget ? `${Math.round(budget.percentUsed)}%` : '0%'}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${style.bar} shadow-inner shadow-black/5`}
                      style={{ width: `${Math.min(budget?.percentUsed || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Smart Insight Line */}
                {budget && (
                  <div className={`p-4 rounded-2xl text-[11px] leading-relaxed font-medium transition-colors ${
                    zone === 'SAFE' ? 'bg-[#1D9E75]/5 text-[#1D9E75]' :
                    zone === 'CAUTION' ? 'bg-[#EF9F27]/5 text-[#EF9F27]' :
                    'bg-[#E24B4A]/5 text-[#E24B4A]'
                  }`}>
                    {zone === 'EXCEEDED' ? (
                      <p>⚠️ Budget exceeded by <span className="font-bold text-lg block my-0.5">₹{Math.abs(budget.remaining).toLocaleString('en-IN')}</span> Consider revising your limit or reducing spends.</p>
                    ) : zone === 'RED' ? (
                      <p>🚨 Only <span className="font-bold">₹{budget.remaining.toLocaleString('en-IN')}</span> left! Avoid non-essential spends. {budget.daysLeft} days left — ideal daily limit: <span className="font-bold">₹{budget.idealDailySpend}</span></p>
                    ) : zone === 'CAUTION' ? (
                      <p>⚠️ Halfway through your budget. Slow down! Ideal daily spend: <span className="font-bold">₹{budget.idealDailySpend}</span> to stay safe.</p>
                    ) : (
                      <p>✨ You've used ₹{budget.spent.toLocaleString('en-IN')}. Great pace! You can spend up to <span className="font-bold">₹{budget.idealDailySpend}</span> per day for the next {budget.daysLeft} days.</p>
                    )}
                  </div>
                )}

                {!budget && (
                  <div className="p-4 rounded-2xl bg-gray-50 text-[11px] text-gray-400 italic text-center border-2 border-dashed border-gray-200">
                    Set a monthly limit to get smart spending insights
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Budgets;
