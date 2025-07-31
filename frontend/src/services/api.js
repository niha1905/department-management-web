// ====================== MINDMAP COMMENT APIs ======================
export const fetchMindmapComments = async (noteId) => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/mindmap-comments`);
    if (!response.ok) throw new Error('Failed to fetch mindmap comments');
    const data = await response.json();
    return data.comments || [];
};

export const addMindmapComment = async (noteId, { author_name, author_email, comment_text }) => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/mindmap-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name, author_email, comment_text })
    });
    if (!response.ok) throw new Error('Failed to add comment');
    const data = await response.json();
    return data.comment;
};

// Edit a mindmap comment
export const editMindmapComment = async (noteId, commentId, comment_text) => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/mindmap-comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text })
    });
    if (!response.ok) throw new Error('Failed to edit comment');
    const data = await response.json();
    return data.comment;
};

// Delete a mindmap comment
export const deleteMindmapComment = async (noteId, commentId) => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/mindmap-comments/${commentId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return true;
};
import axios from 'axios';

export const API_URL = 'http://localhost:5000';

// ====================== NOTES API ======================
// Fetch notes with flexible arguments (object or legacy)
export const fetchNotes = async (tagOrFilters = {}, view = 'active', assignedTo = '') => {
  let params = {};

  // Support legacy: fetchNotes(tag, view, assignedTo)
  if (typeof tagOrFilters === 'string' || tagOrFilters === null) {
    if (tagOrFilters && tagOrFilters !== 'all') params.tag = tagOrFilters;
    if (view) params.view = view;
    if (assignedTo) params.filter_assigned_to = assignedTo;
  } else if (typeof tagOrFilters === 'object' && tagOrFilters !== null) {
    params = { ...tagOrFilters };
  }

  // Build query string
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `http://localhost:5000/api/notes${query ? '?' + query : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch notes: ${res.status} - ${text}`);
  }
  const data = await res.json();
  // Support both {notes:[]} and [] responses
  if (Array.isArray(data)) return data;
  if (data.notes) return data.notes;
  return data;
};

export const fetchNoteById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}`);
    if (!response.ok) throw new Error('Failed to fetch note');
    const data = await response.json();
    return data.note;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
};

export const createNote = async (noteData) => {
  try {
    // Add user name to the note data
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    const userEmail = sessionStorage.getItem('email');
    
    console.log("Creating note with user info:", { userName, userEmail });
    
    const noteWithCreatorInfo = {
      ...noteData,
      user_email: userEmail,
      user_name: userName
    };
    
    const response = await fetch(`${API_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteWithCreatorInfo),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 409 && errorData.duplicate) {
        // Handle duplicate note error
        throw new Error(errorData.message || 'Duplicate note detected');
      }
      throw new Error(errorData.error || 'Failed to create note');
    }
    
    const data = await response.json();
    console.log("API response for create note:", data);
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const updateNote = async (id, updateData) => {
  try {
    // Add user info when updating notes
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    const userEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
    
    console.log("Updating note with user info:", { userName, userEmail, userRole });
    
    // Build query parameters for permissions check
    let queryParams = [];
    if (userEmail) queryParams.push(`user_email=${encodeURIComponent(userEmail)}`);
    if (userRole) queryParams.push(`user_role=${userRole}`);
    if (userName) queryParams.push(`user_name=${encodeURIComponent(userName)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    const response = await fetch(`${API_URL}/api/notes/${id}${queryString}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updateData,
        user_email: userEmail,
        user_name: userName
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update note');
    }
    
    const data = await response.json();
    return data.note;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete note');
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const toggleNoteComplete = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}/complete`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to update note completion status');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating note completion:', error);
    throw error;
  }
};

export const toggleNotePriority = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}/prioritize`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to update note priority status');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating note priority:', error);
    throw error;
  }
};

