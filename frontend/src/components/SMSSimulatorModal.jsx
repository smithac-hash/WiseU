import React, { useState } from 'react';
import { MessageSquare, Zap, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SMSSimulatorModal = ({ isOpen, onClose, onExtract }) => {
  const [smsText, setSmsText] = useState(
    "Your a/c XX1234 is debited INR 450.00 on 25-Mar-26 at SWIGGY. Avl bal: INR 12,340.00"
  );
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  if (!isOpen) return null;

  const handleExtract = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/expenses/parse-sms',
        { smsText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success('SMS parsed! Review and confirm your expense. ✨');
      onExtract(response.data);
      onClose();
    } catch (error) {
      console.error('SMS parse error:', error);
      toast.error('Could not parse SMS. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#534AB7] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">SMS Simulator</h2>
              <p className="text-indigo-100 text-xs opacity-80">Paste a bank transaction SMS to auto-fill</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
              Transaction SMS Text
              <span className="text-[10px] bg-indigo-50 text-[#534AB7] px-2 py-0.5 rounded-full uppercase tracking-wider">Simulation</span>
            </label>
            <textarea
              className="w-full h-40 bg-indigo-50/30 border-2 border-indigo-100 focus:border-[#534AB7] rounded-2xl p-4 text-sm font-mono text-gray-700 outline-none transition-all resize-none"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="e.g. Your a/c XX1234 is debited INR 450.00..."
            />
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
            <div className="text-amber-500 mt-0.5 italic">ℹ️</div>
            <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
              We use smart regex patterns to extract amount, merchant, and date from formats used by HDFC, ICICI, SBI, and UPI notifications.
            </p>
          </div>

          <button
            onClick={handleExtract}
            disabled={loading || !smsText.trim()}
            className={`w-full bg-[#534AB7] hover:bg-[#453c9e] text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white/20" />
                Extract Transaction Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSSimulatorModal;
