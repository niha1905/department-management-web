import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAiResponse, createNote, getProjects, API_URL } from '../services/api';
import { toast } from 'react-hot-toast';

const NotesContext = createContext();

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  const [isExtractingNotes, setIsExtractingNotes] = useState(false);
  const [extractedNotes, setExtractedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [sourceData, setSourceData] = useState(null);

  // Check for duplicate notes
  const checkForDuplicates = useCallback((notes) => {
    const userEmail = sessionStorage.getItem('email');
    const uniqueNotes = [];
    const duplicates = [];
    
    for (const note of notes) {
      // Check if this note is a duplicate of any existing note
      const isDuplicate = uniqueNotes.some(existingNote => {
        // Check title similarity
        const titleSimilarity = existingNote.title.toLowerCase() === note.title.toLowerCase();
        
        // Check description similarity (basic check)
        const descSimilarity = existingNote.description.toLowerCase() === note.description.toLowerCase();
        
        // Check if tags are similar
        const existingTags = existingNote.tags || [];
        const newTags = note.tags || [];
        const tagSimilarity = existingTags.length > 0 && newTags.length > 0 && 
          existingTags.some(tag => newTags.includes(tag));
        
        return titleSimilarity || descSimilarity || tagSimilarity;
      });
      
      if (isDuplicate) {
        duplicates.push(note);
      } else {
        uniqueNotes.push(note);
      }
    }
    
    return { uniqueNotes, duplicates };
  }, []);

  // Extract notes from text content
  const extractNotesFromText = useCallback(async (text, source = 'manual', metadata = {}) => {
    setIsExtractingNotes(true);
    setShowNotesModal(true);
    setExtractedNotes([]);
    setSourceData({ text, source, metadata });

    try {
      console.log('Extracting notes from text:', text.substring(0, 100) + '...');
      const response = await getAiResponse(text);
      console.log('AI Response:', response);

      if (response && response.notes && Array.isArray(response.notes)) {
        // Filter out duplicates from the extracted notes
        const { uniqueNotes, duplicates } = checkForDuplicates(response.notes);
        setExtractedNotes(uniqueNotes);
        
        // Store duplicate info for display
        if (duplicates.length > 0) {
          setSourceData(prev => ({ 
            ...prev, 
            duplicates: duplicates,
            duplicateCount: duplicates.length,
            totalExtracted: response.notes.length
          }));
        }
      } else {
        setExtractedNotes([]);
      }
    } catch (error) {
      console.error('Error extracting notes:', error);
      setExtractedNotes([]);
    } finally {
      setIsExtractingNotes(false);
    }
  }, [checkForDuplicates]);

  // Extract notes from chat message
  const extractNotesFromMessage = useCallback(async (message) => {
    await extractNotesFromText(
      message.content, 
      'chat', 
      { 
        messageId: message._id,
        sender: message.sender,
        senderName: message.senderName,
        timestamp: message.timestamp 
      }
    );
  }, [extractNotesFromText]);

  // Extract notes from meeting/calendar event
  const extractNotesFromMeeting = useCallback(async (meeting) => {
    let textToAnalyze = '';
    
    // Combine meeting details into text for analysis
    if (meeting.title) textToAnalyze += `Meeting: ${meeting.title}\n`;
    if (meeting.description) textToAnalyze += `Description: ${meeting.description}\n`;
    if (meeting.agenda) textToAnalyze += `Agenda: ${meeting.agenda}\n`;
    if (meeting.notes) textToAnalyze += `Notes: ${meeting.notes}\n`;
    if (meeting.transcript) textToAnalyze += `Transcript: ${meeting.transcript}\n`;

    if (!textToAnalyze.trim()) {
      textToAnalyze = 'No content available for analysis';
    }

    await extractNotesFromText(
      textToAnalyze, 
      'meeting', 
      { 
        meetingId: meeting.id || meeting._id,
        title: meeting.title,
        date: meeting.date || meeting.start_time,
        participants: meeting.participants || meeting.attendees
      }
    );
  }, [extractNotesFromText]);

  // Save all extracted notes with duplicate filtering
  const saveExtractedNotes = useCallback(async () => {
    if (!extractedNotes || extractedNotes.length === 0) return;

    try {
      setIsExtractingNotes(true);
      const userEmail = sessionStorage.getItem('email');
      const userName = sessionStorage.getItem('name');
      
      // Filter out duplicates
      const { uniqueNotes, duplicates } = checkForDuplicates(extractedNotes);
      
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
          const response = await fetch(`${API_URL}/api/projects/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              existing_projects: allProjects.map(p => p.name)
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.detected_projects && data.detected_projects.length > 0) {
              // Pick the highest confidence match with an id
              const best = data.detected_projects.find(p => p.id && p.confidence >= 0.7);
              return best || null;
            }
          }
        } catch (err) {
          console.error('AI project detection failed:', err);
        }
        return null;
      }
      
      let savedCount = 0;
      let duplicateCount = 0;
      
      for (const note of uniqueNotes) {
        let matchedProjectId = null;
        let matchedProjectName = null;
        // 1. Direct tag-to-project-name match
        if (note.tags && note.tags.length > 0) {
          for (const tag of note.tags) {
            const tagLower = tag.toLowerCase();
            if (projectMap[tagLower]) {
              matchedProjectId = projectMap[tagLower];
              matchedProjectName = tag;
              toast.success(`Note auto-linked to project: ${tag}`);
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
            toast.success(`Note auto-linked to project: ${aiMatch.name}`);
          }
        }
        // Ensure deadline is ISO string
        let deadline = note.deadline || null;
        if (deadline && typeof deadline === 'string' && deadline.length <= 16) {
          deadline = new Date(deadline).toISOString();
        }
        try {
          await createNote({
            title: note.title,
            description: note.description,
            color: note.color || 'blue',
            tags: note.tags || [],
            deadline,
            type: note.type || 'daily task',
            user_email: userEmail,
            user_name: userName,
            projectId: matchedProjectId || null,
          });
          savedCount++;
        } catch (error) {
          // If the backend returns a duplicate error, count it
          if (error.message && error.message.includes('Duplicate')) {
            duplicateCount++;
          } else {
            throw error;
          }
        }
      }

      setShowNotesModal(false);
      setExtractedNotes([]);
      setSourceData(null);
      
      return { 
        success: true, 
        savedCount, 
        duplicateCount,
        totalProcessed: extractedNotes.length 
      };
      
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    } finally {
      setIsExtractingNotes(false);
    }
  }, [extractedNotes, checkForDuplicates]);

  // Cancel notes extraction
  const cancelNotesExtraction = useCallback(() => {
    setShowNotesModal(false);
    setExtractedNotes([]);
    setSourceData(null);
    setIsExtractingNotes(false);
  }, []);

  // Update a specific note before saving
  const updateExtractedNote = useCallback((index, updatedNote) => {
    setExtractedNotes(prev => {
      const newNotes = [...prev];
      newNotes[index] = { ...newNotes[index], ...updatedNote };
      return newNotes;
    });
  }, []);



  const value = {
    // State
    isExtractingNotes,
    extractedNotes,
    showNotesModal,
    sourceData,

    // Functions
    extractNotesFromText,
    extractNotesFromMessage,
    extractNotesFromMeeting,
    saveExtractedNotes,
    cancelNotesExtraction,
    updateExtractedNote,
    checkForDuplicates,

    // Setters for external control
    setExtractedNotes,
    setShowNotesModal,
    setIsExtractingNotes
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};