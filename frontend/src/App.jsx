import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Signup from './pages/signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ManageUsers from './pages/ManageUsers';
import ChangePassword from './pages/ChangePassword';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Privacy from './pages/Privacy';
import HierarchicalMindmapPage from './pages/HierarchicalMindmapPage';

import Home from './pages/Home';
import NoteFormModal from './components/NoteFormModal';
import { StarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { createNote, fetchUsers } from './services/api';
import Chat from './pages/Chat';
import TranscriptionSession from './pages/TranscriptionSession';
import AllTasks from './pages/AllTasks';
import RoutineTasks from './pages/RoutineTasks';
import Projects from './pages/Projects';
import { TranscriptionProvider, useTranscription } from './context/TranscriptionContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import UniversalNotesModal from './components/UniversalNotesModal';
import TranscriptionPreviewModal from './components/TranscriptionPreviewModal';
import RealEstate from './pages/RealEstate';
import { Toaster } from 'react-hot-toast';

// Create CompletedNotes component with the same core as Home but filtered
const CompletedNotes = () => {
  return <Home defaultView="completed" />;
};

// Create TrashNotes component with the same core as Home but filtered
const TrashNotes = () => {
  return <Home defaultView="trash" />;
};

// Favorites component
const Favorites = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <div className="flex items-center space-x-3 mb-6">
      <StarIcon className="w-8 h-8 text-yellow-500" />
      <h1 className="text-2xl font-bold text-gray-800">Favorites</h1>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <p className="text-gray-600 text-center">Your favorite items will appear here</p>
    </div>
  </div>
);

// Archived component
const Archived = () => (
  <div className="p-6 max-w-7xl mx-auto">
    <div className="flex items-center space-x-3 mb-6">
      <ArchiveBoxIcon className="w-8 h-8 text-blue-500" />
      <h1 className="text-2xl font-bold text-gray-800">Archived</h1>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <p className="text-gray-600 text-center">Your archived items will appear here</p>
    </div>
  </div>
);

const isLoggedIn = () => sessionStorage.getItem('role') !== null;
const isAdmin = () => sessionStorage.getItem('role') === 'admin';

const ProtectedRoute = () => {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/signup" replace />;
};

const AdminRoute = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const NotesRefreshContext = React.createContext(0);

