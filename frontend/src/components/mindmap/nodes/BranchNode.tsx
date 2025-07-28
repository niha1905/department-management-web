import { Handle, Position } from '@xyflow/react';
import React, { useState } from 'react';

export const BranchNode = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const handleAdd = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('addNode', { detail: { type: 'project', parentId: data.id } }));
  };
  return (
    <div
      className={`mindmap-node ${data.nodeType === 'project' ? 'node-project' : 'node-person'} text-white rounded-lg shadow px-4 py-2 font-semibold relative flex flex-col items-center group`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={data.label}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500 border-2 border-white" />
      <span className="text-base font-bold mb-1">{data.label}</span>
      {data.description && (
        <span className="text-xs text-white/80 mt-1 text-center max-w-xs">{data.description}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500 border-2 border-white" />
      <div className="flex w-full justify-between items-center mt-2 px-2">
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow font-bold border-2 border-white transition-all duration-150"
          title="Add child node"
          aria-label="Add child node"
          onClick={handleAdd}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
        {/* Delete node button removed as requested */}
      </div>
      {showTooltip && (
        <div className="absolute z-20 bottom-12 left-1/2 -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs rounded px-2 py-1 shadow-lg pointer-events-none min-w-[120px] max-w-[220px] text-center">
          <div><strong>ID:</strong> {data.id}</div>
          {data.description && <div className="mt-1">{data.description}</div>}
        </div>
      )}
    </div>
  );
};