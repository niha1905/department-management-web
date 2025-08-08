import React, { useState } from "react";
import { FaBriefcase, FaUser, FaHeartbeat, FaEdit, FaTrash, FaCheck } from "react-icons/fa";

const categoryStyles = {
  work: "bg-[var(--gm-white)]",
  personal: "bg-[var(--gm-white)]",
  health: "bg-[var(--gm-white)]",
};

const categoryIcons = {
  work: <FaBriefcase />,
  personal: <FaUser />,
  health: <FaHeartbeat />,
};

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
}) {
  const [hovered, setHovered] = useState(false);
  const [completed, setCompleted] = useState(task.completed);

  const handleComplete = () => {
    setCompleted(true);
    setTimeout(() => onComplete(task.id), 400);
  };

  return (
    <div
      className={`
        relative group p-4 mb-4 rounded-2xl
        ${categoryStyles[task.category]}
        border border-[var(--color-border)] shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        flex items-center transition-all duration-300 ease-in-out
        ${hovered ? "scale-105 shadow-[0_8px_28px_rgba(0,0,0,0.08)]" : ""}
        ${completed ? "opacity-60 blur-[1px] scale-95" : ""}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-2xl mr-3 text-[var(--gm-aqua)]">{categoryIcons[task.category]}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-slate-900">{task.name}</span>
          <span className={`ml-2 w-3 h-3 rounded-full ${priorityColors[task.priority]}`} />
        </div>
        <div className="text-sm text-slate-600">{task.description}</div>
      </div>
      <input
        type="checkbox"
        checked={completed}
        onChange={handleComplete}
        className="w-5 h-5 accent-[var(--gm-aqua)] border-2 border-[var(--color-border)] rounded-full transition-all duration-300"
      />
      {hovered && (
        <div className="absolute right-4 top-4 flex gap-2 animate-fade-in">
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition text-slate-700"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition text-slate-700"
            title="Delete"
          >
            <FaTrash />
          </button>
          {!completed && (
            <button
              onClick={handleComplete}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition text-slate-700"
              title="Mark Complete"
            >
              <FaCheck />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
