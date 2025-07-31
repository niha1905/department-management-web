import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, User, Menu, Mic, MicOff, StickyNote } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranscription } from "../context/TranscriptionContext";
import { useNotes } from "../context/NotesContext";
import NotificationModal from './NotificationModal';

export default function Navbar({ toggleSidebar }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isRecording, toggleRecording } = useTranscription();
  const { extractNotesFromCurrentPage, isExtractingNotes } = useNotes();

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchEvent = new CustomEvent('note-search', { 
      detail: { query: searchQuery }
    });
    document.dispatchEvent(searchEvent);
  }, [searchQuery]);

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    setSearchQuery("");
  }, [location.pathname]);

  const handleLogout = () => {
    sessionStorage.clear();
    setProfileMenuOpen(false);
    navigate("/login");
  };

  const name = sessionStorage.getItem('name') || '';
  const initials = name ? name.slice(0, 2).toUpperCase() : '';

  const handleMakeNotes = async () => {
    try {
      await extractNotesFromCurrentPage();
    } catch (error) {
      console.error('Error making notes:', error);
      // You could add a toast notification here
      alert('Error extracting notes: ' + error.message);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] text-gray-800 h-16 flex items-center sticky top-0 z-40 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        {/* Left: Sidebar toggle */}
        <div className="flex items-center h-full">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-50 hover:shadow-sm mr-3 lg:hidden transition-all duration-200"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
        </div>
        {/* Right: Search, Routine Tasks, bell, profile */}
        <div className="flex-1 flex items-center justify-end h-full space-x-4">
          {/* Make Notes Button */}
          <div className="relative">
            <button
              onClick={handleMakeNotes}
              disabled={isExtractingNotes}
              className={`p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isExtractingNotes 
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30'
              }`}
              title={isExtractingNotes ? "Extracting Notes..." : "Extract Notes from Current Page"}
            >
              {isExtractingNotes ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <StickyNote size={20} className="text-white" />
              )}
            </button>
            {isExtractingNotes && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
            )}
          </div>

          {/* Microphone Button */}
          <div className="relative">
            <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30 animate-pulse' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/30'
              }`}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? (
                <MicOff size={20} className="text-white" />
              ) : (
                <Mic size={20} className="text-white" />
              )}
            </button>
            {isRecording && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
          
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
          {/* Routine Tasks navigation link */}
          <Link to="/routine-tasks" className="navbar-link flex items-center px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-700 font-medium transition-all duration-200">
            Routine Tasks
          </Link>
          <button className="p-2 rounded-full hover:bg-gray-50 hover:shadow-sm transition-all duration-200 relative" onClick={() => setShowNotificationModal(true)}>
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600 uppercase">
                  {initials}
                </span>
              </div>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{name}</p>
                </div>
                <button
                  className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  Settings
                </button>
                <button
                  className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors duration-200"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <NotificationModal isOpen={showNotificationModal} onClose={() => setShowNotificationModal(false)} filterToday={true} />
    </nav>
  );
}