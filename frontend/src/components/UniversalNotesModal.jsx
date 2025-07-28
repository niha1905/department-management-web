import React from 'react';
import { StickyNote, X, Edit3, Calendar, MessageSquare, FileText, Save } from 'lucide-react';
import { createNote } from '../services/api';

const UniversalNotesModal = ({ 
  isOpen, 
  notes, 
  isLoading, 
  onSave, 
  onCancel, 
  onEditNote,
  sourceData 
}) => {
  if (!isOpen) return null;

  const getSourceIcon = () => {
    if (!sourceData) return <StickyNote className="w-5 h-5 text-blue-600" />;
    
    switch (sourceData.source) {
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'meetings_page':
        return <Calendar className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-purple-600" />;
    }
  };

  const getSourceTitle = () => {
    if (!sourceData) return 'Extracted Notes Preview';
    
    switch (sourceData.source) {
      case 'chat':
        return `Notes from Chat Message`;
      case 'meeting':
        return `Notes from Meeting: ${sourceData.metadata?.title || 'Untitled'}`;
      case 'meetings_page':
        return 'Notes from Meetings Page';
      default:
        return 'Extracted Notes Preview';
    }
  };

  const getSourceDescription = () => {
    if (!sourceData) return 'Review the AI-extracted notes below. You can edit them before saving.';
    
    switch (sourceData.source) {
      case 'chat':
        return `From ${sourceData.metadata?.senderName || 'Unknown'} at ${new Date(sourceData.metadata?.timestamp).toLocaleString()}`;
      case 'meeting':
        return `Meeting on ${sourceData.metadata?.date ? new Date(sourceData.metadata.date).toLocaleDateString() : 'Unknown date'}`;
      case 'meetings_page':
        return 'Extracted from all visible meeting content on the page';
      default:
        return 'Review the AI-extracted notes below. You can edit them before saving.';
    }
  };

  // New: Save routine tasks to DB
  const handleSave = async () => {
    if (isLoading || !notes || notes.length === 0) return;
    // Filter for routine tasks
    const routineTasks = notes.filter(note => note.type === 'routine task');
    let successCount = 0;
    let errorCount = 0;
    for (const task of routineTasks) {
      let deadline = task.deadline || null;
      if (deadline && typeof deadline === 'string' && deadline.length <= 16) {
        deadline = new Date(deadline).toISOString();
      }
      try {
        await createNote({
          title: task.title,
          description: task.description,
          color: task.color || 'blue',
          tags: task.tags || [],
          deadline,
          type: 'routine task',
        });
        successCount++;
      } catch (err) {
        errorCount++;
        // Optionally, you can show error details here
      }
    }
    if (routineTasks.length > 0) {
      if (successCount > 0) {
        window.toast ? window.toast.success(`${successCount} routine task(s) saved to database!`) : alert(`${successCount} routine task(s) saved to database!`);
      }
      if (errorCount > 0) {
        window.toast ? window.toast.error(`${errorCount} routine task(s) failed to save.`) : alert(`${errorCount} routine task(s) failed to save.`);
      }
    }
    // Call the original onSave for any additional logic
    if (onSave) onSave(notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              {getSourceIcon()}
              <span>{getSourceTitle()}</span>
            </h3>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {getSourceDescription()}
          </p>
          {sourceData?.source === 'chat' && sourceData.metadata && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Original message:</strong> "{sourceData.text.substring(0, 100)}{sourceData.text.length > 100 ? '...' : ''}"
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Extracting notes from content...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          ) : notes && notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          note.type === 'project' ? 'bg-purple-100 text-purple-700' :
                          note.type === 'discussion' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {note.type}
                        </span>
                        <span className={`w-3 h-3 rounded-full ${
                          note.color === 'red' ? 'bg-red-400' :
                          note.color === 'green' ? 'bg-green-400' :
                          note.color === 'yellow' ? 'bg-yellow-400' :
                          note.color === 'purple' ? 'bg-purple-400' :
                          'bg-blue-400'
                        }`}></span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{note.description}</p>
                      {note.deadline && (
                        <p className="text-xs text-gray-500">
                          Deadline: {new Date(note.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag, tagIndex) => (
                            <span key={tag + '-' + tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onEditNote(index, note)}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No actionable notes found in this content.</p>
              <p className="text-sm text-gray-400 mt-1">
                The AI couldn't identify any tasks, events, or actionable items.
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {sourceData && (
              <span>
                Source: {sourceData.source === 'chat' ? 'Chat Message' : 
                         sourceData.source === 'meeting' ? 'Meeting' : 
                         sourceData.source === 'meetings_page' ? 'Meetings Page' : 'Content'}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !notes || notes.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save {notes ? notes.length : 0} Note{notes && notes.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalNotesModal;