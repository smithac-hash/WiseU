import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAuth } from '../hooks/useAuth';
import { useCalendarData } from '../hooks/useExpenses';
import DayDetailDrawer from '../components/calendar/DayDetailDrawer';
import AddExpenseModal from '../components/AddExpenseModal';
import { formatCurrency } from '../utils/constants';

const locales = { 'en-IN': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarView = () => {
  const { user, logout } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState(null);

  const monthKey = format(currentDate, 'yyyy-MM');
  const { data: calendarData } = useCalendarData(monthKey);

  // Calculate daily budget target
  const dailyTarget = user?.monthlyIncome ? user.monthlyIncome / 30 : 0;

  // Custom Day Cell Wrapper to inject colors and badges
  const CustomDateCellWrapper = ({ value, children }) => {
    const dateKey = format(value, 'yyyy-MM-dd');
    const dayData = calendarData?.[dateKey];
    
    let bgColor = 'bg-white';
    if (dayData) {
      bgColor = dayData.total > dailyTarget && dailyTarget > 0 
        ? 'bg-danger/10' 
        : 'bg-success/10';
    }

    return (
      <div className={`rbc-day-bg ${bgColor} relative cursor-pointer hover:bg-opacity-70 transition`} onClick={() => setSelectedDate(dateKey)}>
        {dayData && (
          <div className="absolute bottom-1 right-1 left-1 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm w-full text-center truncate">
              {formatCurrency(dayData.total)}
            </span>
            <span className="text-[9px] text-gray-500 mt-0.5">{dayData.count} tx</span>
          </div>
        )}
      </div>
    );
  };

  const handleNavigate = (newDate) => setCurrentDate(newDate);

  const openAddModalForDate = (date) => {
    setAddModalDate(new Date(date));
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary">WiseU 🎓</h1>
            <nav className="flex gap-4">
              <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-primary transition">Dashboard</a>
              <span className="text-sm font-bold text-primary border-b-2 border-primary pb-1">Calendar</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">Hi, {user?.name}</span>
            <button onClick={logout} className="text-danger text-sm font-medium hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 h-[calc(100vh-140px)] min-h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Spending Calendar</h2>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-success/20 border border-success/30"></span> Under Target</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-danger/20 border border-danger/30"></span> Over Target</div>
            </div>
          </div>

          <div className="flex-1 min-h-0 calendar-container">
            <Calendar
              localizer={localizer}
              events={[]} // We don't use standard events, we render directly in cells
              startAccessor="start"
              endAccessor="end"
              views={['month']}
              date={currentDate}
              onNavigate={handleNavigate}
              components={{
                dateCellWrapper: CustomDateCellWrapper,
              }}
              className="font-sans text-sm"
            />
          </div>
        </div>
      </main>

      {/* Drawer */}
      <DayDetailDrawer 
        date={selectedDate} 
        isOpen={!!selectedDate} 
        onClose={() => setSelectedDate(null)} 
        onAddExpense={openAddModalForDate}
      />

      {/* Add Modal */}
      <AddExpenseModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        defaultDate={addModalDate}
      />

      {/* Inject some CSS to override Big Calendar defaults */}
      <style>{`
        .calendar-container .rbc-calendar { border: none; }
        .calendar-container .rbc-month-view { border: 1px solid #f3f4f6; border-radius: 12px; overflow: hidden; }
        .calendar-container .rbc-header { padding: 12px 0; font-weight: 600; text-transform: uppercase; font-size: 11px; color: #9CA3AF; border-bottom: 1px solid #f3f4f6; }
        .calendar-container .rbc-day-bg { border-left: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; }
        .calendar-container .rbc-date-cell { padding: 8px; font-weight: 500; color: #4B5563; text-align: left; }
        .calendar-container .rbc-off-range-bg { background-color: #f9fafb !important; }
        .calendar-container .rbc-today { background-color: transparent; }
        .calendar-container .rbc-today .rbc-date-cell { color: #534AB7; font-weight: 700; }
        .calendar-container .rbc-toolbar button { border-radius: 8px; font-medium: 500; font-size: 13px; color: #4B5563; }
        .calendar-container .rbc-toolbar button:active, .calendar-container .rbc-toolbar button.rbc-active { background-color: #534AB7; color: white; border-color: #534AB7; box-shadow: none; }
      `}</style>
    </div>
  );
};

export default CalendarView;
