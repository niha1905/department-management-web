import axios from 'axios';
export const API_URL = 'http://localhost:5000';

// ====================== NOTES API ======================
export const fetchNotes = async (filters = {}) => {
  try {
    let queryParams = [];
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '' && value !== 'all') {
        if (key === 'deadline_start' || key === 'deadline_end') {
          queryParams.push(`filter_${key}=${encodeURIComponent(value)}`);
        } else {
          queryParams.push(`${key}=${encodeURIComponent(value)}`);
        }
      }
    });
    const userEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
    if (userEmail) queryParams.push(`user_email=${encodeURIComponent(userEmail)}`);
    if (userRole) queryParams.push(`user_role=${userRole}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const response = await fetch(`${API_URL}/api/notes${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    const data = await response.json();
    return data.notes || data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
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
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    const userEmail = sessionStorage.getItem('email');
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
    if (!response.ok) throw new Error('Failed to create note');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const updateNote = async (id, updateData) => {
  try {
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    const userEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
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



export const fetchTags = async () => {
  try {
    const response = await fetch(`${API_URL}/api/tags`);
    if (!response.ok) {
      const errorText = await response.text();
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



export const canEditNote = (note) => {
  const userEmail = sessionStorage.getItem('email');
  const userRole = sessionStorage.getItem('role');
  return userRole === 'admin' || (note && note.created_by === userEmail);
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
  if (data && data.user) {
    sessionStorage.setItem('role', data.user.role);
    sessionStorage.setItem('email', data.user.email);
    sessionStorage.setItem('name', data.user.name || '');
  }
  return data;
}

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
    const userName = sessionStorage.getItem('name') || 'Unknown User';
    const userEmail = sessionStorage.getItem('email');
    const userRole = sessionStorage.getItem('role');
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

// ====================== MAIL & MEETING API ======================

// Fetch recent mails
export async function fetchMails() {
  const res = await fetch(`${API_URL}/api/mails`);
  if (!res.ok) throw new Error('Failed to fetch mails');
  return res.json();
}

// Fetch mail history
export async function fetchMailHistory() {
  const res = await fetch(`${API_URL}/api/mails/history`);
  if (!res.ok) throw new Error('Failed to fetch mail history');
  return res.json();
}

// Fetch all meetings (recent or by user)
export const fetchMeetings = async () => {
  const res = await fetch(`${API_URL}/api/meetings`);
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return await res.json();
};

// Fetch meeting history
export const fetchMeetingsHistory = async () => {
  const res = await fetch(`${API_URL}/api/meetings/history`);
  if (!res.ok) throw new Error('Failed to fetch meeting history');
  return await res.json();
};

// Fetch transcripts for a meeting
export const fetchMeetingTranscripts = async (meetingId) => {
  const res = await fetch(`${API_URL}/api/meetings/${meetingId}/transcripts`);
  if (!res.ok) throw new Error('Failed to fetch meeting transcripts');
  return await res.json();
};

// ====================== CHAT APIs ======================