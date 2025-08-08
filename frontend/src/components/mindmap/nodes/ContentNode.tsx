import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import './node-styles.css';
import { 
  FolderOpen, 
  CheckSquare, 
  AlertCircle, 
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronRight
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
  const isExpanded = data.expanded !== false;

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

  const renderAssignedUsers = () => {
    if (!data.assignedTo || data.assignedTo.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {data.assignedTo.map((user, index) => (
          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            {user}
          </span>
        ))}
      </div>
    );
  };

  const getGradient = () => {
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
      className={`mindmap-node ${getGradient()} relative p-4 min-w-48 max-w-80 rounded-2xl border-2 border-white/20 shadow-lg group flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-white/40 animate-fadeIn`}
      onMouseEnter={() => data.nodeType === 'task' && setShowDesc(true)}
      onMouseLeave={() => data.nodeType === 'task' && setShowDesc(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-primary"
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-2 w-full">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-white">
            {getIcon()}
            <h4 className="font-semibold text-lg">{data.label}</h4>
            {data.hasChildren && (
              <button
                className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('toggleNode', { detail: { id } }));
                }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? 
                  <ChevronDown className="w-4 h-4 text-white" /> : 
                  <ChevronRight className="w-4 h-4 text-white" />
                }
              </button>
            )}
          </div>
          {data.assignedTo && data.assignedTo.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.assignedTo.map((user, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">
                  {user}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Action buttons - shown on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6 text-white hover:bg-white/20"
            onClick={handleEdit}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"  
            className="p-1 h-6 w-6 text-white hover:bg-white/20"
            onClick={handleDelete}
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
              <div className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-full bg-black text-white text-xs rounded px-3 py-2 shadow-lg max-w-xs whitespace-pre-line">
                {data.description}
              </div>
            )}
            {/* Status dropdown */}
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs">Status:</label>
              <select
                className="text-black rounded px-2 py-1 text-xs"
                value={status}
                onChange={handleStatusChange}
                disabled={isSaving}
                aria-label="Status"
                title="Status"
              >
                <option value="Not Completed">Not Completed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            {/* Comment section */}
            <div className="mt-2">
              {isEditingComment ? (
                <div className="flex gap-2 items-center">
                  <input
                    className="text-black rounded px-2 py-1 text-xs flex-1"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    disabled={isSaving}
                    placeholder="Enter your comment"
                    title="Comment input"
                  />
                  <Button size="sm" onClick={handleCommentSave} disabled={isSaving}>Save</Button>
                  <Button size="sm" onClick={() => setIsEditingComment(false)} disabled={isSaving}>Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-xs">{comment || 'No comment'}</span>
                  <Button size="sm" onClick={() => setIsEditingComment(true)} disabled={isSaving}>Comment</Button>
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
        className="w-3 h-3 bg-white border-2 border-primary"
      />
      <button
        className="add-node-button bg-yellow-400 hover:bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow font-bold border-2 border-white transition-all duration-150"
        title="Add child node"
        onClick={handleAdd}
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  );
}