export const fetchTags = async () => {
  try {
    console.log("Fetching tags from:", `${API_URL}/api/tags`);
    const response = await fetch(`${API_URL}/api/tags`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

export const addComment = async (noteId, commentText) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const addNoteComment = async (noteId, text, author, authorEmail, parentId = null, color = 'blue') => {
  try {
    // Log details for debugging
    console.log(`Adding comment to note ${noteId}:`, {
      text, 
      author, 
      authorEmail,
      parentId,
      color
    });
    
    const response = await fetch(`${API_URL}/api/notes/${noteId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        author, 
        author_email: authorEmail,
        parent_id: parentId,
        color
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add comment');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const deleteComment = async (noteId, commentId) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const updateComment = async (noteId, commentId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error('Failed to update comment');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const moveNoteToTrash = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to move note to trash');
    return true;
  } catch (error) {
    console.error('Error moving note to trash:', error);
    throw error;
  }
};

export const restoreNoteFromTrash = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}/restore`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to restore note from trash');
    return true;
  } catch (error) {
    console.error('Error restoring note:', error);
    throw error;
  }
};

export const permanentlyDeleteNote = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${id}/permanent-delete`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to permanently delete note');
    return true;
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    throw error;
  }
};

export const assignNote = async (noteId, userEmail) => {
  try {
    // Include user authentication information in query params 
    const currentUserEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    
    let queryParams = [];
    if (currentUserEmail) queryParams.push(`user_email=${encodeURIComponent(currentUserEmail)}`);
    if (userRole) queryParams.push(`user_role=${userRole}`);
    if (userName) queryParams.push(`user_name=${encodeURIComponent(userName)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    console.log(`Assigning note ${noteId} to ${userEmail}, current user: ${currentUserEmail}, role: ${userRole}`);
    
    const response = await fetch(`${API_URL}/api/notes/${noteId}/assign${queryString}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: userEmail }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to assign note');
    }
    
    const data = await response.json();
    return data.note;
  } catch (error) {
    console.error('Error assigning note:', error);
    throw error;
  }
};

// Keep the existing helper function but ensure it checks emails properly
export const canEditNote = (note) => {
  const userEmail = sessionStorage.getItem('email');
  const userRole = sessionStorage.getItem('role');
  
  // Make sure we're checking emails correctly
  return userRole === 'admin' || (note && note.created_by === userEmail);
};

// Helper function to check if user can assign a note
export const canAssignNote = (note) => {
  const userRole = sessionStorage.getItem('role');
  const userEmail = sessionStorage.getItem('email');
  return userRole === 'admin' || note.created_by === userEmail;
};

// ====================== AUTH APIs ======================
export async function loginUser(email, password) {
  const res = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Login failed");
  }
  const data = await res.json();
  // Set sessionStorage for role/email/name for admin/member detection
  if (data && data.user) {
    sessionStorage.setItem('role', data.user.role);
    sessionStorage.setItem('email', data.user.email);
    sessionStorage.setItem('name', data.user.name || '');
  }
  return data;
}

// UPDATED: signupUser now accepts name and phone as arguments
export async function signupUser(email, password, role, department, name = "", phone = "") {
  const res = await fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role, department, name, phone }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Signup failed");
  }
  return res.json();
}

// ================== USER MANAGEMENT APIs ==================
export async function fetchUsers() {
  const res = await fetch("http://localhost:5000/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`http://localhost:5000/users/${userId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function createUser(userData) {
  const res = await fetch("http://localhost:5000/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create user");
  }
  return res.json();
}

// ================== PASSWORD MANAGEMENT ==================
export async function updatePassword({ email, old_password, new_password }) {
  const res = await fetch("http://localhost:5000/update-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, old_password, new_password }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update password");
  }
  return res.json();
}

// Add new functions for version history and rollback
export const getNoteVersions = async (noteId) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/${noteId}/versions`);
    if (!response.ok) throw new Error('Failed to fetch note versions');
    const data = await response.json();
    return data.versions;
  } catch (error) {
    console.error('Error fetching note versions:', error);
    throw error;
  }
};

export const rollbackNote = async (noteId, versionId) => {
  try {
    // Include user info in query params
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    const userEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
    
    console.log("Rolling back note with user info:", { userName, userEmail, userRole });
    
    let queryParams = [];
    if (userEmail) queryParams.push(`user_email=${encodeURIComponent(userEmail)}`);
    if (userRole) queryParams.push(`user_role=${encodeURIComponent(userRole)}`);
    if (userName) queryParams.push(`user_name=${encodeURIComponent(userName)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    const response = await fetch(`${API_URL}/api/notes/${noteId}/rollback/${versionId}${queryString}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: userEmail,
        user_name: userName
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to rollback note');
    }
    
    const data = await response.json();
    return data.note;
  } catch (error) {
    console.error('Error rolling back note:', error);
    throw error;
  }
};

// ====================== CHAT APIs ======================
export const fetchChatRooms = async () => {
  try {
    const userEmail = sessionStorage.getItem('email');
    const response = await fetch(`${API_URL}/api/chat/rooms?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch chat rooms');
    const data = await response.json();
    return data.rooms;
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
};

export const createChatRoom = async (participants, type = 'direct') => {
  try {
    const response = await fetch(`${API_URL}/api/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        participants, 
        type,
        created_by: sessionStorage.getItem('email')
      }),
    });
    if (!response.ok) throw new Error('Failed to create chat room');
    const data = await response.json();
    return data.room;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};

export const fetchMessages = async (chatId) => {
  try {
    const response = await fetch(`${API_URL}/api/chat/rooms/${chatId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_URL}/api/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...messageData,
        timestamp: new Date().toISOString()
      }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (chatId) => {
  try {
    const userEmail = sessionStorage.getItem('email');
    const response = await fetch(`${API_URL}/api/chat/rooms/${chatId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail }),
    });
    if (!response.ok) throw new Error('Failed to mark messages as read');
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Transcription API calls
export const saveTranscription = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/transcriptions`, data);
    return response.data;
  } catch (error) {
    console.error("Error saving transcription:", error);
    throw error;
  }
};

export const getTranscriptions = async (userEmail, view = 'active') => {
  try {
    const response = await axios.get(`${API_URL}/api/transcriptions`, {
      params: { user_email: userEmail, view }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    throw error;
  }
};

export const deleteTranscription = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/transcriptions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting transcription:", error);
    throw error;
  }
};

export const permanentDeleteTranscription = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/transcriptions/${id}/permanent-delete`);
    return response.data;
  } catch (error) {
    console.error("Error permanently deleting transcription:", error);
    throw error;
  }
};

export const restoreTranscription = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/api/transcriptions/${id}/restore`);
    return response.data;
  } catch (error) {
    console.error("Error restoring transcription:", error);
    throw error;
  }
};

export const addTranscriptionToNotes = async (id) => {
  try {
    // Include user information in the request
    const userEmail = sessionStorage.getItem('email') || '';
    const userName = sessionStorage.getItem('name') || '';
    const response = await fetch(`${API_URL}/api/transcriptions/${id}/to-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_email: userEmail,
        user_name: userName
      })
    });
    if (!response.ok) {
      throw new Error('Failed to convert transcription to notes');
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding transcription to notes:", error);
    throw error;
  }
};

export async function fetchCurrentUser() {
  const res = await fetch("/api/users/me", {
    credentials: "include", // if using cookies/session
  });
  if (!res.ok) throw new Error("Failed to fetch current user");
  return res.json();
}

export const transcribeAudioWithWhisper = async (audioBlob, endpoint = '/upload_audio') => {
  console.log('Transcribing audio with Whisper...', { endpoint, blobSize: audioBlob.size });
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  try {
    console.log(`Sending request to ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Transcription error response:', errorText);
      throw new Error(`Failed to transcribe audio: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Transcription successful:', data);
    return data.transcript;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
};

export const fetchAllUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getAiResponse = async (text) => {
  try {
    const userEmail = sessionStorage.getItem('email') || '';
    const userName = sessionStorage.getItem('name') || '';
    const response = await fetch(`${API_URL}/api/notes/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user_email: userEmail, user_name: userName })
    });
    if (!response.ok) throw new Error('Failed to get AI response');
    return await response.json();
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
};

export const processAudio = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/upload_audio`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to process audio');
    return await response.json();
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
};

export const getUserAnalytics = async () => {
  try {
    const userRole = sessionStorage.getItem('role');
    if (userRole !== 'admin') {
      // Return empty analytics for non-admin users instead of throwing error
      return {
        user_stats: { total_users: 0, active_users: 0, recent_activity: 0 },
        note_stats: { total_notes: 0, completed_notes: 0, active_notes: 0 },
        role_distribution: []
      };
    }
    
    const response = await fetch(`${API_URL}/api/analytics/users`);
    if (!response.ok) throw new Error('Failed to fetch user analytics');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return {
      user_stats: { total_users: 0, active_users: 0, recent_activity: 0 },
      note_stats: { total_notes: 0, completed_notes: 0, active_notes: 0 },
      role_distribution: []
    };
  }
};

export const getTaskStats = async () => {
  try {
    const userEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
    const isAdmin = userRole === 'admin';
    
    const response = await fetch(`${API_URL}/api/tasks/stats?${
      isAdmin ? 'admin=true' : `user_email=${encodeURIComponent(userEmail)}`
    }`);
    if (!response.ok) throw new Error('Failed to fetch task stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return { 
      total_tasks: 0, 
      completed_tasks: 0, 
      pending_tasks: 0, 
      overdue_tasks: 0 
    };
  }
};

// Helper to handle Google OAuth expiration error
function handleGoogleAuthExpired(responseData) {
  if (responseData && responseData.error === 'google_auth_expired') {
    alert('Your Google authentication has expired. Please re-authenticate to continue.');
    // Optionally, redirect to a re-auth page:
    // window.location.href = '/reauth-google';
    throw new Error('Google authentication expired');
  }
}

export const analyzeTranscript = async (transcriptData) => {
  try {
    const response = await fetch(`${API_URL}/api/notes/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: transcriptData.transcript,
        user_email: sessionStorage.getItem('email'),
        user_name: sessionStorage.getItem('name') || 'Unknown User',
        meeting_title: transcriptData.meeting_title
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze transcript');
    }
    
    const data = await response.json();
    
    // Parse the AI output to extract tasks, summary, and keywords
    let analysisResult = {
      summary: '',
      tasks: [],
      keywords: []
    };
    
    try {
      if (data.notes && Array.isArray(data.notes)) {
        // Use the new notes format
        analysisResult.tasks = data.notes.map(note => note.title || note.description || '');
      } else if (data.ai_output) {
        // Fallback to old ai_output format
        const aiOutput = JSON.parse(data.ai_output);
        if (Array.isArray(aiOutput)) {
          analysisResult.tasks = aiOutput.map(task => 
            typeof task === 'string' ? task : task.title || task.description || task
          );
        }
      }
      
      // Extract summary from the message if available
      if (data.message && data.message.includes('Summary:')) {
        const summaryMatch = data.message.match(/Summary:\s*(.+)/);
        if (summaryMatch) {
          analysisResult.summary = summaryMatch[1];
        }
      }
      
      // Extract keywords (simple implementation)
      const words = transcriptData.transcript.toLowerCase().split(/\s+/);
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
      const keywords = words.filter(word => 
        word.length > 3 && !commonWords.has(word) && /^[a-zA-Z]+$/.test(word)
      );
      analysisResult.keywords = [...new Set(keywords)].slice(0, 10);
      
    } catch (parseError) {
      console.error('Error parsing AI output:', parseError);
      // Fallback: create a simple summary
      analysisResult.summary = transcriptData.transcript.substring(0, 200) + '...';
    }
    
    return analysisResult;
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    throw error;
  }
};

