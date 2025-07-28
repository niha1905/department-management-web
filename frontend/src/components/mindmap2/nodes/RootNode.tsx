import { Handle, Position } from '@xyflow/react';
import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { Button } from '../../ui/button';

export const RootNode = ({ data }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.label);
  const [showActions, setShowActions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('addNode', { detail: { type: 'project', parentId: data.id || 'root' } }));
  };

  const handleEdit = () => {
    window.dispatchEvent(new CustomEvent('editNode', { detail: { id: data.id || 'root', data } }));
  };

  const handleTitleSave = async () => {
    setIsSaving(true);
    try {
      // Update the node data
      window.dispatchEvent(new CustomEvent('updateNode', { 
        detail: { id: data.id || 'root', data: { ...data, label: editedTitle } } 
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
      className="mindmap-node gradient-indigo-blue text-white rounded-xl shadow-xl px-8 py-4 font-bold text-xl relative flex flex-col items-center node-pulse border-2 border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-white/40"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-4 h-4 bg-blue-500 border-3 border-white shadow-lg" 
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
              className="text-white font-bold text-xl drop-shadow-lg cursor-pointer hover:text-blue-100 transition-colors"
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
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-4 h-4 bg-blue-500 border-3 border-white shadow-lg" 
      />
      
      {/* Add button */}
      <button
        className="absolute left-1/2 transform -translate-x-1/2 translate-y-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg font-bold border-3 border-white transition-all duration-200 hover:scale-110 hover:shadow-xl"
        style={{ bottom: -32 }}
        title="Add child node"
        onClick={handleAdd}
      >
        <span className="text-xl leading-none font-bold">+</span>
      </button>
    </div>
  );
};