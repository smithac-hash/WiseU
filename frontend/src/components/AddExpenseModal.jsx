import React, { useState, useEffect } from 'react';
import { useCreateExpense } from '../hooks/useExpenses';
import api from '../api/axios';

const CATEGORIES = [
  { value: 'FOOD', label: 'Food', icon: '🍔' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚌' },
  { value: 'SHOPPING', label: 'Shopping', icon: '🛍' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎮' },
  { value: 'EDUCATION', label: 'Education', icon: '📚' },
  { value: 'HEALTH', label: 'Health', icon: '💊' },
  { value: 'UTILITIES', label: 'Utilities', icon: '⚡' },
  { value: 'OTHER', label: 'Other', icon: '📦' },
];

const AddExpenseModal = ({ isOpen, onClose, initialData = null }) => {
  const { mutate: createExpense, isPending } = useCreateExpense();
  const [formData, setFormData] = useState({
    amount: '',
    category: 'FOOD',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [budgetInfo, setBudgetInfo] = useState({}); // { FOOD: { limit: 1000, spent: 800, remaining: 200 } }

  // Fetch budget status for all categories on open
  useEffect(() => {
    if (!isOpen) return;
    const month = new Date().toISOString().slice(0, 7);
    api.get(`/api/budgets/status?month=${month}`)
      .then(res => {
        const info = {};
        (res.data || []).forEach(b => {
          info[b.category] = {
            limit: b.limit,
            spent: b.spent || 0,
            remaining: b.remaining
          };
        });
        setBudgetInfo(info);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        amount: initialData.amount || '',
        category: initialData.suggestedCategory || 'FOOD',
        note: initialData.merchant || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
      });
    } else if (isOpen && !initialData) {
       setFormData({ amount: '', category: 'FOOD', note: '', date: new Date().toISOString().split('T')[0] });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createExpense(
      { ...formData, amount: Number(formData.amount) },
      {
        onSuccess: () => {
          setFormData({ amount: '', category: 'FOOD', note: '', date: new Date().toISOString().split('T')[0] });
          onClose();
        },
        onError: (error) => {
          if (error.response?.data?.error === 'BUDGET_EXCEEDED') {
            onClose(); // Close modal, toast handles the message
          }
        }
      }
    );
  };

  if (!isOpen) return null;

  // Real-time budget check
  const currentBudget = budgetInfo[formData.category];
  const enteredAmount = Number(formData.amount) || 0;
  const wouldExceed = currentBudget && enteredAmount > 0 && enteredAmount > currentBudget.remaining;
  const isSubmitDisabled = isPending || wouldExceed;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all text-lg ${
                  wouldExceed ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-primary'
                }`}
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                    formData.category === cat.value
                      ? 'border-primary bg-bg-light text-primary'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time budget warning */}
          {wouldExceed && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-base mt-0.5">⚠️</span>
              <p className="text-sm text-red-700 font-medium">
                Exceeds your ₹{currentBudget.limit.toLocaleString('en-IN')} {formData.category} budget — only <span className="font-bold">₹{Math.max(0, currentBudget.remaining).toLocaleString('en-IN')}</span> left
              </p>
            </div>
          )}

          {/* Budget info when not exceeding */}
          {currentBudget && !wouldExceed && enteredAmount > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-sm">✅</span>
              <p className="text-xs text-emerald-700">
                ₹{currentBudget.remaining.toLocaleString('en-IN')} remaining in {formData.category} budget
              </p>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input
              type="text"
              name="note"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="e.g. Lunch at canteen"
              value={formData.note}
              onChange={handleChange}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-2.5 rounded-lg font-semibold transition-all flex justify-center items-center mt-4 shadow-md ${
              isSubmitDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-opacity-90'
            }`}
          >
            {isPending ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : wouldExceed ? '🚫 Budget Exceeded' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
