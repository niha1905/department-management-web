import React, { useState } from 'react';

const TaskDetailModal = ({ task, onClose, onStatusChange, onDelete, onEdit }) => {
  if (!task) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || '');
  const [editDesc, setEditDesc] = useState(task.description || '');

  const handleSave = async () => {
    if (!onEdit) return setIsEditing(false);
    await onEdit(task.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-[var(--color-border)] bg-[var(--gm-white)] text-slate-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-semibold text-[var(--gm-dark)]">
            {isEditing ? 'Edit Task' : task.title}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 transition-colors">✕</button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-[var(--gm-aqua)]">Description</h3>
          {isEditing ? (
            <textarea
              className="w-full rounded-2xl px-3 py-2 text-sm bg-white text-slate-900 border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-aqua)]/30"
              rows={4}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          ) : (
            <p className="text-slate-700">{task.description || 'No description available'}</p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 text-[var(--gm-aqua)]">Status</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onStatusChange(task.id)}
              className="w-4 h-4 accent-[var(--gm-aqua)]"
            />
            <span className="text-slate-700">{task.completed ? 'Completed' : 'Not Completed'}</span>
          </div>
        </div>

        <div className="flex justify-between items-center space-x-3">
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-2xl bg-[var(--gm-aqua)] text-[#05343a] hover:bg-[#5FFFF3] transition-colors shadow-sm"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditTitle(task.title || ''); setEditDesc(task.description || ''); }}
                  className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(task.id)}
              className="px-4 py-2 rounded-2xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
