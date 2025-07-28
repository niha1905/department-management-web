import React, { useState } from "react";
import AddTaskForm from "./AddTaskForm";

const TaskPanel = ({ task, onClose, onEdit, onDelete, onEditStatus, projects = [] }) => {
  const [editMode, setEditMode] = useState(false);
  const [editStatusMode, setEditStatusMode] = useState(false);
  const [comment, setComment] = useState("");

  // Edit Mode
  if (editMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <form
          style={{
            background: "#ffffff",
            color: "#333333",
            borderRadius: 8,
            padding: 24,
            width: "95%",
            maxWidth: 350,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
          onSubmit={e => {
            e.preventDefault();
            // Ensure completed status is properly set
            const updatedTask = { ...task };
            if (updatedTask.status === "Completed") {
              updatedTask.completed = true;
            }
            onEdit(updatedTask);
            setEditMode(false);
          }}
        >
          <h2 className="font-semibold text-lg mb-4">Edit Task</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full mb-2 p-2 border rounded"
              placeholder="Title"
              value={task.title}
              onChange={e => onEdit({ ...task, title: e.target.value })}
              required
              style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full mb-2 p-2 border rounded"
              placeholder="Description"
              value={task.description}
              onChange={e => onEdit({ ...task, description: e.target.value })}
              style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              name="type"
              value={task.type}
              onChange={e => onEdit({ ...task, type: e.target.value })}
              required
              style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
            >
              <option>Task</option>
              <option>Event</option>
              <option>Reminder</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              name="priority"
              value={task.priority}
              onChange={e => onEdit({ ...task, priority: e.target.value })}
              required
              style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              name="status"
              value={task.status || (task.completed ? "Completed" : "Ongoing")}
              onChange={e => {
                const newStatus = e.target.value;
                const isCompleted = newStatus === "Completed";
                onEdit({ ...task, status: newStatus, completed: isCompleted });
              }}
              required
              style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
            >
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={task.completed || task.status === "Completed"}
                onChange={e => {
                  const isCompleted = e.target.checked;
                  onEdit({ ...task, completed: isCompleted, status: isCompleted ? "Completed" : "Ongoing" });
                }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Mark as completed</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              style={{ background: "#f0f0f0", color: "#333333", border: "1px solid #e5e7eb" }}
              className="px-3 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ background: "#4f46e5", color: "#ffffff" }}
              className="px-3 py-1 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Edit Status: only status and comment
  if (editStatusMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <form
          style={{
            background: "#ffffff",
            color: "#333333",
            borderRadius: 8,
            padding: 24,
            width: "95%",
            maxWidth: 350,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
          onSubmit={e => {
            e.preventDefault();
            // Check if task has a status property, if not use completed property
            const updatedTask = { ...task };
            if (updatedTask.status === "Completed" || updatedTask.completed) {
              updatedTask.completed = true;
            } else {
              updatedTask.completed = false;
            }
            onEdit(updatedTask);
            setEditStatusMode(false);
          }}
        >
          <h2 className="font-semibold text-lg mb-4">Edit Status</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              name="status"
              value={task.status || (task.completed ? "Completed" : "Ongoing")}
              onChange={e => {
                const newStatus = e.target.value;
                const isCompleted = newStatus === "Completed";
                onEdit({ ...task, status: newStatus, completed: isCompleted });
              }}
              required
              style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
            >
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={task.completed || task.status === "Completed"}
                onChange={e => {
                  const isCompleted = e.target.checked;
                  onEdit({ ...task, completed: isCompleted, status: isCompleted ? "Completed" : "Ongoing" });
                }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Mark as completed</span>
            </label>
          </div>
          <textarea
            className="w-full mb-2 p-2 border rounded"
            placeholder="Add comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ background: "#ffffff", color: "#333333", borderColor: "#e5e7eb" }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditStatusMode(false)}
              style={{ background: "#f0f0f0", color: "#333333", border: "1px solid #e5e7eb" }}
              className="px-3 py-1 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ background: "#4f46e5", color: "#ffffff" }}
              className="px-3 py-1 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Default view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div
        style={{
          background: "#ffffff",
          color: "#333333",
          borderRadius: 8,
          padding: 24,
          width: "95%",
          maxWidth: 350,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Task Details</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: "#f0f0f0", color: "#333333", borderRadius: 4, padding: "2px 10px", border: "1px solid #e5e7eb" }}>&times;</button>
        </div>
        <div className="mb-2"><strong>Title:</strong> {task.title}</div>
        <div className="mb-2"><strong>Description:</strong> {task.description}</div>
        <div className="mb-2"><strong>People Involved:</strong> {task.involved}</div>
        <div className="mb-2"><strong>Start:</strong> {task.startDate} {task.startTime}</div>
        <div className="mb-2"><strong>Deadline:</strong> {task.endDate} {task.endTime}</div>
        <div className="mb-2"><strong>Priority:</strong> {task.priority}</div>
        <div className="mb-2"><strong>Status:</strong> {task.status}</div>
        <div className="mb-2"><strong>Tags:</strong> {task.tags?.join(", ")}</div>
        <div className="mb-2"><strong>Project:</strong> {projects.find(p => p.id === task.project)?.name || ""}</div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setEditMode(true)}
            style={{ background: "#4f46e5", color: "#ffffff" }}
            className="px-3 py-1 rounded"
          >
            Edit Task
          </button>
          <button
            onClick={() => setEditStatusMode(true)}
            style={{ background: "#4f46e5", color: "#ffffff" }}
            className="px-3 py-1 rounded"
          >
            Edit Status
          </button>
          <button
            onClick={() => onDelete(task.id)}
            style={{ background: "#ef4444", color: "#ffffff" }}
            className="px-3 py-1 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;
