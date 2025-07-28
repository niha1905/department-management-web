import { Node, Edge } from '@xyflow/react';

export const initialNodes: Node[] = [
  {
    id: 'root',
    type: 'root',
    position: { x: 400, y: 50 },
    data: {
      label: 'GrandMagnum',
      gradient: 'gradient-indigo-blue',
      icon: 'crown'
    },
  },
  {
    id: 'b2b',
    type: 'branch',
    position: { x: 200, y: 200 },
    data: {
      label: 'B2B',
      gradient: 'gradient-green-blue',
      icon: 'building'
    },
  },
  {
    id: 'b2c',
    type: 'branch',
    position: { x: 600, y: 200 },
    data: {
      label: 'B2C',
      gradient: 'gradient-pink-purple',
      icon: 'users'
    },
  },
  {
    id: 'add-b2b',
    type: 'addButton',
    position: { x: 200, y: 320 },
    data: {
      parentId: 'b2b',
      label: 'Add Node'
    },
  },
  {
    id: 'add-b2c',
    type: 'addButton',
    position: { x: 600, y: 320 },
    data: {
      parentId: 'b2c',
      label: 'Add Node'
    },
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'e-root-b2b',
    source: 'root',
    target: 'b2b',
    type: 'smoothstep',
    className: 'mindmap-edge',
  },
  {
    id: 'e-root-b2c',
    source: 'root',
    target: 'b2c',
    type: 'smoothstep',
    className: 'mindmap-edge',
  },
];