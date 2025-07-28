import { Handle, Position } from '@xyflow/react';
import React from 'react';

export const RootNode = ({ data }) => {
  const handleAdd = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('addNode', { detail: { type: 'project', parentId: data.id || 'root' } }));
  };
  return (
    <div className="mindmap-node gradient-indigo-blue text-white rounded-lg shadow-lg px-6 py-3 font-bold text-lg relative flex flex-col items-center node-pulse">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      <button
        className="absolute left-1/2 transform -translate-x-1/2 translate-y-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow font-bold border-2 border-white transition-all duration-150"
        style={{ bottom: -24 }}
        title="Add child node"
        onClick={handleAdd}
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  );
};