import { Handle, Position } from '@xyflow/react';
import { 
  FolderOpen, 
  CheckSquare, 
  AlertCircle, 
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeData, TaskItem } from '../types';

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
    if (data.gradient) return data.gradient;
    const index = parseInt(id.slice(-1)) % gradients.length;
    return gradients[index];
  };

  const handleEdit = () => {
    // This will be handled by parent component
    window.dispatchEvent(new CustomEvent('editNode', { detail: { id, data } }));
  };

  const handleDelete = () => {
    // This will be handled by parent component  
    window.dispatchEvent(new CustomEvent('deleteNode', { detail: { id } }));
  };

  const renderTasks = () => {
    if (data.nodeType !== 'tasks' || !data.tasks) return null;
    
    return (
      <div className="mt-3 space-y-2">
        {data.tasks.map((task: TaskItem) => (
          <div key={task.id} className="flex items-start space-x-2 text-sm">
            <CheckCircle 
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                task.completed ? 'text-green-200' : 'text-white/50'
              }`} 
            />
            <div className="flex-1 min-w-0">
              <div className={`${task.completed ? 'line-through text-white/70' : 'text-white'}`}>
                {task.text}
              </div>
              {task.status && (
                <div className="text-xs text-white/80 mt-1">
                  Status: {task.status}
                </div>
              )}
              {task.comment && (
                <div className="text-xs text-white/80 mt-1 line-clamp-2">
                  {task.comment}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`mindmap-node ${getGradient()} relative p-4 min-w-48 max-w-80 rounded-2xl border-2 border-white/20 shadow-lg group`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-primary"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-white">
          {getIcon()}
          <h4 className="font-semibold text-lg">{data.label}</h4>
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
      <div className="text-white">
        {data.nodeType === 'project' && (
          <div className="text-sm">
            <div className="font-medium">Project: {data.label}</div>
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
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-primary"
      />
    </div>
  );
}