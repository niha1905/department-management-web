import { Handle, Position } from '@xyflow/react';
import { Building, Users } from 'lucide-react';
import { NodeData } from '../types';

interface BranchNodeProps {
  data: NodeData;
}

export function BranchNode({ data }: BranchNodeProps) {
  const IconComponent = data.icon === 'building' ? Building : Users;
  
  return (
    <div className={`mindmap-node ${data.gradient} relative p-5 min-w-36 text-center rounded-2xl border-3 border-white shadow-lg`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-primary"
      />
      
      <div className="flex items-center justify-center mb-1">
        <IconComponent className="w-6 h-6 text-white mr-2" />
        <h3 className="text-xl font-semibold text-white">{data.label}</h3>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-primary"
      />
    </div>
  );
}