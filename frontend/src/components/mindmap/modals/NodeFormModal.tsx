import React, { useState, useEffect } from 'react';
import { FolderOpen, CheckSquare, AlertCircle, MessageSquare, Plus, Trash2 } from 'lucide-react';

const nodeTypes = [
  { type: 'project', label: 'Project', icon: <FolderOpen className="w-5 h-5 mr-1 text-blue-600" /> },
  { type: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5 mr-1 text-green-600" /> },
  { type: 'status', label: 'Status', icon: <AlertCircle className="w-5 h-5 mr-1 text-yellow-600" /> },
  { type: 'comment', label: 'Comment', icon: <MessageSquare className="w-5 h-5 mr-1 text-purple-600" /> },
];

const statusOptions = [
  'Not Started',
  'In Progress',
  'Completed',
  'Blocked',
];

export function NodeFormModal({ isOpen, onClose, onSubmit, type, initialData }) {
  const [selectedType, setSelectedType] = useState(type || 'project');
  const [label, setLabel] = useState(initialData?.label || '');
  const [tasks, setTasks] = useState(initialData?.tasks || [{ id: Date.now().toString(), text: '', completed: false, status: statusOptions[0], comment: '' }]);
  const [status, setStatus] = useState(initialData?.status || statusOptions[0]);
  const [comment, setComment] = useState(initialData?.comment || '');
  // parentId is passed via props (from modalData in parent)
  const parentId = initialData?.parentId ?? (typeof type === 'object' && type?.parentId ? type.parentId : undefined);

  useEffect(() => {
    setLabel(initialData?.label || '');
    setTasks(initialData?.tasks || [{ id: Date.now().toString(), text: '', completed: false, status: statusOptions[0], comment: '' }]);
    setStatus(initialData?.status || statusOptions[0]);
    setComment(initialData?.comment || '');
    setSelectedType(type || 'project');
  }, [initialData, type]);

  if (!isOpen) return null;

  const handleTaskChange = (idx, field, value) => {
    setTasks(tasks => tasks.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };
  const handleAddTask = () => {
    setTasks([...tasks, { id: Date.now().toString(), text: '', completed: false, status: statusOptions[0], comment: '' }]);
  };
  const handleRemoveTask = (idx) => {
    setTasks(tasks => tasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Always send nodeType, not selectedType
    const basePayload = { label, parentId, nodeType: selectedType };
    if (selectedType === 'project') {
      onSubmit(basePayload);
    } else if (selectedType === 'tasks') {
      onSubmit({ ...basePayload, tasks });
    } else if (selectedType === 'status') {
      onSubmit({ ...basePayload, status, comment });
    } else if (selectedType === 'comment') {
      onSubmit({ ...basePayload, comment });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-500" /> Add Node
        </h2>
        <div className="flex gap-2 mb-4">
          {nodeTypes.map(nt => (
            <button
              key={nt.type}
              type="button"
              className={`flex items-center px-3 py-1.5 rounded-lg border transition-all font-medium text-sm ${selectedType === nt.type ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-blue-50'}`}
              onClick={() => setSelectedType(nt.type)}
            >
              {nt.icon} {nt.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={label}
              onChange={e => setLabel(e.target.value)}
              required
              placeholder="Enter title"
            />
          </div>
          {selectedType === 'tasks' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tasks</label>
              {tasks.map((task, idx) => (
                <div key={task.id} className="flex gap-2 items-start mb-2">
                  <input
                    className="flex-1 border border-gray-300 rounded px-2 py-1"
                    value={task.text}
                    onChange={e => handleTaskChange(idx, 'text', e.target.value)}
                    placeholder={`Task ${idx + 1}`}
                    required
                  />
                  <label htmlFor={`task-status-${task.id}`} className="sr-only">
                    Status for Task {idx + 1}
                  </label>
                  <select
                    id={`task-status-${task.id}`}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={task.status}
                    onChange={e => handleTaskChange(idx, 'status', e.target.value)}
                    aria-label={`Status for Task ${idx + 1}`}
                  >
                    {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                  <textarea
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                    value={task.comment}
                    onChange={e => handleTaskChange(idx, 'comment', e.target.value)}
                    placeholder="Comment"
                  />
                  <button type="button" title="Remove Task" onClick={() => handleRemoveTask(idx)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={handleAddTask} className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-100 text-green-700 mt-2"><Plus className="w-4 h-4" /> Add Task</button>
            </div>
          )}
          {selectedType === 'status' && (
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={status}
                onChange={e => setStatus(e.target.value)}
                aria-label="Status"
                title="Status"
              >
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Enter details..."
              />
            </div>
          )}
          {selectedType === 'comment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Enter comment..."
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 