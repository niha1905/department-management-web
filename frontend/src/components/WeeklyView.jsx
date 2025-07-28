import React from "react";
import moment from "moment";
import classNames from "classnames";
import { Repeat, CheckCircle } from 'lucide-react';

const WeeklyView = ({ weekDates, tasksByDate, onTaskClick, onTaskComplete }) => {
  // Calculate progress for the week
  const allTasks = weekDates.flatMap(date => tasksByDate[date.format('YYYY-MM-DD')] || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-1 overflow-x-auto bg-white">
      {/* Progress bar at top */}
      <div className="absolute left-0 right-0 top-0 h-2 bg-gray-100">
        <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
      </div>
      {weekDates.map(date => {
        const dateStr = date.format("YYYY-MM-DD");
        const tasks = tasksByDate[dateStr] || [];
        return (
          <div key={dateStr} className="flex-1 min-w-[150px] border-r border-gray-200 p-2 relative">
            <div className={`text-center font-medium mb-2 ${date.isSame(moment(), 'day') ? 'text-indigo-600' : 'text-gray-800'}`}>
              {date.format("ddd")}
              <div className="text-sm text-gray-600">
                {date.format("MMM D")}
              </div>
            </div>
            <div>
              {tasks.length === 0 && (
                <div className="text-gray-400 text-xs text-center py-8">No tasks</div>
              )}
              {tasks.map(task => (
                <div
                  key={task._id || task.id}
                  className={classNames(
                    "mb-2 p-2 rounded shadow-sm cursor-pointer border-l-4 flex flex-col gap-1",
                    {
                      "bg-indigo-50 border-indigo-500": task.type === 'routine task' && !task.completed,
                      "bg-emerald-100 border-emerald-500": task.status === "Completed" || task.completed,
                      "bg-rose-100 border-rose-500": task.priority === "High",
                      "bg-blue-100 border-blue-500": task.priority === "Medium",
                      "bg-gray-100 border-gray-400": task.priority === "Low",
                      "opacity-60 line-through": task.completed,
                    }
                  )}
                  onClick={() => onTaskClick(task)}
                  aria-label={task.title}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTaskComplete) onTaskComplete(task);
                      }}
                    >
                      {task.completed ? (
                        <CheckCircle size={16} className="text-emerald-600" title="Completed" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-400 rounded-sm hover:border-indigo-500" />
                      )}
                    </div>
                    {task.type === 'routine task' && !task.completed && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block" />
                    )}
                    <div className="font-medium">{task.title}</div>
                    {task.recurrence && (
                      <Repeat size={14} className="text-indigo-500 ml-1" title="Recurring" />
                    )}
                  </div>
                  {task.deadline && (
                    <div className="text-xs text-indigo-700 mt-1">
                      {moment(task.deadline).format('hh:mm A')}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">{task.description}</div>
                  <div className="flex gap-1 mt-1">
                    {task.tags && task.tags.map((tag, idx) => (
                      <span key={tag + '-' + idx} className="bg-gray-200 rounded px-1 text-xs">{tag}</span>
                    ))}
                    {task.priority && (
                      <span className={classNames("rounded px-1 text-xs ml-1", {
                        "bg-rose-200 text-rose-800": task.priority === "High",
                        "bg-blue-200 text-blue-800": task.priority === "Medium",
                        "bg-gray-200 text-gray-800": task.priority === "Low",
                      })}>{task.priority}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Progress count for the day */}
            {tasks.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {tasks.filter(t => t.completed).length}/{tasks.length} done
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyView;