// Main layout with sidebar, navbar, routes, context for notes refresh
function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
  const [showNoteFormModal, setShowNoteFormModal] = useState(false);
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  
  // Import notes context functions  
  const { 
    showNotesModal, 
    extractedNotes, 
    isExtractingNotes, 
    sourceData,
    saveExtractedNotes, 
    cancelNotesExtraction, 
    updateExtractedNote 
  } = useNotes();



  // Fetch users for note form
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsers();
        setAllUsers(response.users || []);
      } catch (error) {
        // Only log error if not a network error (to avoid noisy logs if backend is down)
        if (error && error.message && !error.message.includes('Failed to fetch')) {
          console.error("Failed to fetch users for note form:", error);
        }
      }
    };
    loadUsers();
  }, []);

  // Set up event listener for opening note form
  useEffect(() => {
    const handleOpenNoteForm = () => {
      setShowNoteFormModal(true);
    };

    document.addEventListener('open-note-form', handleOpenNoteForm);
    return () => {
      document.removeEventListener('open-note-form', handleOpenNoteForm);
    };
  }, []);

  // Handle saving note
  const handleSaveNote = async (note) => {
    try {
      const response = await createNote(note);
      setShowNoteFormModal(false);
      setNotesRefreshTrigger(prev => prev + 1);

      const noteCreatedEvent = new CustomEvent('note-created', {
        detail: { note: response.note }
      });
      document.dispatchEvent(noteCreatedEvent);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  // Handle saving extracted notes from navbar
  const handleSaveExtractedNotes = async () => {
    try {
      const result = await saveExtractedNotes();
      if (result.success) {
        setNotesRefreshTrigger(prev => prev + 1);
        // Optionally show success message
        console.log(`Successfully created ${result.count} note(s)`);
      }
    } catch (error) {
      console.error("Failed to save extracted notes:", error);
    }
  };

  const handleEditExtractedNote = (index, note) => {
    // For now, just log. You could implement a note editing modal
    console.log('Edit extracted note:', index, note);
  };

  // Renders sidebar, navbar, main content, and modal for creating notes
  return (
    <div className="h-screen flex overflow-hidden bg-transparent">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto">
          <NotesRefreshContext.Provider value={notesRefreshTrigger}>
            <div className="p-4 md:p-6 animate-fadeIn">
              <Outlet />
            </div>
          </NotesRefreshContext.Provider>
          <NoteFormModal
            isOpen={showNoteFormModal}
            onClose={() => setShowNoteFormModal(false)}
            onSave={handleSaveNote}
            colorMap={{
              'blue': 'bg-blue-100 text-blue-800',
              'green': 'bg-green-100 text-green-800',
              'purple': 'bg-purple-100 text-purple-800',
              'amber': 'bg-amber-100 text-amber-800',
              'red': 'bg-red-100 text-red-800',
              'teal': 'bg-teal-100 text-teal-800',
              'indigo': 'bg-indigo-100 text-indigo-800',
              'cyan': 'bg-cyan-100 text-cyan-800',
              'pink': 'bg-pink-100 text-pink-800',
              'lime': 'bg-lime-100 text-lime-800'
            }}
            allUsers={allUsers}
            isSubmitting={false}
          />
          <UniversalNotesModal
            isOpen={showNotesModal}
            notes={extractedNotes}
            isLoading={isExtractingNotes}
            onSave={handleSaveExtractedNotes}
            onCancel={cancelNotesExtraction}
            onEditNote={handleEditExtractedNote}
            sourceData={sourceData}
          />
        </main>
      </div>
      <TranscriptionDisplay />
    </div>
  );
}

// Add TranscriptionPreviewModal component to the app
const TranscriptionPreviewModalWrapper = () => {
  const { showPreviewModal, transcribedText, isProcessing, handlePreviewSave, handlePreviewClose } = useTranscription();
  
  return (
    <TranscriptionPreviewModal
      isOpen={showPreviewModal}
      onClose={handlePreviewClose}
      transcribedText={transcribedText}
      onSave={handlePreviewSave}
      isProcessing={isProcessing}
      colorMap={{
        'blue': 'bg-blue-100 text-blue-800',
        'green': 'bg-green-100 text-green-800',
        'purple': 'bg-purple-100 text-purple-800',
        'amber': 'bg-amber-100 text-amber-800',
        'red': 'bg-red-100 text-red-800',
        'teal': 'bg-teal-100 text-teal-800',
        'indigo': 'bg-indigo-100 text-indigo-800',
        'cyan': 'bg-cyan-100 text-cyan-800',
        'pink': 'bg-pink-100 text-pink-800',
        'lime': 'bg-lime-100 text-lime-800'
      }}
    />
  );
};

// Main App component: sets up React Router routes and guards
export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <TranscriptionProvider>
        <NotesProvider>
          <Router>
            <Routes>
              <Route path="/signup" element={isLoggedIn() ? <Navigate to="/" /> : <Signup />} />
              <Route path="/login" element={isLoggedIn() ? <Navigate to="/" /> : <Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/routine-tasks" element={<RoutineTasks />} />
                  <Route path="/notes" element={<Home defaultView="active" />} />
                   <Route path="/mindmap" element={<HierarchicalMindmapPage />} />
                  <Route path="/completed" element={<CompletedNotes />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/archived" element={<Archived />} />
                  <Route path="/trash" element={<TrashNotes />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/transcription-session" element={<TranscriptionSession />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                  <Route path="/realestate" element={<RealEstate />} />
                 

                  <Route path="/users" element={<ManageUsers />} />
                  <Route path="/all-tasks" element={<AllTasks />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/signup" replace />} />
            </Routes>
            <TranscriptionPreviewModalWrapper />
          </Router>
        </NotesProvider>
      </TranscriptionProvider>
    </>
  );
}
