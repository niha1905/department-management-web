import React, { useState, useEffect } from 'react';
import ColorPicker from '../../ColorPicker';
// Color map for mindmap nodes
const colorMap = {
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  teal: 'bg-teal-400',
  indigo: 'bg-indigo-400',
  pink: 'bg-pink-400',
  orange: 'bg-orange-400',
  gray: 'bg-gray-400',
};
import { fetchUsers } from '../../../services/api';
import { FolderOpen, CheckSquare, AlertCircle, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
}

const nodeTypes = [
  { type: 'project', label: 'Project', icon: <FolderOpen className="w-5 h-5 mr-1 text-blue-600" /> },
  { type: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5 mr-1 text-green-600" /> },
  { type: 'status', label: 'Status', icon: <AlertCircle className="w-5 h-5 mr-1 text-yellow-600" /> },
  { type: 'comment', label: 'Comment', icon: <MessageSquare className="w-5 h-5 mr-1 text-purple-600" /> },
];

const statusOptions = ['Not Started', 'In Progress', 'Completed', 'Blocked'];

export function NodeFormModal({ isOpen, onClose, onSubmit, type, initialData }) {
  // Color state
  const [color, setColor] = useState(initialData?.color || 'blue');
  // Update color if initialData changes
  useEffect(() => {
    setColor(initialData?.color || 'blue');
  }, [initialData]);
  const [selectedType, setSelectedType] = useState(type || 'project');
  const [label, setLabel] = useState(initialData?.label || '');
  const [tasks, setTasks] = useState(initialData?.tasks || [
    { id: Date.now().toString(), text: '', completed: false, status: statusOptions[0], comment: '' }
  ]);
  const [status, setStatus] = useState(initialData?.status || statusOptions[0]);
  const [comment, setComment] = useState(initialData?.comment || '');
  const parentId = initialData?.parentId ?? (typeof type === 'object' && type?.parentId ? type.parentId : undefined);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [assignedTo, setAssignedTo] = useState<string[]>(initialData?.assignedTo || []);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.users || []);
          setUsers(list);
        })
        .catch(error => {
          console.error('Error fetching users:', error);
          setUsers([]);
        });
    }
  }, [isOpen]);

  // Reset form when initialData/type changes
  useEffect(() => {
    setLabel(initialData?.label || '');
    setTasks(initialData?.tasks || [
      { id: Date.now().toString(), text: '', completed: false, status: statusOptions[0], comment: '' }
    ]);
    setStatus(initialData?.status || statusOptions[0]);
    setComment(initialData?.comment || '');
    setSelectedType(type || 'project');
    setAssignedTo(initialData?.assignedTo || []);
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

  // Color picker handler
  const handleSelectColor = (_noteId, colorName) => {
    setColor(colorName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const basePayload = { label, parentId, nodeType: selectedType, assignedTo, color };
    let payload;
    if (selectedType === 'project') {
      payload = basePayload;
    } else if (selectedType === 'tasks') {
      payload = { ...basePayload, tasks };
    } else if (selectedType === 'status') {
      payload = { ...basePayload, status, comment };
    } else if (selectedType === 'comment') {
      payload = { ...basePayload, comment };
    }

    // Show notification for the change
    import('../../../services/notificationService').then(({ default: notificationService }) => {
      notificationService.showChangeNotification(
        initialData?._id ? 'updated' : 'created',
        selectedType,
        label,
        selectedType === 'tasks' ? `${tasks.length} task(s)` : ''
      );
    });

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex items-center gap-2 z-10">
          <Plus className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold">Add Node</h2>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Node Types */}
          <div className="flex gap-2 flex-wrap">
            {nodeTypes.map(nt => (
              <button
                key={nt.type}
                type="button"
                className={`flex items-center px-3 py-1.5 rounded-lg border transition-all font-medium text-sm ${
                  selectedType === nt.type
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-blue-50'
                }`}
                onClick={() => setSelectedType(nt.type)}
              >
                {nt.icon} {nt.label}
              </button>
            ))}
          </div>

    {/* Title */}
        {/* Choose Colour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Choose Colour</label>
          <div className="flex items-center gap-3">
            <ColorPicker colorMap={colorMap} onSelectColor={handleSelectColor} noteId={null} />
            <span className={`w-6 h-6 rounded-full border border-gray-300 ${colorMap[color]}`}></span>
          </div>
        </div>
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

          {/* Assign to Users */}
          {(selectedType === 'tasks' || selectedType === 'project') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Users</label>
              <select
                multiple
                aria-label="Assign to users"
                title="Select users to assign"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
                value={assignedTo}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setAssignedTo(options);
                }}
              >
                {users.map((user, idx) => (
                  <option key={user.id || user._id || idx} value={user.name || user.email || ''}>
                    {user.name || user.email || ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tasks */}
          {selectedType === 'tasks' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tasks</label>
              <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-start gap-1.5 border border-gray-200 rounded p-2 bg-gray-50"
                  >
                    <input
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      value={task.text}
                      onChange={e => handleTaskChange(idx, 'text', e.target.value)}
                      placeholder={`Task ${idx + 1}`}
                      required
                    />
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      value={task.status}
                      onChange={e => handleTaskChange(idx, 'status', e.target.value)}
                      aria-label="Task status"
                    >
                      {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                      <select
                      aria-label={`Assign task ${idx + 1}`}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      value={task.assignee || ''}
                      onChange={e => handleTaskChange(idx, 'assignee', e.target.value)}
                    >
                      <option value="">Unassigned</option>
                        {users.map((user, pidx) => (
                          <option key={user.id || user._id || pidx} value={user.name || user.email || ''}>
                            {user.name || user.email || ''}
                          </option>
                        ))}
                    </select>
                    <textarea
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      value={task.comment}
                      onChange={e => handleTaskChange(idx, 'comment', e.target.value)}
                      placeholder="Comment"
                      rows={2}
                    />
                    <button
                      type="button"
                      title="Remove Task"
                      onClick={() => handleRemoveTask(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-100 text-green-700 mt-2"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          )}

          {/* Status */}
          {selectedType === 'status' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Enter details..."
              />
            </div>
          )}

          {/* Comment */}
          {selectedType === 'comment' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Comment</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Enter comment..."
              />
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2 z-10">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
NodeFormModal.defaultProps = {
  isOpen: false,
  onClose: () => {},
  onSubmit: () => {},
  type: 'project',
  initialData: {}
};