import React from 'react';

export default function Calendar({ calendarDays, getDailyTasksForDate, getTasksForDate, navigate, onDayClick }) {
  return (
    <div className="grid grid-cols-7 gap-1 text-xs">
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
            className={`p-2 text-center border border-gray-100 min-h-[40px] flex flex-col items-center justify-center transition-colors duration-150 cursor-pointer ${
              isToday ? 'bg-blue-50 border-blue-200' : hasEvents ? 'hover:bg-blue-50/80' : 'hover:bg-blue-50'
            }`}
            onClick={() => day && onDayClick ? onDayClick(day) : navigate(`/routine-tasks?date=${day.toISOString().slice(0,10)}`)}
            title={dailyTasksForDay.length > 0 ? dailyTasksForDay.map(t => t.title).join(', ') : ''}
          >
            {day && (
              <>
                <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : hasEvents ? 'font-medium text-gray-800' : 'text-gray-700'}`}>
                  {day.getDate()}
                </span>
                {dailyTasksForDay.length > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                )}
                {dailyTasksForDay.length === 0 && otherTasksForDay.length > 0 && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}