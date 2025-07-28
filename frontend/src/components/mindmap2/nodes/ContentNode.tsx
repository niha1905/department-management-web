import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  FolderOpen, 
  CheckSquare, 
  AlertCircle, 
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle,
  MoreVertical,
  Save,
  X
} from 'lucide-react';
import { Button } from '../../ui/button'; 
import { NodeData, TaskItem } from '../types';
import { updateNote } from '../../../services/api';
import { deleteNote } from '../../../services/api';

  // Edit node in backend
  const handleEditNode = async (nodeId: string, updatedData: Record<string, any>) => {
    // Only send fields that are filled in the form
    const payload: Record<string, any> = {};
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] !== undefined && updatedData[key] !== null && updatedData[key] !== '') {
        payload[key] = updatedData[key];
      }
    });
    payload.id = nodeId;
    try {
      await fetch('/api/real_estate_mindmap/add_child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // TODO: Implement loadMindmap or remove this call if not needed
    } catch (err) {
      // Optionally show error
    }
  };

  // Delete node in backend
  const handleDeleteNode = async (nodeId) => {
    try {
      await fetch(`/api/real_estate_mindmap/delete_child/${nodeId}`, {
        method: 'DELETE',
      });
      // await loadMindmap(); // Removed because loadMindmap is not defined
    } catch (err) {
      // Optionally show error
    }
  };
interface ContentNodeProps {
  data: NodeData;
  id: string;
}

const gradients = [
  'gradient-green-blue',
  'gradient-pink-purple', 
  'gradient-yellow-red',
  'gradient-teal-cyan',
  'gradient-indigo-blue'
];

