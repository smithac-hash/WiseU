import React from 'react';
import { useDailySummary } from '../../hooks/useExpenses';
import { CATEGORY_MAP, formatCurrency } from '../../utils/constants';

const DayDetailDrawer = ({ date, isOpen, onClose, onAddExpense }) => {
  const { data: dailyData, isLoading } = useDailySummary(date);

  if (!isOpen) return null;

  const displayDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = dailyData?.categories?.reduce((sum, c) => sum + c.total, 0) || 0;
  const expenses = dailyData?.expenses || [];

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-bg-light">
          <div>
            <h2 className="text-lg font-bold text-primary">Day Details</h2>
            <p className="text-sm text-gray-500">{displayDate}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-2 text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-4xl">🍃</div>
              <p className="text-gray-500">No expenses recorded for this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((exp) => {
                const catInfo = CATEGORY_MAP[exp.category];
                return (
                  <div key={exp.id} className="flex items-center p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: catInfo?.color + '20', color: catInfo?.color }}>
                      {catInfo?.icon}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{catInfo?.label}</p>
                      {exp.note && <p className="text-xs text-gray-500 truncate">{exp.note}</p>}
                    </div>
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0">{formatCurrency(exp.amount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50 mt-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Day Total</span>
            <span className="text-2xl font-bold text-gray-800">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={() => {
              onClose();
              onAddExpense(date);
            }}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-opacity-90 transition shadow-sm"
          >
            + Add Expense for this day
          </button>
        </div>
      </div>
    </>
  );
};

export default DayDetailDrawer;
