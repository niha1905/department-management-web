import { Node, Edge } from '@xyflow/react';

export const initialNodes: Node<Record<string, unknown>>[] = [
  {
    id: 'root',
    type: 'root',
    position: { x: 400, y: 50 },
    data: { label: 'grandmagnum', nodeType: 'root', gradient: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' },
  },
  {
    id: 'b2b',
    type: 'branch',
    position: { x: 200, y: 250 },
    data: { label: 'b2b', nodeType: 'branch', gradient: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' },
  },
  {
    id: 'b2c',
    type: 'branch',
    position: { x: 600, y: 250 },
    data: { label: 'b2c', nodeType: 'branch', gradient: 'bg-gradient-to-r from-green-400 to-green-600 text-white' },
  },
];

export const initialEdges: Edge[] = [
  { id: 'e-root-b2b', source: 'root', target: 'b2b', type: 'straight', style: { stroke: '#000', strokeWidth: 4 } },
  { id: 'e-root-b2c', source: 'root', target: 'b2c', type: 'straight', style: { stroke: '#000', strokeWidth: 4 } },
]; 