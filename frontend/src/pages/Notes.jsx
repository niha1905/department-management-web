import React, { useState, useEffect } from 'react';
import { fetchNotes } from '../services/api';
// Importing icons from Heroicons for UI actions (add, edit, delete, favorite)
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

// Notes component displays a list of notes and allows basic actions
const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const userRole = sessionStorage.getItem('role');
      const userEmail = sessionStorage.getItem('email');
      const userName = sessionStorage.getItem('name');
      let assignedProjects = [];
      if (userRole === 'member') {
        // Fetch all projects and filter to those assigned to this user
        const allProjects = await import('../services/api').then(m => m.getProjects());
        const myProjects = (allProjects.projects || []).filter(p => Array.isArray(p.assigned_users) && p.assigned_users.includes(userName));
        assignedProjects = myProjects.map(p => p._id);
        setProjects(myProjects);
      } else {
        // Admin: show all projects
        const allProjects = await import('../services/api').then(m => m.getProjects());
        setProjects(allProjects.projects || []);
      }
      // Fetch notes with custom filter
      let fetchedNotes = await fetchNotes({}, 'active');
      if (userRole === 'member') {
        // Exclude routine tasks for members
        fetchedNotes = fetchedNotes.filter(note =>
          (note.created_by === userEmail ||
            (note.project_id && assignedProjects.includes(note.project_id))) &&
          note.type !== 'routine task'
        );
      } else {
        // Admin: show only notes created by them or notes classified as projects
        fetchedNotes = fetchedNotes.filter(note =>
          note.created_by === userEmail || note.type === 'project'
        );
      }
      setNotes(fetchedNotes);
    };
    fetchData();
  }, []);

  // Render the Notes UI
  return (
    <div className="w-full">
      <PageHeader title="Notes" />
      <div className="max-w-7xl mx-auto px-4 pt-6 animate-fadeIn">
        {/* Header with title and New Note button */}
        <div className="flex justify-between items-center mb-6 p-4 bg-[var(--gm-white)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--color-border)] animate-fadeIn">
          <h2 className="text-xl font-bold text-[var(--gm-dark)]">My Notes</h2>
          {/* New Note button (currently no action, just UI) */}
          <button className="flex items-center px-4 py-2 bg-[var(--gm-yellow)] hover:bg-[#D5E536] text-[#1a1a1a] rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Note
          </button>
        </div>

      {/* Notes grid: displays each note as a card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note, index) => (
          <div 
            key={note._id || note.id} 
            className="bg-[var(--gm-white)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 border border-[var(--color-border)] animate-fadeIn" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Note header: title and action buttons */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{note.title}</h2>
              <div className="flex space-x-2">
                {/* Favorite/star button (UI only, no logic) */}
                <button className="text-gray-400 hover:text-yellow-500 transition-all duration-300 transform hover:scale-110">
                  <StarIcon className={`w-5 h-5 ${note.isFavorite ? 'text-yellow-500 animate-pulse-gentle' : ''}`} />
                </button>
                {/* Edit button (UI only, no logic) */}
                <button className="text-gray-400 hover:text-[var(--gm-aqua)] transition-all duration-300 transform hover:scale-110">
                  <PencilIcon className="w-5 h-5" />
                </button>
                {/* Delete button (UI only, no logic) */}
                <button className="text-gray-400 hover:text-red-500 transition-all duration-300 transform hover:scale-110">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Note content, truncated to 3 lines */}
            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{note.content || note.description}</p>
            {/* Note date */}
            <div className="text-sm text-[var(--gm-aqua)] font-medium">{note.date || (note.created_at ? new Date(note.created_at).toLocaleDateString() : '')}</div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};
// This component is a simple, static notes UI. In a real app, notes would be fetched from the backend and actions would update state and backend.

export default Notes;