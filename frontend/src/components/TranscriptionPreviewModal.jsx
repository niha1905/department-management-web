import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn, buttonVariants, inputStyles, textareaStyles, selectStyles } from '../utils/styles';
import TagInput from './TagInput';

const API_URL = 'http://192.168.1.100:5000';

const TranscriptionPreviewModal = ({
  isOpen,
  onClose,
  transcribedText,
  onSave,
  isProcessing,
  colorMap,
}) => {
  const [extractedNotes, setExtractedNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedProjects, setDetectedProjects] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('');

  const userEmail = sessionStorage.getItem('email') || '';
  const userName = sessionStorage.getItem('name') || '';

  useEffect(() => {
    if (isOpen && transcribedText) {
      loadRequiredData();
      processTranscription();
    }
  }, [isOpen, transcribedText]);

  const loadRequiredData = async () => {
    try {
      const [projectResponse, peopleResponse] = await Promise.all([
        fetch(`${API_URL}/api/projects?user_email=${userEmail}`),
        fetch(`${API_URL}/api/people`)
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProjects(projectData.projects || []);
      }

      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        setPeople(peopleData.people.map(person => person.name) || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const processTranscription = async () => {
    if (!transcribedText || !transcribedText.trim()) return;

    setIsLoading(true);
    setError(null);
    setProcessingStatus('Analyzing transcription...');

    try {
      // First, extract notes using AI
      setProcessingStatus('Extracting notes from speech...');
      const aiResponse = await fetch(`${API_URL}/api/notes/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcribedText.trim(),
          user_email: userEmail,
          user_name: userName,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to process transcription');
      }

      const aiData = await aiResponse.json();
      let notes = aiData.notes || [];

      // Detect project names in the transcription
      setProcessingStatus('Detecting project names...');
      const detectedProjects = await detectProjectNames(transcribedText);
      setDetectedProjects(detectedProjects);

      // Enhance notes with project detection
      notes = await enhanceNotesWithProjects(notes, detectedProjects);

      setExtractedNotes(notes);
      setProcessingStatus('Ready for review');
    } catch (error) {
      console.error('Error processing transcription:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const detectProjectNames = async (text) => {
    try {
      // Get project names from database
      const projectNames = projects.map(p => p.name.toLowerCase());
      
      // Use AI to detect potential project names
      const aiDetectionResponse = await fetch(`${API_URL}/api/projects/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          existing_projects: projectNames,
        }),
      });

      if (aiDetectionResponse.ok) {
        const aiData = await aiDetectionResponse.json();
        return aiData.detected_projects || [];
      }

      // Fallback: simple keyword matching
      const detected = [];
      const textLower = text.toLowerCase();
      
      projects.forEach(project => {
        if (textLower.includes(project.name.toLowerCase())) {
          detected.push({
            name: project.name,
            id: project._id,
            confidence: 0.8,
            type: 'exact_match'
          });
        }
      });

      return detected;
    } catch (error) {
      console.error('Error detecting project names:', error);
      return [];
    }
  };

  const enhanceNotesWithProjects = async (notes, detectedProjects) => {
    return notes.map(note => {
      // Check if note mentions any detected projects
      const relevantProjects = detectedProjects.filter(project => {
        const noteText = `${note.title} ${note.description}`.toLowerCase();
        return noteText.includes(project.name.toLowerCase());
      });

      if (relevantProjects.length > 0) {
        // Suggest the most confident project match
        const suggestedProject = relevantProjects.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        
        return {
          ...note,
          suggested_project_id: suggestedProject.id,
          suggested_project_name: suggestedProject.name,
          project_confidence: suggestedProject.confidence,
        };
      }

      return note;
    });
  };

  const handleNoteUpdate = (index, field, value) => {
    const updatedNotes = [...extractedNotes];
    updatedNotes[index] = { ...updatedNotes[index], [field]: value };

    // Auto-populate handlers if project is selected
    if (field === 'project_id' && value) {
      const selectedProject = projects.find(p => p._id === value);
      if (selectedProject && selectedProject.assigned_users) {
        updatedNotes[index].assigned_to = selectedProject.assigned_users;
      }
    }

    setExtractedNotes(updatedNotes);
  };

  const handleSave = async () => {
    try {
      const validNotes = extractedNotes.filter(note => note.title && note.description);
      
      if (validNotes.length === 0) {
        setError('No valid notes to save');
        return;
      }

      // Process notes in background
      const processPromises = validNotes.map(async (note) => {
        const noteData = {
          title: note.title,
          description: note.description,
          tags: note.tags || [],
          color: note.color || 'blue',
          deadline: note.deadline || null,
          type: note.type || 'daily task',
          project_id: note.project_id || null,
          assigned_to: note.assigned_to || [],
          delegated_to: note.delegated_to || [],
          source: 'transcription',
          created_by: userEmail,
          created_by_name: userName,
        };

        const response = await fetch(`${API_URL}/api/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });

        if (!response.ok) {
          throw new Error(`Failed to save note: ${note.title}`);
        }

        return response.json();
      });

      await Promise.all(processPromises);
      
      // Show success notification
      if (window.toast) {
        window.toast.success(`${validNotes.length} note(s) saved successfully!`);
      }

      onSave(validNotes);
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          <div className="flex justify-between items-center border-b border-gray-100 p-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Voice Transcription Preview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLoading ? processingStatus : `Review and edit ${extractedNotes.length} extracted note(s)`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {/* Original Transcription */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original Transcription:</h3>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 max-h-32 overflow-y-auto">
                {transcribedText}
              </div>
            </div>

            {/* Detected Projects */}
            {detectedProjects.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Detected Projects:</h3>
                <div className="flex flex-wrap gap-2">
                  {detectedProjects.map((project, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {project.name} ({Math.round(project.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" />
                <span className="text-gray-600">{processingStatus}</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Extracted Notes */}
            {extractedNotes.length > 0 && (
              <div className="space-y-4">
                {extractedNotes.map((note, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-800">Note {index + 1}</h4>
                      {note.suggested_project_name && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Suggested: {note.suggested_project_name}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={note.title || ''}
                          onChange={(e) => handleNoteUpdate(index, 'title', e.target.value)}
                          className={inputStyles}
                          placeholder="Enter title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={note.type || 'daily task'}
                          onChange={(e) => handleNoteUpdate(index, 'type', e.target.value)}
                          className={selectStyles}
                        >
                          <option value="daily task">Daily Task</option>
                          <option value="task">Task</option>
                          <option value="project">Project</option>
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          value={note.description || ''}
                          onChange={(e) => handleNoteUpdate(index, 'description', e.target.value)}
                          className={textareaStyles}
                          rows="2"
                          placeholder="Enter description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                        <select
                          value={note.project_id || note.suggested_project_id || ''}
                          onChange={(e) => handleNoteUpdate(index, 'project_id', e.target.value)}
                          className={selectStyles}
                        >
                          <option value="">No Project</option>
                          {projects.map(project => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Deadline</label>
                        <input
                          type="datetime-local"
                          value={note.deadline || ''}
                          onChange={(e) => handleNoteUpdate(index, 'deadline', e.target.value)}
                          className={inputStyles}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
                        <TagInput
                          tags={note.tags || []}
                          setTags={(newTags) => handleNoteUpdate(index, 'tags', newTags)}
                          placeholder="Type and press Enter"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex gap-1">
                          {Object.entries(colorMap).map(([colorName, colorClass]) => (
                            <button
                              key={colorName}
                              type="button"
                              onClick={() => handleNoteUpdate(index, 'color', colorName)}
                              className={`w-6 h-6 rounded-full ${colorClass.split(' ')[0]}
                                ${note.color === colorName ? 'ring-2 ring-offset-2 ring-gray-400' : ''}
                                hover:scale-110 transition-transform`}
                              title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className={cn(buttonVariants.secondary, 'px-4 py-2 rounded-lg')}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || extractedNotes.length === 0}
              className={cn(
                buttonVariants.primary,
                'px-4 py-2 rounded-lg',
                (isLoading || extractedNotes.length === 0) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Check className="h-4 w-4 mr-2" />
              Save {extractedNotes.length} Note(s)
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TranscriptionPreviewModal;