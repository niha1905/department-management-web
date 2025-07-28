import React, { useState } from 'react';
// Importing icons from Heroicons for UI actions (add, edit, delete, favorite)
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';

// Notes component displays a list of notes and allows basic actions
const Notes = () => {
  // useState hook to manage the notes array (local state for demo)
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'Welcome to Notes',
      content: 'This is your personal space for quick notes and thoughts.',
      date: '2024-03-20',
      isFavorite: false
    },
    {
      id: 2,
      title: 'Meeting Notes',
      content: 'Discuss project timeline and deliverables for Q2.',
      date: '2024-03-19',
      isFavorite: true
    }
  ]);

  // Render the Notes UI
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with title and New Note button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
        {/* New Note button (currently no action, just UI) */}
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Note
        </button>
      </div>

      {/* Notes grid: displays each note as a card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            {/* Note header: title and action buttons */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{note.title}</h2>
              <div className="flex space-x-2">
                {/* Favorite/star button (UI only, no logic) */}
                <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                  <StarIcon className={`w-5 h-5 ${note.isFavorite ? 'text-yellow-500' : ''}`} />
                </button>
                {/* Edit button (UI only, no logic) */}
                <button className="text-gray-400 hover:text-blue-500 transition-colors">
                  <PencilIcon className="w-5 h-5" />
                </button>
                {/* Delete button (UI only, no logic) */}
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Note content, truncated to 3 lines */}
            <p className="text-gray-600 mb-4 line-clamp-3">{note.content}</p>
            {/* Note date */}
            <div className="text-sm text-gray-400">{note.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
// This component is a simple, static notes UI. In a real app, notes would be fetched from the backend and actions would update state and backend.

export default Notes;