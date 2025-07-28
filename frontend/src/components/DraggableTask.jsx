import React from "react";
import { useDrag } from "react-dnd";

const DraggableTask = ({ task, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TASK",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{
        background: "#334155",   // dark card background
        color: "#f1f5f9",        // light text
        opacity: isDragging ? 0.7 : 1,
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 8,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(16,22,26,0.12)"
      }}
    >
      <div style={{ fontWeight: 600 }}>{task.title}</div>
      <div style={{ fontSize: 13 }}>{task.description}</div>
      {/* Add any other task fields you want to display */}
    </div>
  );
};

export default DraggableTask;