export function ContentNode({ data, id }: ContentNodeProps) {
  const [localTasks, setLocalTasks] = React.useState(data.tasks || []);
  const [showDesc, setShowDesc] = useState(false);
  const [comment, setComment] = useState(data.comment || '');
  const [status, setStatus] = useState(data.status || 'Not Completed');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.label);
  const [showActions, setShowActions] = useState(false);

  React.useEffect(() => {
    setLocalTasks(data.tasks || []);
  }, [data.tasks]);

  const handleTaskComplete = (taskId: string) => {
    const updatedTasks = localTasks.map(task =>
      task.id === taskId ? { ...task, completed: true } : task
    );
    setLocalTasks(updatedTasks);
    // If all tasks are completed, remove the node
    if (updatedTasks.every(task => task.completed)) {
      window.dispatchEvent(new CustomEvent('deleteNode', { detail: { id } }));
    }
    // Optionally, you may want to update the parent mindmap state here as well
  };

  const getIcon = () => {
    switch (data.nodeType) {
      case 'project':
        return <FolderOpen className="w-5 h-5" />;
      case 'tasks':
        return <CheckSquare className="w-5 h-5" />;
      case 'status':
        return <AlertCircle className="w-5 h-5" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <FolderOpen className="w-5 h-5" />;
    }
  };

  const getGradient = () => {
    // For notes, always use a consistent gradient
    // If you intend to support a 'note' nodeType, ensure it's included in NodeType.
    // Otherwise, remove or update this check.
    if (data.nodeType === 'project') { // Example: change 'note' to a valid NodeType, e.g., 'project'
      return 'gradient-green-blue';
    }
    if (data.gradient) return data.gradient;
    const index = parseInt(id.slice(-1)) % gradients.length;
    return gradients[index];
  };

  const handleEdit = () => {
    window.dispatchEvent(new CustomEvent('editNode', { detail: { id, data } }));
  };

  const handleDelete = () => {
    window.dispatchEvent(new CustomEvent('deleteNode', { detail: { id } }));
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('addNode', { detail: { type: 'project', parentId: id } }));
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsSaving(true);
    try {
      await updateNote(data.noteId, { completed: newStatus === 'Completed' });
    } catch {}
    setIsSaving(false);
  };

  const handleCommentSave = async () => {
    setIsSaving(true);
    try {
      await updateNote(data.noteId, { comment });
      setIsEditingComment(false);
    } catch {}
    setIsSaving(false);
  };

  const handleTitleSave = async () => {
    setIsSaving(true);
    try {
      await updateNote(data.noteId, { title: editedTitle });
      setIsEditingTitle(false);
      // Update the node data
      window.dispatchEvent(new CustomEvent('updateNode', { 
        detail: { id, data: { ...data, label: editedTitle } } 
      }));
    } catch {}
    setIsSaving(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(data.label);
    setIsEditingTitle(false);
  };

  const handleUpdateNode = async (nodeId: string, updatedData: Record<string, any>) => {
    try {
      await updateNote(nodeId, updatedData);
      console.log('Node updated successfully');
      // Optionally reload the mindmap or update the UI
    } catch (err) {
      console.error('Error updating node:', err);
    }
  };

  const renderTasks = () => {
    if (data.nodeType !== 'tasks' || !localTasks) return null;
    return (
      <div className="mt-3 space-y-2">
        {localTasks.map((task: TaskItem) => (
          <div key={task.id} className="flex items-start space-x-2 text-sm">
            <CheckCircle 
              className={`w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer transition-colors duration-150 ${
                task.completed ? 'text-green-200' : 'text-white/50 hover:text-green-400'
              }`} 
              onClick={() => !task.completed && handleTaskComplete(task.id)}
            />
            {/* Tooltip for completion status */}
            <span className="sr-only">{task.completed ? 'Completed' : 'Mark as completed'}</span>
            <div className="flex-1 min-w-0">
              <div className={`${task.completed ? 'line-through text-white/70' : 'text-white'}`}>{task.text}</div>
              {task.status && (
                <div className="text-xs text-white/80 mt-1">Status: {task.status}</div>
              )}
              {task.comment && (
                <div className="text-xs text-white/80 mt-1 line-clamp-2">{task.comment}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`mindmap-node ${getGradient()} relative p-6 min-w-64 max-w-80 rounded-2xl border-2 border-white/20 shadow-xl group flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-white/40 animate-fadeIn`}
      onMouseEnter={() => {
        data.nodeType === 'task' && setShowDesc(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        data.nodeType === 'task' && setShowDesc(false);
        setShowActions(false);
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-white border-3 border-blue-500 shadow-lg"
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-3 w-full">
        <div className="flex items-center space-x-2 text-white flex-1">
          {getIcon()}
          {isEditingTitle ? (
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="bg-white/20 text-white placeholder-white/70 rounded px-2 py-1 text-sm flex-1 border border-white/30 focus:outline-none focus:border-white/50"
                placeholder="Enter title..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                disabled={isSaving}
                className="p-1 text-white hover:bg-white/20 rounded transition-colors"
                title="Save"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={handleTitleCancel}
                className="p-1 text-white hover:bg-white/20 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <h4 
              className="font-semibold text-lg cursor-pointer hover:text-blue-100 transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {data.label}
            </h4>
          )}
        </div>
        {/* Action buttons - shown on hover */}
        <div className={`transition-opacity duration-200 flex space-x-1 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6 text-white hover:bg-white/20"
            onClick={handleEdit}
            title="Edit"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"  
            className="p-1 h-6 w-6 text-white hover:bg-white/20"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {/* Content */}
      <div className="text-white w-full">
        {data.nodeType === 'task' && (
          <>
            {/* Description tooltip/modal on hover */}
            {showDesc && data?.description && (
              <div className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-full bg-gray-900 bg-opacity-95 text-white text-sm rounded-lg px-4 py-3 shadow-2xl max-w-xs whitespace-pre-line border border-gray-700">
                {data.description}
              </div>
            )}
            {/* Status dropdown */}
            <div className="flex items-center gap-2 mt-3 mb-3">
              <label className="text-xs font-medium">Status:</label>
              <select
                className="text-black rounded px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-blue-500"
                value={status}
                onChange={handleStatusChange}
                disabled={isSaving}
                aria-label="Status"
                title="Status"
              >
                <option value="Not Completed">🔄 Not Completed</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
            {/* Comment section */}
            <div className="mt-3">
              {isEditingComment ? (
                <div className="space-y-2">
                  <textarea
                    className="text-black rounded px-2 py-1 text-xs w-full border border-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    disabled={isSaving}
                    placeholder="Enter your comment..."
                    title="Comment input"
                    rows={2}
                  />
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      onClick={handleCommentSave} 
                      disabled={isSaving}
                      className="text-xs px-2 py-1"
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setIsEditingComment(false)} 
                      disabled={isSaving}
                      className="text-xs px-2 py-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs bg-white/10 rounded px-2 py-1 min-h-[20px]">
                    {comment || 'No comment'}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditingComment(true)} 
                    disabled={isSaving}
                    className="text-xs px-2 py-1 bg-white/20 hover:bg-white/30"
                  >
                    {comment ? 'Edit Comment' : 'Add Comment'}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
        {/* Existing content for other node types */}
        {data.nodeType !== 'task' && (
          <>
            {data.nodeType === 'project' && (
              <div className="text-sm">
                <div className="font-medium">Project: {data.label}</div>
                {data?.description && <div className="text-xs mt-1">{data.description}</div>}
              </div>
            )}
            {data.nodeType === 'status' && data.status && (
              <div className="text-sm">
                <span className="font-medium">Status:</span> {data.status}
              </div>
            )}
            {data.nodeType === 'comment' && data.comment && (
              <div className="text-sm leading-relaxed">
                {data.comment.length > 100 
                  ? `${data.comment.substring(0, 100)}...` 
                  : data.comment
                }
              </div>
            )}
            {renderTasks()}
          </>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-white border-3 border-blue-500 shadow-lg"
      />
      <button
        className="absolute left-1/2 transform -translate-x-1/2 translate-y-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg font-bold border-3 border-white transition-all duration-200 hover:scale-110 hover:shadow-xl"
        style={{ bottom: -32 }}
        title="Add child node"
        onClick={handleAdd}
      >
        <span className="text-xl leading-none font-bold">+</span>
      </button>
    </div>
  );
}