export const migrateNotesTags = async () => {
  try {
    const response = await fetch(`${API_URL}/api/migrate/notes-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to migrate notes tags');
    return await response.json();
  } catch (error) {
    console.error('Error migrating notes tags:', error);
    throw error;
  }
};

// Project API functions
export const createProject = async (projectData) => {
  try {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async () => {
  try {
    const userEmail = sessionStorage.getItem('email');
    const response = await fetch(`${API_URL}/api/projects?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getProject = async (projectId) => {
  try {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return await response.json();
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    if (!response.ok) throw new Error('Failed to update project');
    return await response.json();
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const userEmail = sessionStorage.getItem('email');
    const response = await fetch(`${API_URL}/api/projects/${projectId}?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return await response.json();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const getProjectNotes = async (projectId) => {
  try {
    const userEmail = sessionStorage.getItem('email');
    const response = await fetch(`${API_URL}/api/projects/${projectId}/notes?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch project notes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching project notes:', error);
    throw error;
  }
};

export const getAvailableUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/projects/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// New function to fetch people from /api/people
export const fetchPeople = async () => {
  try {
    const response = await fetch(`${API_URL}/api/people`);
    if (!response.ok) throw new Error('Failed to fetch people');
    const data = await response.json();
    return data.people;
  } catch (error) {
    console.error('Error fetching people:', error);
    throw error;
  }
};