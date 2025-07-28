import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, CheckSquare, AlertCircle, MessageSquare } from 'lucide-react';
import { NodeType } from '../types';

interface AddNodeButtonProps {
  data: {
    parentId: string;
    label: string;
  };
}

export function AddNodeButton({ data }: AddNodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddNode = (type: NodeType) => {
    window.dispatchEvent(new CustomEvent('addNode', { 
      detail: { type, parentId: data.parentId } 
    }));
    setIsOpen(false);
  };

  const menuItems = [
    { type: 'project' as NodeType, label: 'Project', icon: FolderOpen },
    { type: 'tasks' as NodeType, label: 'Tasks', icon: CheckSquare },
    { type: 'status' as NodeType, label: 'Status', icon: AlertCircle },
    { type: 'comment' as NodeType, label: 'Comment', icon: MessageSquare },
  ];

  return (
    <div className="mindmap-node relative">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-white"
      />
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-16 w-16 border-dashed border-2 border-primary/40 hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center space-y-1">
              <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="center" 
          className="w-48 bg-card/95 backdrop-blur border border-border/50 shadow-xl"
          side="bottom"
          sideOffset={8}
        >
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <DropdownMenuItem
                key={item.type}
                onClick={() => handleAddNode(item.type)}
                className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}