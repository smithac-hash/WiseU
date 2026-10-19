import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Sun,
  PieChart,
  BrainCircuit,
  Quote
} from 'lucide-react';

const parseInsightContent = (text) => {
  if (!text) return [];
  // Split by numbered points (1. or 1) or 1:) or newlines
  const parts = text
    .split(/(?:\n|(?=\d+[\.\)\:]\s))/)
    .map(s => s.replace(/^\d+[\.\)\:]\s*/, '').trim())
    .filter(Boolean);
  return parts;
};

const InsightCard = ({ title, icon: Icon, color, content, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${color} opacity-20`} />
          <div className="h-6 bg-gray-200 w-32 rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 w-full rounded" />
          <div className="h-4 bg-gray-100 w-5/6 rounded" />
          <div className="h-4 bg-gray-100 w-4/6 rounded" />
        </div>
      </div>
    );
  }

  const isEmpty = !content || content.trim() === '';
  const parts = parseInsightContent(content);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Quote accent */}
      <div className="mb-3">
        <Quote className="w-6 h-6" style={{ color: '#534AB7', opacity: 0.3 }} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="flex-grow">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <BrainCircuit className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Not enough data yet — add more expenses to unlock this insight!</p>
          </div>
        ) : parts.length > 1 ? (
          <ul className="space-y-3">
            {parts.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#534AB7' }} />
                <span className="text-gray-700 leading-relaxed text-sm">{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 leading-relaxed text-sm">{content}</p>
        )}
      </div>

      {/* Confidence badge */}
      {!isEmpty && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">High Confidence</span>
        </div>
      )}
    </div>
  );
};

const Insights = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({
    spendingInsights: '',
    savingsTips: '',
    dailyInsight: ''
  });
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/insights');
      setInsights(data);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Could not connect to WiseU Intelligence. Please check your Membrain API key or try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-2xl border border-red-100">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-900 mb-2">Intelligence Connection Failed</h3>
        <p className="text-red-700 mb-6 text-center max-w-md">{error}</p>
        <button 
          onClick={fetchInsights}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">WiseU Intelligence</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard 
          title="Spending Insights" 
          icon={PieChart} 
          color="bg-indigo-100 text-indigo-600"
          content={insights.spendingInsights}
          loading={loading}
        />
        
        <InsightCard 
          title="Savings Tips" 
          icon={Lightbulb} 
          color="bg-amber-100 text-amber-600"
          content={insights.savingsTips}
          loading={loading}
        />

        <InsightCard 
          title="Daily Insight" 
          icon={Sun} 
          color="bg-emerald-100 text-emerald-600"
          content={insights.dailyInsight}
          loading={loading}
        />
      </div>

      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl flex items-center gap-4 overflow-hidden relative">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <Zap className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-100">Powered by Membrain AI</p>
            <p className="text-lg">Personalized financial coaching that learns with every transaction.</p>
          </div>
        </div>
        <BrainCircuit className="absolute right-[-20px] top-[-20px] w-48 h-48 text-white/10" />
      </div>
    </div>
  );
};

export default Insights;
