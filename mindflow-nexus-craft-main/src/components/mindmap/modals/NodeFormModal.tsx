import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { NodeType, NodeData, TaskItem } from '../types';

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NodeData) => void;
  type: NodeType;
  initialData?: NodeData;
}

export function NodeFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  type, 
  initialData 
}: NodeFormModalProps) {
  const [formData, setFormData] = useState<NodeData>({
    label: '',
    tasks: [],
    status: '',
    comment: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        label: '',
        tasks: [],
        status: '',
        comment: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;
    
    onSubmit({
      ...formData,
      nodeType: type,
    });
  };

  const addTask = () => {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      text: '',
      completed: false,
    };
    setFormData(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), newTask]
    }));
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks?.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks?.filter(task => task.id !== taskId)
    }));
  };

  const getTitle = () => {
    const action = initialData ? 'Edit' : 'Add';
    return `${action} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name/Label Field */}
          <div className="space-y-2">
            <Label htmlFor="label" className="text-base font-medium">
              {type === 'project' ? 'Project Name' : 'Title'}
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder={`Enter ${type} name...`}
              className="text-base"
              required
            />
          </div>

          {/* Tasks Section */}
          {type === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Task Items</Label>
                <Button
                  type="button"
                  onClick={addTask}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {formData.tasks?.map((task) => (
                  <div key={task.id} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => 
                          updateTask(task.id, { completed: !!checked })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={task.text}
                          onChange={(e) => updateTask(task.id, { text: e.target.value })}
                          placeholder="Task description..."
                          className="text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={task.status || ''}
                            onChange={(e) => updateTask(task.id, { status: e.target.value })}
                            placeholder="Status..."
                            className="text-sm"
                          />
                          <Input
                            value={task.comment || ''}
                            onChange={(e) => updateTask(task.id, { comment: e.target.value })}
                            placeholder="Comment..."
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {(!formData.tasks || formData.tasks.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks added yet. Click "Add Task" to get started.
                </div>
              )}
            </div>
          )}

          {/* Status Field */}
          {type === 'status' && (
            <div className="space-y-2">
              <Label htmlFor="status" className="text-base font-medium">Status</Label>
              <Input
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                placeholder="Enter project status..."
                className="text-base"
              />
            </div>
          )}

          {/* Comment Field */}
          {type === 'comment' && (
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-base font-medium">Comment</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Enter your comments or notes..."
                className="text-base min-h-32 resize-y"
                rows={6}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-20">
              {initialData ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}