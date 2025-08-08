import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Filter, 
  Plus, 
  MoreVertical, 
  Check, 
  Trash2, 
  Star, 
  Loader, 
  Calendar, 
  User,
  SortAsc,
  SortDesc,
  Clock,
  Flag,
  UserCheck,
  ClipboardPenLine,
  StickyNote
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { 
  fetchNotes, 
  fetchTags, 
  toggleNoteComplete, 
  moveNoteToTrash, 
  permanentlyDeleteNote, 
  restoreNoteFromTrash, 
  createNote, 
  updateNote, 
  fetchUsers,
  fetchNoteById,
  canEditNote,
  migrateNotesTags
} from '../services/api';
import NoteCard from '../components/NoteCard';
import NoteDetailModal from '../components/NoteDetailModal';
import NoteFormModal from '../components/NoteFormModal';
import { cn, buttonVariants, inputStyles } from '../utils/styles';
import { NotesRefreshContext } from '../App';
import socketService from '../services/socket';
import { toast } from 'react-hot-toast';

export default function Home({ defaultView = 'active' }) {
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedView] = useState(defaultView);  // Use defaultView prop, don't export setter if not used
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [allTags, setAllTags] = useState(['all']);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNoteFormModal, setShowNoteFormModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  
  // New filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterCreatedStart, setFilterCreatedStart] = useState('');
  const [filterCreatedEnd, setFilterCreatedEnd] = useState('');
  const [filterDeadlineStart, setFilterDeadlineStart] = useState('');
  const [filterDeadlineEnd, setFilterDeadlineEnd] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Additional filter states
  const [filterCreatedBy, setFilterCreatedBy] = useState('');
  const [filterSource, setFilterSource] = useState('all'); // 'all', 'chat', 'mic', 'calendar', 'manual'
  const [sortField, setSortField] = useState('updated_at'); // 'updated_at', 'created_at', 'deadline'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'
  const [filterTimeframe, setFilterTimeframe] = useState('all'); // 'all', 'today', 'week', 'month'

  // Color mapping for tags
  const colorMap = {
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
  };

  // Check login status
  const isLoggedIn = () => sessionStorage.getItem('role') !== null;
  const userRole = sessionStorage.getItem('role');
  const userEmail = sessionStorage.getItem('email');
  
  // Listen for search events from Navbar
  useEffect(() => {
    const handleSearch = (event) => {
      setSearchQuery(event.detail.query);
    };
    
    document.addEventListener('note-search', handleSearch);
    return () => {
      document.removeEventListener('note-search', handleSearch);
    };
  }, []);
  
  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = notes.filter(note => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.description.toLowerCase().includes(query) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query))) ||
        (note.created_by_name && note.created_by_name.toLowerCase().includes(query))
      );
    });
    
    setFilteredNotes(filtered);
  }, [searchQuery, notes]);

  // Get the refresh trigger from context
  const refreshTrigger = useContext(NotesRefreshContext);
  
  // Listen for note-created events
  useEffect(() => {
    // Connect to socket
    socketService.connect();
    // Handler for note_created event
    const handleNoteCreated = (data) => {
      if (!data || !data.note) return;
      const newNote = data.note;
      // Only update if the note's status matches the current view
      const isViewMatching = (
        (selectedView === 'active' && !newNote.completed && !newNote.in_trash) ||
        (selectedView === 'completed' && newNote.completed && !newNote.in_trash) ||
        (selectedView === 'trash' && newNote.in_trash)
      );
      if (isViewMatching) {
        setNotes(prevNotes => [newNote, ...prevNotes]);
        setFilteredNotes(prevFiltered => [newNote, ...prevFiltered]);
        toast.success('1 note added!');
      }
    };
    socketService.on('note_created', handleNoteCreated);
    return () => {
      socketService.off('note_created');
    };
  }, [selectedView]);

  // Fetch notes and tags from API - update dependency to include refreshTrigger
  useEffect(() => {
    if (!isLoggedIn()) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch tags first to identify any connection issues early
        console.log("Fetching tags...");
        const tags = await fetchTags();
        setAllTags(['all', ...tags]);
        
        console.log("Fetching notes...");
        console.log(`Current view: ${selectedView}`);
        const fetchedNotes = await fetchNotes(selectedTag, selectedView);
        setNotes(fetchedNotes);
        setFilteredNotes(fetchedNotes);
        
        console.log("Fetching users...");
        const users = await fetchUsers();
        setAllUsers(users.users || []);
        
        setError(null);
      } catch (err) {
        console.error("Error in loadData:", err);
        setError(`Failed to load data: ${err.message}. Please check if the backend server is running.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedTag, selectedView, refreshTrigger]); // Add refreshTrigger as dependency

  // Function to toggle dropdown
  const toggleDropdown = (id) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // Handle dropdown actions
  const handleAction = async (action, noteId, e) => {
    e?.stopPropagation();
    setOpenDropdownId(null);
    try {
      switch(action) {
        case 'complete':
          await toggleNoteComplete(noteId);
          setNotes(notes.map(note => note._id === noteId ? { ...note, completed: !note.completed } : note));
          
          // Update selectedNote if this is the currently viewed note
          if (selectedNote && selectedNote._id === noteId) {
            setSelectedNote({...selectedNote, completed: !selectedNote.completed});
          }
          break;
        case 'delete':
          await moveNoteToTrash(noteId);
          if (selectedView !== 'trash') {
            setNotes(notes.filter(note => note._id !== noteId));
          } else {
            setNotes(notes.map(note => note._id === noteId ? { ...note, in_trash: true } : note));
          }
          if (showDetailModal && selectedNote?._id === noteId) {
            setShowDetailModal(false);
          }
          break;
        case 'restore':
          await restoreNoteFromTrash(noteId);
          if (selectedView === 'trash') {
            setNotes(notes.filter(note => note._id !== noteId));
          } else {
            setNotes(notes.map(note => note._id === noteId ? { ...note, in_trash: false } : note));
          }
          break;
        case 'permanent-delete':
          await permanentlyDeleteNote(noteId);
          setNotes(notes.filter(note => note._id !== noteId));
          if (showDetailModal && selectedNote?._id === noteId) {
            setShowDetailModal(false);
          }
          break;

        default:
          break;
      }
    } catch (err) {
      setError(`Failed to ${action} note. Please try again later.`);
      console.error(err);
    }
  };

  // Format deadline for display
  const formatDeadline = (deadline) => {
    if (!deadline) return '';
    const date = new Date(deadline);
    const now = new Date();
    
    // If it's today
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's within 7 days
    const diffTime = Math.abs(date - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' }) + 
        `, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for display in note card
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle creating or updating a note
  const handleSaveNote = async (noteData) => {
    if (!noteData.title || !noteData.description) {
      setError("Title and description are required.");
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (noteData._id) {
        // Update existing note
        const updatedNote = await updateNote(noteData._id, noteData);
        setNotes(notes.map(note => note._id === updatedNote._id ? updatedNote : note));
        
        // If this note was selected in the detail view, update it there too
        if (selectedNote && selectedNote._id === updatedNote._id) {
          setSelectedNote(updatedNote);
        }
      } else {
        // Create new note
        const createdNote = await createNote(noteData);
        setNotes([createdNote, ...notes]);
      }
      
      setShowNoteFormModal(false);
      setNoteToEdit(null);
      setError(null);
    } catch (err) {
      // Handle duplicate note error specifically
      if (err.message && err.message.includes('Duplicate')) {
        setError(`⚠️ ${err.message}. Please check if you've already created a similar note.`);
      } else {
        setError(err.message || (noteData._id ? "Failed to update note." : "Failed to create note."));
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing a note
  const startEditNote = (note, e) => {
    e?.stopPropagation();
    setOpenDropdownId(null);
    
    // Check if user has edit permission
    if (!canEditNote(note)) {
      setError("You don't have permission to edit this note");
      return;
    }
    
    setNoteToEdit(note);
    setShowNoteFormModal(true);
    if (showDetailModal) setShowDetailModal(false);
  };

  // Update note color
  const updateNoteColor = async (noteId, color, e) => {
    e?.stopPropagation();
    try {
      await updateNote(noteId, { color });
      setNotes(notes.map(note => 
        note._id === noteId ? { ...note, color } : note
      ));
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote({ ...selectedNote, color });
      }
    } catch (err) {
      setError("Failed to update note color.");
      console.error(err);
    }
  };

  // Toggle new note form
  const toggleNewNoteForm = () => {
    setIsCreating(!isCreating);
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      tags: [],
      color: 'blue',
      deadline: '',
      type: 'daily task'
    });
  };

  // Open create note modal
  const openCreateNoteModal = () => {
    setNoteToEdit(null);
    setShowNoteFormModal(true);
  };

  // Open note detail modal
  const openNoteDetail = (note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
  };

  // Add a refreshNoteDetail function to fetch the latest note data
  const refreshNoteDetail = async () => {
    if (selectedNote) {
      try {
        const refreshedNote = await fetchNoteById(selectedNote._id);
        setSelectedNote(refreshedNote);
        // Also update the note in the notes array
        setNotes(notes.map(note => 
          note._id === refreshedNote._id ? refreshedNote : note
        ));
      } catch (err) {
        console.error("Failed to refresh note details:", err);
      }
    }
  };

  // Apply filters to notes
  const applyFilters = () => {
    setIsLoading(true);
    
    // Here you would call the API with the filters
    // For now, we'll just simulate filtering
    fetchNotes(selectedTag, selectedView)
      .then(fetchedNotes => {
        let filtered = [...fetchedNotes];
        
        // Filter by created date
        if (filterCreatedStart) {
          filtered = filtered.filter(note => 
            new Date(note.created_at) >= new Date(filterCreatedStart)
          );
        }
        
        if (filterCreatedEnd) {
          filtered = filtered.filter(note => 
            new Date(note.created_at) <= new Date(filterCreatedEnd)
          );
        }
        
        // Filter by deadline
        if (filterDeadlineStart) {
          filtered = filtered.filter(note => 
            note.deadline && new Date(note.deadline) >= new Date(filterDeadlineStart)
          );
        }
        
        if (filterDeadlineEnd) {
          filtered = filtered.filter(note => 
            note.deadline && new Date(note.deadline) <= new Date(filterDeadlineEnd)
          );
        }

        // Filter by timeframe
        if (filterTimeframe !== 'all') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          let compareDate;

          if (filterTimeframe === 'today') {
            compareDate = today;
          } else if (filterTimeframe === 'week') {
            compareDate = new Date(today);
            compareDate.setDate(compareDate.getDate() - 7);
          } else if (filterTimeframe === 'month') {
            compareDate = new Date(today);
            compareDate.setMonth(compareDate.getMonth() - 1);
          }

          if (compareDate) {
            filtered = filtered.filter(note => 
              new Date(note.created_at) >= compareDate
            );
          }
        }

        // Filter by created by
        if (filterCreatedBy) {
          filtered = filtered.filter(note => 
            note.created_by === filterCreatedBy
          );
        }

        // Filter by source
        if (filterSource !== 'all') {
          filtered = filtered.filter(note => {
            // Determine source based on note properties
            const source = determineNoteSource(note);
            return source === filterSource;
          });
        }
        
        // Sort the filtered notes
        filtered.sort((a, b) => {
          const aValue = a[sortField] ? new Date(a[sortField]) : new Date(0);
          const bValue = b[sortField] ? new Date(b[sortField]) : new Date(0);
          
          return sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        });
        
        setNotes(filtered);
        setFilteredNotes(filtered);
        setIsLoading(false);
      })
      .catch(err => {
        setError(`Failed to apply filters: ${err.message}`);
        setIsLoading(false);
      });
  };

  // Determine note source based on note properties
  const determineNoteSource = (note) => {
    // Use the source field if available
    if (note.source) return note.source;
    
    // Fallback to checking specific source indicators
    if (note.source_text) return 'mic'; // Voice transcription
    if (note.source_transcript_id) return 'chat'; // Chat message
    if (note.meeting_id || note.calendar_event_id) return 'calendar'; // Calendar/meeting
    if (note.trigger_type === 'keyword') return 'mic'; // Keyword-triggered notes
    
    // Default to manual for notes created through the form
    return 'manual';
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCreatedStart('');
    setFilterCreatedEnd('');
    setFilterDeadlineStart('');
    setFilterDeadlineEnd('');

    setSelectedTag('all');

    setFilterCreatedBy('');
    setFilterSource('all');
    setSortField('updated_at');
    setSortDirection('desc');
    setFilterTimeframe('all');
    
    // Reload notes without filters
    fetchNotes(null, selectedView)
      .then(fetchedNotes => {
        setNotes(fetchedNotes);
      })
      .catch(err => {
        setError(`Failed to reset filters: ${err.message}`);
      });
  };

  // Migration function for testing
  const handleMigrateNotesTags = async () => {
    try {
      const result = await migrateNotesTags();
      toast.success(`Migration completed! Updated ${result.updated_notes} notes.`);
      // Refresh notes to see the changes
      const fetchedNotes = await fetchNotes(selectedTag, selectedView);
      setNotes(fetchedNotes);
      setFilteredNotes(fetchedNotes);
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // If not logged in, show welcome/role selection page
  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">
            Welcome to Grand Magnum AI Dashboard
          </h1>
          <p className="text-gray-600 mb-8 text-center text-lg">
            Access your executive tools and resources
          </p>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-center">Sign in as:</h2>
              <div className="space-y-3">
                <Link 
                  to="/signup" 
                  className={cn(
                    "block w-full py-3 px-4 rounded-lg text-center font-medium transition-all transform hover:scale-[1.02]",
                    buttonVariants.primary
                  )}
                >
                  Member
                </Link>
                <Link 
                  to="/signup" 
                  className={cn(
                    "block w-full py-3 px-4 rounded-lg text-center font-medium transition-all transform hover:scale-[1.02]",
                    buttonVariants.success
                  )}
                >
                  Admin
                </Link>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4 text-center">Already registered?</p>
              <Link 
                to="/login" 
                className={cn(
                  "block w-full py-3 px-4 rounded-lg text-center font-medium transition-all transform hover:scale-[1.02]",
                  buttonVariants.secondary
                )}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If logged in, show notes dashboard
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50/30 via-purple-50/30 to-pink-50/30 p-3">
      {/* Enhanced Filter Bar with Quick Filters */}
      <div className="bg-white bg-gradient-to-r from-white to-indigo-50/30 py-3 px-5 rounded-xl shadow-md mb-6 sticky top-0 z-30 border border-indigo-100/50 backdrop-blur-sm animate-fadeIn">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Filter size={20} className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500" />
              <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {selectedView === 'completed' ? 'Completed Notes' : 
                 selectedView === 'trash' ? 'Trash' : 'Notes'}
              </span>
              
              {/* Quick filter options */}
              <div className="flex items-center ml-6 gap-3">
                {/* Created Timeframe Filter */}
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-indigo-400" />
                  <select 
                    value={filterTimeframe}
                    onChange={(e) => {
                      setFilterTimeframe(e.target.value);
                      setTimeout(applyFilters, 100);
                    }}
                    className="text-sm border border-indigo-100 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 py-1 px-2 rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <option value="all">Any time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                </div>
                
                {/* Source Filter */}
                <div className="flex items-center gap-1.5">
                  <StickyNote size={15} className="text-gray-400" />
                  <select
                    value={filterSource}
                    onChange={(e) => {
                      setFilterSource(e.target.value);
                      setTimeout(applyFilters, 100);
                    }}
                    className="text-sm border-none focus:ring-0 py-1 px-2 rounded bg-gray-50"
                  >
                    <option value="all">All sources</option>
                    <option value="chat">Chat</option>
                    <option value="mic">Voice/Mic</option>
                    <option value="calendar">Calendar</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                
                {/* Created By Filter */}
                <div className="flex items-center gap-1.5">
                  <ClipboardPenLine size={15} className="text-gray-400" />
                  <select
                    value={filterCreatedBy}
                    onChange={(e) => {
                      setFilterCreatedBy(e.target.value);
                      setTimeout(applyFilters, 100);
                    }}
                    className="text-sm border-none focus:ring-0 py-1 px-2 rounded bg-gray-50"
                  >
                    <option value="">Any creator</option>
                    {allUsers.map(user => (
                      <option key={user._id} value={user.email}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Sort Field and Direction */}
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {sortDirection === 'asc' ? (
                      <SortAsc size={15} className="text-gray-400" />
                    ) : (
                      <SortDesc size={15} className="text-gray-400" />
                    )}
                  </div>
                  <select
                    value={sortField}
                    onChange={(e) => {
                      setSortField(e.target.value);
                      setTimeout(applyFilters, 100);
                    }}
                    className="text-sm border-none focus:ring-0 py-1 px-2 rounded bg-gray-50"
                  >
                    <option value="updated_at">Last updated</option>
                    <option value="created_at">Created date</option>
                    <option value="deadline">Deadline</option>
                  </select>
                  <button
                    onClick={() => {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      setTimeout(applyFilters, 100);
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {sortDirection === 'asc' ? (
                      <SortAsc size={15} className="text-gray-600" />
                    ) : (
                      <SortDesc size={15} className="text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Reset Filters Button */}
                <button
                  onClick={resetFilters}
                  className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset
                </button>
                
                {/* Migration Button (temporary) */}
                {userRole === 'admin' && (
                  <button
                    onClick={handleMigrateNotesTags}
                    className="ml-3 text-xs text-green-600 hover:text-green-800"
                  >
                    Migrate Tags
                  </button>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`text-sm font-medium ${showFilters ? 'text-blue-600' : 'text-gray-600'}`}
            >
              {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </button>
          </div>
          
          {/* Tag filter */}
          <div className="flex gap-2 flex-wrap">
            {allTags.map((tag, idx) => (
              <button
                key={tag + '-' + idx}
                onClick={() => {
                  setSelectedTag(tag);
                  setTimeout(applyFilters, 100);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  selectedTag === tag 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {tag === 'all' ? 'All Notes' : tag}
              </button>
            ))}
          </div>
        </div>
        
        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Created date filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From:</label>
                    <input 
                      type="date" 
                      className={inputStyles}
                      value={filterCreatedStart}
                      onChange={(e) => setFilterCreatedStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To:</label>
                    <input 
                      type="date" 
                      className={inputStyles}
                      value={filterCreatedEnd}
                      onChange={(e) => setFilterCreatedEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Deadline filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From:</label>
                    <input 
                      type="date" 
                      className={inputStyles}
                      value={filterDeadlineStart}
                      onChange={(e) => setFilterDeadlineStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To:</label>
                    <input 
                      type="date" 
                      className={inputStyles}
                      value={filterDeadlineEnd}
                      onChange={(e) => setFilterDeadlineEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* More advanced filters here if needed */}
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={resetFilters}
                className={cn(buttonVariants.secondary, "px-4 py-2 text-sm rounded-lg")}
              >
                Reset All Filters
              </button>
              <button
                onClick={applyFilters}
                className={cn(buttonVariants.primary, "px-4 py-2 text-sm rounded-lg")}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 mx-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div
            className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"
          ></div>
        </div>
      ) : (
        // Scrollable Notes Grid
        <div className="flex-1 overflow-auto">
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 pb-6">
              <AnimatePresence>
                {filteredNotes.map(note => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    colorMap={colorMap}
                    openDropdownId={openDropdownId}
                    toggleDropdown={toggleDropdown}
                    handleAction={handleAction}
                    startEditNote={startEditNote}
                    updateNoteColor={updateNoteColor}
                    formatDeadline={formatDeadline}
                    formatDate={formatDate}
                    openNoteDetail={openNoteDetail}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            // Empty state with search results feedback
            <div className="text-center py-16">
              <p className="text-gray-500 mb-6 text-lg">
                {searchQuery ? (
                  `No matches found for "${searchQuery}"`
                ) : (
                  selectedView === 'active' ? 'No active notes found.' :
                  selectedView === 'completed' ? 'No completed notes found.' :
                  'No notes in trash.'
                )}
              </p>
              {selectedView !== 'trash' && (
                <button 
                  onClick={openCreateNoteModal}
                  className={cn(
                    "px-6 py-3 rounded-lg font-medium",
                    buttonVariants.primary
                  )}
                >
                  Create a new note
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note Form Modal */}
      <NoteFormModal
        isOpen={showNoteFormModal}
        onClose={() => setShowNoteFormModal(false)}
        initialData={noteToEdit}
        onSave={handleSaveNote}
        colorMap={colorMap}
        isSubmitting={isLoading}
        allUsers={allUsers}
      />

      {/* Note Detail Modal */}
      {selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          colorMap={colorMap}
          formatDeadline={formatDeadline}
          handleAction={handleAction}
          startEditNote={startEditNote}
          refreshNoteDetail={refreshNoteDetail}
        />
      )}
    </div>
  );
}