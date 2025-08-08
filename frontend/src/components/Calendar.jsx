import React from "react";
import { FaBriefcase, FaUser, FaHeartbeat } from "react-icons/fa";

const categoryIcons = {
  work: <FaBriefcase className="text-blue-500" />,
  personal: <FaUser className="text-pink-500" />,
  health: <FaHeartbeat className="text-green-500" />,
};

const categoryDotColors = {
  work: "bg-gradient-to-r from-blue-400 to-purple-500",
  personal: "bg-gradient-to-r from-pink-400 to-orange-400",
  health: "bg-gradient-to-r from-green-400 to-blue-400",
};

export default function Calendar({
  days,
  selectedDate,
  onSelectDate,
  tasksByDate,
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/80 shadow-xl">
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center font-bold text-gray-500 mb-2">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          const isSelected = selectedDate && day && day.isSame(selectedDate, "day");
          const tasks = day ? tasksByDate[day.format("YYYY-MM-DD")] || [] : [];
          return (
            <div key={idx} className="h-16 flex flex-col items-center justify-start">
              {day ? (
                <button
                  onClick={() => onSelectDate(day)}
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full
                    transition duration-300 ease-in-out
                    ${isSelected
                      ? "bg-gradient-to-br from-purple-500 to-pink-400 text-white shadow-lg scale-110"
                      : "hover:bg-gradient-to-br hover:from-teal-400 hover:to-blue-400 hover:text-white hover:shadow-md"}
                  `}
                  style={{ outline: "none" }}
                >
                  {day.date()}
                </button>
              ) : null}
              <div className="flex gap-1 mt-1">
                {tasks.slice(0, 3).map((task, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${categoryDotColors[task.category]} shadow`}
                  />
                ))}
                {tasks.length > 3 && (
                  <span className="text-xs text-gray-400">+{tasks.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
