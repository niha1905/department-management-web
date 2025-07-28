import { Handle, Position } from '@xyflow/react';
import React, { useState } from 'react';
import { Edit3, Trash2, MoreVertical, Save, X } from 'lucide-react';
import { Button } from '../../ui/button';

export const BranchNode = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.label);
  const [showActions, setShowActions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('addNode', { detail: { type: 'project', parentId: data.id } }));
  };

  const handleEdit = () => {
    window.dispatchEvent(new CustomEvent('editNode', { detail: { id: data.id, data } }));
  };

  const handleDelete = () => {
    window.dispatchEvent(new CustomEvent('deleteNode', { detail: { id: data.id } }));
  };

  const handleTitleSave = async () => {
    setIsSaving(true);
    try {
      // Update the node data
      window.dispatchEvent(new CustomEvent('updateNode', { 
        detail: { id: data.id, data: { ...data, label: editedTitle } } 
      }));
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
    }
    setIsSaving(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(data.label);
    setIsEditingTitle(false);
  };

  return (
    <div
      className={`mindmap-node ${data.nodeType === 'project' ? 'node-project' : 'node-person'} text-white rounded-xl shadow-xl px-6 py-4 font-semibold relative flex flex-col items-center group border-2 border-white/20 min-w-[240px] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-white/40`}
      onMouseEnter={() => {
        setShowTooltip(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setShowActions(false);
      }}
      title={data.label}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-4 h-4 bg-green-500 border-3 border-white shadow-lg" 
      />
      
      {/* Header with title and actions */}
      <div className="flex items-center justify-between mb-3 w-full">
        <div className="flex items-center space-x-2 text-white flex-1">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="bg-white/20 text-white placeholder-white/70 rounded px-2 py-1 text-sm flex-1 border border-white/30 focus:outline-none focus:border-white/50"
                placeholder="Enter title..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                disabled={isSaving}
                className="p-1 text-white hover:bg-white/20 rounded transition-colors"
                title="Save"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={handleTitleCancel}
                className="p-1 text-white hover:bg-white/20 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span 
              className="text-white font-bold text-lg drop-shadow-lg cursor-pointer hover:text-blue-100 transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {data.label}
            </span>
          )}
        </div>
        
        {/* Action buttons - shown on hover */}
        <div className={`transition-opacity duration-200 flex space-x-1 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6 text-white hover:bg-white/20"
            onClick={handleEdit}
            title="Edit"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"  
            className="p-1 h-6 w-6 text-white hover:bg-white/20"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <span className="text-white/90 text-sm mt-2 text-center max-w-xs leading-relaxed">{data.description}</span>
      )}

      {/* Status indicator for projects */}
      {data.nodeType === 'project' && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium">Status:</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {data.status || 'Active'}
          </span>
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-4 h-4 bg-green-500 border-3 border-white shadow-lg" 
      />
      
      {/* Add button */}
      <div className="flex w-full justify-center items-center mt-4 px-2">
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg font-bold border-3 border-white transition-all duration-200 hover:scale-110 hover:shadow-xl"
          title="Add child node"
          aria-label="Add child node"
          onClick={handleAdd}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Enhanced tooltip */}
      {showTooltip && (
        <div className="absolute z-20 bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 bg-opacity-95 text-white text-sm rounded-lg px-4 py-3 shadow-2xl pointer-events-none min-w-[200px] max-w-[300px] text-center border border-gray-700">
          <div className="font-semibold mb-2">{data.label}</div>
          {data.description && <div className="text-gray-300 text-xs leading-relaxed mb-2">{data.description}</div>}
          {data.nodeType === 'project' && (
            <div className="text-gray-400 text-xs mb-2">
              Status: {data.status || 'Active'}
            </div>
          )}
          {data.nodeType === 'person' && data.personId && (
            <div className="text-gray-400 text-xs mb-2">
              Person ID: {data.personId}
            </div>
          )}
          <div className="text-gray-400 text-xs">ID: {data.id}</div>
        </div>
      )}
    </div>
  );
};