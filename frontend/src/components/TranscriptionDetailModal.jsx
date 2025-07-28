import React, { useRef, useEffect, useState } from 'react';
import { X, MessageSquare, Calendar, ChevronDown, ChevronUp, ClipboardPenLine, Mic, Clock, Layout, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLanguageName } from '../utils/helpers';
import AddNotesButton from './AddNotesButton';  // Import the new component

const TranscriptionDetailModal = ({ 
  transcription, 
  isOpen, 
  onClose, 
  formatDate,
  colorMap = {
    blue: 'text-blue-800 bg-blue-100 border-blue-500',
  },
  handleAction
}) => {
  const modalRef = useRef(null);
  const [expandedNote, setExpandedNote] = useState(0); // First note is expanded by default
  const [activeTab, setActiveTab] = useState("notes"); // "notes" or "original"

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transcription) return null;

  const languageName = transcription.language_name || 
    getLanguageName(transcription.language) || 
    transcription.language;
    
  // Get processed notes or create a default if none
  const processedNotes = transcription.processed_notes && transcription.processed_notes.length > 0
    ? transcription.processed_notes
    : [{
        title: `Transcription (${languageName})`,
        description: transcription.original_content || ''
      }];
  
  // Default color is blue
  const color = "blue";

  // Add these handlers for note creation
  const handleAddSingleNote = (noteIndex) => {
    if (typeof handleAction === 'function') {
      handleAction("add-to-notes", transcription._id, { stopPropagation: () => {} }, noteIndex);
    }
  };

  const handleAddAllNotes = () => {
    if (typeof handleAction === 'function') {
      handleAction("add-all-notes", transcription._id, { stopPropagation: () => {} });
    }
  };

  // Check if notes have already been added
  const notesAlreadyAdded = transcription.notes_added === true;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex"
        >
          {/* Left panel - Main content */}
          <div className={`p-6 w-1/2 rounded-l-lg border-t-4 ${colorMap[color].split(' ')[2]}`}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {processedNotes[0].title || `Transcription (${languageName})`}
                </h2>
                <div className="flex gap-2 mt-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {languageName}
                  </span>
                  {transcription.in_trash && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Trash
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col space-y-4">
              {/* Description */}
              <div className="min-h-[80px] text-gray-700 whitespace-pre-wrap">
                {activeTab === "notes" 
                  ? (processedNotes[expandedNote]?.description || transcription.original_content)
                  : transcription.original_content
                }
              </div>
              
              {/* Creator info */}
              {transcription.created_by && (
                <div className="flex items-center text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded-md">
                  <ClipboardPenLine size={16} className="mr-2" />
                  <span>
                    <span className="font-medium">Created by:</span> {transcription.created_by_name || transcription.created_by}
                  </span>
                </div>
              )}

              {/* Language info */}
              <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                <Mic size={16} className="mr-2" />
                <span>Recorded in: {languageName}</span>
              </div>

              {/* Date info */}
              <div className="flex items-center text-xs text-gray-500">
                <Clock size={14} className="mr-2" />
                <span>Created on: {formatDate(transcription.created_at)}</span>
              </div>

              {/* Tags display */}
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {processedNotes[expandedNote]?.tags && 
                    processedNotes[expandedNote].tags.map((tag, idx) => (
                      <span
                        key={tag + '-' + idx}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          colorMap[color].split(' ').slice(0, 2).join(' ')
                        } bg-opacity-10`}
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                
                {/* Display deadline if available */}
                {processedNotes[expandedNote]?.deadline && (
                  <div className="flex items-center text-xs bg-gray-50 px-3 py-1.5 rounded-full ml-auto">
                    <Calendar size={12} className="mr-1.5" />
                    <span className="text-gray-600">
                      {processedNotes[expandedNote].deadline}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <AddNotesButton 
                notesCount={processedNotes.length}
                onClick={handleAddSingleNote}
                onAddAll={handleAddAllNotes}
                alreadyAdded={notesAlreadyAdded} // Pass prop to show already added status
              />
            </div>
          </div>

          {/* Right panel - AI Notes */}
          <div className="flex-1 overflow-y-auto p-6 w-1/2 border-l border-gray-200">
            {/* Toggle tabs for Notes/Original */}
            <div className="flex border-b border-gray-200 mb-4">
              <button 
                onClick={() => setActiveTab("notes")}
                className={`flex items-center py-2 px-4 ${
                  activeTab === "notes" 
                    ? "border-b-2 border-blue-600 text-blue-600 font-medium" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <MessageSquare size={18} className="mr-2" />
                AI Notes ({processedNotes.length})
              </button>
              <button 
                onClick={() => setActiveTab("original")}
                className={`flex items-center py-2 px-4 ${
                  activeTab === "original" 
                    ? "border-b-2 border-blue-600 text-blue-600 font-medium" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Mic size={18} className="mr-2" />
                Original Transcript
              </button>
            </div>

            {/* AI processed notes - Enhanced with card layout */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                {processedNotes.length > 1 && (
                  <div className="mb-2 px-2 py-1 bg-green-50 border border-green-100 rounded-lg flex items-center text-sm text-green-700">
                    <Layout size={16} className="mr-2" />
                    <span><span className="font-medium">{processedNotes.length}</span> tasks extracted from this transcription</span>
                  </div>
                )}
                
                {processedNotes.map((note, index) => (
                  <div 
                    key={index}
                    className={`border ${
                      expandedNote === index 
                        ? "border-blue-300" 
                        : "border-gray-200"
                    } rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200`}
                  >
                    <button
                      onClick={() => setExpandedNote(index)}
                      className={`flex justify-between items-center w-full p-4 ${
                        expandedNote === index 
                          ? "bg-blue-50" 
                          : "bg-white hover:bg-gray-50"
                      } text-left`}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800 line-clamp-1 flex-1">{note.title || `Task ${index + 1}`}</span>
                        {note.priority && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                            Priority
                          </span>
                        )}
                        {note.deadline && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                            <Calendar size={10} className="mr-1" />
                            Due
                          </span>
                        )}
                      </div>
                      {expandedNote === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    
                    {expandedNote === index && (
                      <div className="p-4 border-t border-gray-200 bg-white">
                        <p className="text-gray-700 whitespace-pre-wrap mb-3">{note.description}</p>
                        
                        {/* Deadline info */}
                        {note.deadline && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Calendar size={14} className="mr-2" />
                            <span>Deadline: {note.deadline}</span>
                          </div>
                        )}
                        
                        {/* Assignment info */}
                        {note.assigned_to && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <User size={14} className="mr-2" />
                            <span>Assigned to: {note.assigned_to}</span>
                          </div>
                        )}
                        
                        {/* Priority info */}
                        {note.priority && (
                          <div className="mb-2 text-sm text-gray-600">
                            <span>Priority: </span>
                            <span className="font-medium">{typeof note.priority === 'number' ? note.priority : 'High'}</span>
                          </div>
                        )}
                        
                        {/* Tags display */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {note.tags.map((tag, tagIndex) => (
                              <span 
                                key={tag + '-' + tagIndex}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  colorMap[note.color || color].split(' ').slice(0, 2).join(' ')
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Replace the existing "Add to Notes" button with this */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSingleNote(index);
                            }}
                            className="flex items-center text-sm px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Plus size={14} className="mr-1.5" />
                            Add to Notes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Original transcript */}
            {activeTab === "original" && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Original Transcription</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{transcription.original_content}</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TranscriptionDetailModal;
