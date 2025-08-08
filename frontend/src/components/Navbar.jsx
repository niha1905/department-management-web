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
    <nav className="gm-dark-section border-b border-[rgba(63,255,224,0.15)] shadow-lg text-white h-16 flex items-center sticky top-0 z-40 backdrop-blur-sm animate-fadeIn">
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        {/* Left: Sidebar toggle */}
        <div className="flex items-center h-full">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-white/10 hover:shadow-md mr-3 lg:hidden transition-all duration-300 transform hover:scale-105 hover:rotate-12 border border-[rgba(63,255,224,0.25)] hover:border-[rgba(63,255,224,0.4)]"
          >
            <Menu size={20} className="text-[var(--gm-aqua)]" />
          </button>
        </div>
        {/* Right: Search, Routine Tasks, bell, profile */}
        <div className="flex-1 flex items-center justify-end h-full space-x-4">
          {/* Make Notes Button */}
          <div className="relative">
            <button
              onClick={handleMakeNotes}
              disabled={isExtractingNotes}
              className={`p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-[rgba(63,255,224,0.25)] hover:border-[rgba(63,255,224,0.45)] ${
                isExtractingNotes 
                  ? 'bg-[linear-gradient(135deg,#D97706,#EA580C)] shadow-lg shadow-orange-500/30' 
                  : 'bg-[var(--gm-aqua)] hover:bg-[#5FFFF3] shadow-lg shadow-[rgba(63,255,224,0.35)]'
              }`}
              title={isExtractingNotes ? "Extracting Notes..." : "Extract Notes from Current Page"}
            >
              {isExtractingNotes ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <StickyNote size={20} className="text-[#05343a] drop-shadow-md animate-fadeIn" />
              )}
            </button>
            {isExtractingNotes && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-ping shadow-md shadow-orange-500/50"></div>
            )}
          </div>

          {/* Microphone Button */}
          <div className="relative">
            <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-[rgba(63,255,224,0.25)] hover:border-[rgba(63,255,224,0.45)] ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30 animate-pulse' 
                  : 'bg-[var(--gm-aqua)] hover:bg-[#5FFFF3] shadow-lg shadow-[rgba(63,255,224,0.35)]'
              }`}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? (
                <MicOff size={20} className="text-white drop-shadow-md animate-fadeIn" />
              ) : (
                <Mic size={20} className="text-[#05343a] drop-shadow-md animate-fadeIn" />
              )}
            </button>
            {isRecording && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping shadow-md shadow-red-500/50"></div>
            )}
          </div>
          
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="w-full py-2.5 pl-10 pr-4 rounded-full border border-[rgba(63,255,224,0.25)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-aqua)] focus:border-[var(--gm-aqua)] transition-all duration-300 bg-white/10 text-white placeholder-white/60 backdrop-blur-sm shadow-inner animate-fadeIn"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--gm-aqua)] animate-pulse-gentle" size={18} />
          </div>
          {/* Routine Tasks navigation link */}
          <Link to="/routine-tasks" className="navbar-link flex items-center px-4 py-2 rounded-full bg-[var(--gm-yellow)] hover:bg-[#D5E536] text-[#1a1a1a] font-medium transition-all duration-300 transform hover:scale-105 shadow-md border border-[rgba(243,254,57,0.35)] backdrop-blur-sm animate-fadeIn">
            Routine Tasks
          </Link>
          <button className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 relative border border-[rgba(63,255,224,0.25)] hover:border-[rgba(63,255,224,0.45)] backdrop-blur-sm animate-fadeIn" onClick={() => setShowNotificationModal(true)}>
            <Bell size={20} className="text-[var(--gm-yellow)] drop-shadow-md" />


            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></span>
          </button>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-[rgba(63,255,224,0.25)] hover:border-[rgba(63,255,224,0.45)] backdrop-blur-sm animate-fadeIn"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--gm-aqua)] flex items-center justify-center shadow-md shadow-[rgba(63,255,224,0.35)] animate-pulse-gentle">
                <span className="text-sm font-bold text-white uppercase">
                  {initials}
                </span>
              </div>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 gm-dark-section rounded-2xl shadow-xl border border-[rgba(63,255,224,0.25)] z-50 overflow-hidden backdrop-blur-lg animate-fadeIn">
                <div className="p-4 border-b border-[rgba(63,255,224,0.15)]">
                  <p className="text-sm font-medium text-white">{name}</p>
                </div>
                <button
                  className="block w-full text-left px-4 py-3 text-[var(--gm-aqua)] hover:bg-white/10 transition-all duration-300 font-medium"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  Settings
                </button>
                <button
                  className="block w-full text-left px-4 py-3 text-red-300 hover:bg-red-500/20 transition-all duration-300 font-medium"
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