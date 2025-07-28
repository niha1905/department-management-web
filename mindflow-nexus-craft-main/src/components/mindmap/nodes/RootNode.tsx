import { Handle, Position } from '@xyflow/react';
import { Crown } from 'lucide-react';
import { NodeData } from '../types';

interface RootNodeProps {
  data: NodeData;
}

export function RootNode({ data }: RootNodeProps) {
  return (
    <div className={`mindmap-node ${data.gradient} relative p-6 min-w-48 text-center rounded-full border-4 border-white shadow-xl`}>
      <div className="flex items-center justify-center mb-2">
        <Crown className="w-8 h-8 text-white mr-2" />
        <h2 className="text-2xl font-bold text-white">{data.label}</h2>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-white border-2 border-primary"
      />
    </div>
  );
}