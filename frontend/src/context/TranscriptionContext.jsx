import React, { createContext, useContext, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getProjects } from '../services/api';

// Popup modal for project linking notification
function ProjectLinkPopup({ open, noteTitle, projectName, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: '18px 28px', minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: 17, color: '#2563eb' }}>Project Auto-Link</h3>
        <div style={{ margin: '12px 0', fontSize: 15, textAlign: 'center' }}>
          <strong>Note:</strong> {noteTitle}<br />
          <strong>Linked Project:</strong> {projectName}
        </div>
        <button onClick={onClose} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, padding: '7px 20px', fontWeight: 500, cursor: 'pointer', marginTop: 6 }}>OK</button>
      </div>
    </div>
  );
}

const TranscriptionContext = createContext();

export const useTranscription = () => {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error('useTranscription must be used within a TranscriptionProvider');
  }
  return context;
};

export const TranscriptionProvider = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const [projectLinkQueue, setProjectLinkQueue] = useState([]);
  const [showProjectLinkPopup, setShowProjectLinkPopup] = useState(false);
  const [currentProjectLink, setCurrentProjectLink] = useState(null);

  // Helper to show popup for each project link
  const queueProjectLinkPopup = (noteTitle, projectName) => {
    setProjectLinkQueue(prev => [...prev, { noteTitle, projectName }]);
  };

  // Effect to show popups one by one
  React.useEffect(() => {
    if (!showProjectLinkPopup && projectLinkQueue.length > 0) {
      setCurrentProjectLink(projectLinkQueue[0]);
      setShowProjectLinkPopup(true);
    }
  }, [projectLinkQueue, showProjectLinkPopup]);

  const handleCloseProjectLinkPopup = () => {
    setShowProjectLinkPopup(false);
    setProjectLinkQueue(prev => prev.slice(1));
    setCurrentProjectLink(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              // Only add if it's not a duplicate of the last final result
              if (!finalTranscriptRef.current.endsWith(transcript + ' ')) {
                finalTranscriptRef.current += transcript + ' ';
              }
            } else {
              interimTranscript = transcript;
            }
          }

          setTranscribedText(finalTranscriptRef.current + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          stopRecording();
        };

        recognitionRef.current.start();
      }

      // Initialize MediaRecorder for backup
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();

      setIsRecording(true);
      setIsTranscribing(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsTranscribing(false);
    
    console.log('Final transcribed text:', finalTranscriptRef.current);
    
    // Check for calendar keywords and process them immediately
    if (finalTranscriptRef.current.trim()) {
      const isRoutineTask = await processCalendarKeywords(finalTranscriptRef.current);
      
      // If it was a routine task, clear the transcription and don't show preview
      if (isRoutineTask) {
        clearTranscription();
        return;
      }
      
      // Otherwise show preview modal for regular notes
      setShowPreviewModal(true);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearTranscription = () => {
    setTranscribedText('');
    finalTranscriptRef.current = '';
    setShowPreviewModal(false);
  };

  const handlePreviewSave = async (notes) => {
    setIsProcessing(true);
    try {
      // Notes are already saved in the preview modal
      toast.success(`${notes.length} note(s) saved successfully!`);
      clearTranscription();
    } catch (error) {
      console.error('Error in handlePreviewSave:', error);
      toast.error('Error saving notes');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewClose = () => {
    setShowPreviewModal(false);
  };

  // Function to detect calendar/routine task keywords and create routine tasks
  const processCalendarKeywords = async (text) => {
    const calendarKeywords = [
      'add to calendar',
      'schedule',
      'routine task',
      'daily reminder',
      'every day',
      'weekly',
      'monthly',
      'recurring',
      'habit',
      'routine'
    ];

    const lowerText = text.toLowerCase();
    const hasCalendarKeyword = calendarKeywords.some(keyword => lowerText.includes(keyword));

    if (hasCalendarKeyword) {
      try {
        const user_email = sessionStorage.getItem('email') || '';
        const user_name = sessionStorage.getItem('name') || user_email?.split('@')[0] || 'User';

        // Extract task information from the text
        let taskTitle = text;
        let taskDescription = '';
        
        // Try to extract a cleaner title by removing the keyword
        calendarKeywords.forEach(keyword => {
          if (lowerText.includes(keyword)) {
            taskTitle = text.replace(new RegExp(keyword, 'gi'), '').trim();
            taskDescription = `Created from voice note: "${text}"`;
          }
        });

        // Create routine task
        const routineTask = {
          title: taskTitle || 'Voice-created routine task',
          description: taskDescription,
          tags: ['routine', 'voice-created', 'calendar'],
          color: 'blue',
          type: 'routine task',
          deadline: null, // Can be enhanced to parse dates from speech
          user_email,
          user_name
        };

        const response = await axios.post('http://192.168.1.100:5000/api/notes', routineTask);
        toast.success('Routine task added to calendar!');
        
        // Dispatch event to refresh routine tasks in dashboard
        const noteCreatedEvent = new CustomEvent('note-created', {
          detail: { note: { ...routineTask, type: 'routine task' } }
        });
        document.dispatchEvent(noteCreatedEvent);
        
        return true;
      } catch (error) {
        console.error('Failed to create routine task:', error);
        toast.error('Failed to create routine task');
        return false;
      }
    }
    return false;
  };

  // Add this function to send transcription to AI and store notes
  const sendTranscriptionToAI = async () => {
    if (!transcribedText || !transcribedText.trim()) return;
    try {
      const user_email = sessionStorage.getItem('email') || '';
      const user_name = sessionStorage.getItem('name') || user_email?.split('@')[0] || 'User';
      
      // First, check for calendar keywords and handle routine tasks
      const isRoutineTask = await processCalendarKeywords(transcribedText);
      
      // If it was a routine task, we're done
      if (isRoutineTask) {
        return { success: true, routineTask: true };
      }
      
      // Otherwise, extract notes from the transcription
      const aiResponse = await axios.post('http://192.168.1.100:5000/api/notes/ai', {
        text: transcribedText,
        user_email,
        user_name
      });
      
      // Fetch all projects for the user
      let projectMap = {};
      let allProjects = [];
      try {
        const projectsRes = await getProjects();
        const projects = projectsRes.projects || [];
        allProjects = projects;
        projects.forEach(p => {
          if (p.name) projectMap[p.name.toLowerCase()] = p._id;
        });
      } catch (err) {
        console.error('Failed to fetch projects for project association:', err);
      }
      
      // Helper: AI-based project detection
      async function aiDetectProject(text) {
        try {
          const response = await axios.post('http://192.168.1.100:5000/api/projects/detect', {
            text,
            existing_projects: allProjects.map(p => p.name)
          });
          if (response.data && response.data.detected_projects && response.data.detected_projects.length > 0) {
            // Pick the highest confidence match with an id
            const best = response.data.detected_projects.find(p => p.id && p.confidence >= 0.7);
            return best || null;
          }
        } catch (err) {
          console.error('AI project detection failed:', err);
        }
        return null;
      }
      
      // If AI extraction was successful and returned notes, save them to the database
      if (aiResponse.data && aiResponse.data.notes && aiResponse.data.notes.length > 0) {
        const notesToSave = aiResponse.data.notes;
        
        for (const note of notesToSave) {
          let matchedProjectId = null;
          let matchedProjectName = null;
          // 1. Direct tag-to-project-name match
          if (note.tags && note.tags.length > 0) {
            for (const tag of note.tags) {
              const tagLower = tag.toLowerCase();
              if (projectMap[tagLower]) {
                matchedProjectId = projectMap[tagLower];
                matchedProjectName = tag;
                queueProjectLinkPopup(note.title, tag);
                break;
              }
            }
          }
          // 2. If no direct match, use AI-based detection
          if (!matchedProjectId) {
            const aiMatch = await aiDetectProject(note.title + ' ' + note.description);
            if (aiMatch && aiMatch.id) {
              matchedProjectId = aiMatch.id;
              matchedProjectName = aiMatch.name;
              queueProjectLinkPopup(note.title, aiMatch.name);
            }
          }
          try {
            await axios.post('http://192.168.1.100:5000/api/notes', {
              title: note.title,
              description: note.description,
              tags: note.tags || [],
              color: note.color || 'blue',
              deadline: note.deadline || null,
              type: note.type || 'daily task',
              user_email,
              user_name,
              project_id: matchedProjectId || null,
            });
          } catch (noteError) {
            console.error('Failed to save note:', noteError);
          }
        }
        
        // Show success notification
        toast.success(`${notesToSave.length} note(s) created from transcription!`);
        
        return { success: true, notesCount: notesToSave.length };
      }
      
      return aiResponse.data;
    } catch (error) {
      console.error('Failed to generate notes from AI:', error);
      // Show error notification
      toast.error('Failed to create notes from transcription');
      return null;
    }
  };

  const value = {
    isRecording,
    transcribedText: finalTranscriptRef.current, // Use the final transcript
    isTranscribing,
    showPreviewModal,
    isProcessing,
    toggleRecording,
    clearTranscription,
    startRecording,
    stopRecording,
    sendTranscriptionToAI,
    handlePreviewSave,
    handlePreviewClose
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
      <ProjectLinkPopup
        open={showProjectLinkPopup && !!currentProjectLink}
        noteTitle={currentProjectLink?.noteTitle}
        projectName={currentProjectLink?.projectName}
        onClose={handleCloseProjectLinkPopup}
      />
    </TranscriptionContext.Provider>
  );
}; 