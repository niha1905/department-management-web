import React from 'react';

export default function Calendar({ calendarDays, getDailyTasksForDate, getTasksForDate, navigate, onDayClick }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 text-xs animate-fadeIn">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center text-gray-500 font-medium">
          {day}
        </div>
      ))}
      {calendarDays.map((day, index) => {
        const dailyTasksForDay = getDailyTasksForDate(day);
        const otherTasksForDay = getTasksForDate(day);
        const isToday = day && day.toDateString() === new Date().toDateString();
        const hasEvents = dailyTasksForDay.length > 0 || otherTasksForDay.length > 0;
        return (
          <div
            key={index}
            className={`p-2 text-center border min-h-[48px] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer rounded-2xl transform hover:scale-105 hover:shadow-md ${
              isToday 
                ? 'border-[var(--gm-aqua)]/40 bg-[rgba(63,255,224,0.08)] shadow-inner' 
                : hasEvents 
                  ? 'border-[var(--color-border)] hover:bg-[rgba(63,255,224,0.06)] hover:border-[var(--color-border)]' 
                  : 'border-[var(--color-border)] hover:bg-gray-50/80'
            }`}
            onClick={() => day && onDayClick ? onDayClick(day) : navigate(`/routine-tasks?date=${day.toISOString().slice(0,10)}`)}
            title={dailyTasksForDay.length > 0 ? dailyTasksForDay.map(t => t.title).join(', ') : ''}
          >
            {day && (
              <>
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                  isToday 
                    ? 'ring-2 ring-offset-2 ring-[var(--gm-aqua)] ring-offset-white shadow-md' 
                    : hasEvents 
                      ? 'hover:shadow-sm' 
                      : ''
                }`}>
                  <div className={`flex items-center justify-center w-full h-full rounded-full ${
                    isToday 
                      ? 'bg-[var(--gm-aqua)] text-[#05343a] font-bold' 
                      : hasEvents 
                        ? 'bg-[rgba(63,255,224,0.12)] text-[var(--gm-dark)] font-medium' 
                        : 'text-gray-700'
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="mt-1 flex gap-1">
                  {dailyTasksForDay.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[var(--gm-yellow)]"></span>
                  )}
                  {otherTasksForDay.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[var(--gm-aqua)]"></span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}