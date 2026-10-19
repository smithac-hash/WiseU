import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { AlertTriangle, X } from 'lucide-react';

const AnomalyAlert = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics/anomalies')
      .then(res => setAnomalies(res.data.anomalies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || dismissed || anomalies.length === 0) return null;

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ background: anomalies.some(a => a.severity === 'high') ? '#FEF2F2' : '#FFFBEB', borderColor: anomalies.some(a => a.severity === 'high') ? '#FECACA' : '#FDE68A' }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-900">Spending Anomalies Detected</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">{anomalies.length} found</span>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {anomalies.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {a.severity === 'high' ? '🔴 HIGH' : '🟡 MEDIUM'}
                  </span>
                  <span className="font-bold text-gray-900">₹{a.amount.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-gray-500">{a.category}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{a.reason}</p>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 ml-4">{a.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnomalyAlert;
