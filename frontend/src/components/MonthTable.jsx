import React from "react";
import moment from "moment";
import classNames from "classnames";

const getMonthMatrix = (year, month) => {
  const firstDay = moment([year, month]);
  const startDay = firstDay.day();
  const daysInMonth = firstDay.daysInMonth();
  const matrix = [];
  let week = new Array(7).fill(null);
  let day = 1;
  for (let i = startDay; i < 7; i++) week[i] = day++;
  matrix.push(week);
  while (day <= daysInMonth) {
    week = new Array(7).fill(null);
    for (let i = 0; i < 7 && day <= daysInMonth; i++) week[i] = day++;
    matrix.push(week);
  }
  return matrix;
};

const MonthTable = ({
  year,
  month,
  tasksByDate,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}) => {
  const matrix = getMonthMatrix(year, month);
  const today = moment().format("YYYY-MM-DD");

  return (
    <div
      style={{
        background: "#ffffff", // white container
        color: "#333333",      // dark text
        borderRadius: 8,
        padding: 8,
        border: "1px solid #e5e7eb"
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <button onClick={onPrevMonth} aria-label="Previous month"
          style={{ background: "#f0f0f0", color: "#333333", borderRadius: 4, padding: "2px 8px", border: "1px solid #e5e7eb" }}
        >{"<"}</button>
        <span className="font-semibold">{moment([year, month]).format("MMMM YYYY")}</span>
        <button onClick={onNextMonth} aria-label="Next month"
          style={{ background: "#f0f0f0", color: "#333333", borderRadius: 4, padding: "2px 8px", border: "1px solid #e5e7eb" }}
        >{">"}</button>
      </div>
      <table className="w-full text-xs" style={{ background: "#ffffff", color: "#333333" }}>
        <thead>
          <tr>
            {["S", "M", "T", "W", "T", "F", "S"].map(d => (
              <th
                key={d}
                style={{
                  background: "#ffffff",
                  color: "#333333",
                  borderColor: "#e5e7eb",
                  padding: "4px 0"
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => {
                const dateStr = day
                  ? moment([year, month, day]).format("YYYY-MM-DD")
                  : null;
                const hasTask = dateStr && tasksByDate[dateStr];
                // Highlight today
                const isToday = dateStr === today;
                // Highlight has-task (but not today)
                const isHasTask = hasTask && !isToday;

                let cellStyle = {
                  background: "#f9fafb",
                  color: "#333333",
                  borderColor: "#e5e7eb",
                  borderRadius: 4,
                  cursor: "pointer",
                  padding: "4px 0"
                };
                if (isToday) {
                  cellStyle.background = "#4f46e5";
                  cellStyle.color = "#ffffff";
                } else if (isHasTask) {
                  cellStyle.background = "#818cf8";
                  cellStyle.color = "#ffffff";
                }

                return (
                  <td
                    key={j}
                    style={cellStyle}
                    onClick={() => dateStr && onDayClick(dateStr)}
                    aria-label={dateStr}
                  >
                    {day || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthTable;
