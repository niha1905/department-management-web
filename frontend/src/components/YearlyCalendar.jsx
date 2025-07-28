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

const YearlyCalendar = ({ year, tasksByDate, onMonthClick }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl overflow-auto shadow-xl">
      <h2 className="text-lg font-semibold mb-4 text-center">{year} Yearly Planner</h2>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(12)].map((_, m) => {
          const monthMatrix = getMonthMatrix(year, m);
          return (
            <div key={m} className="border rounded p-2">
              <div className="text-center font-medium mb-1 cursor-pointer"
                onClick={() => onMonthClick(moment([year, m, 1]).format("YYYY-MM-DD"))}>
                {moment([year, m]).format("MMMM")}
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {monthMatrix.map((week, i) => (
                    <tr key={i}>
                      {week.map((day, j) => {
                        const dateStr = day
                          ? moment([year, m, day]).format("YYYY-MM-DD")
                          : null;
                        const hasTask = dateStr && tasksByDate[dateStr];
                        return (
                          <td
                            key={j}
                            className={classNames(
                              "p-1 rounded cursor-pointer",
                              { "bg-blue-200": hasTask }
                            )}
                            onClick={() => dateStr && onMonthClick(dateStr)}
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
        })}
      </div>
    </div>
  </div>
);

export default YearlyCalendar;
