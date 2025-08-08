import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  PlusCircle, 
  Star, 
  Trash2, 
  Archive, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Info,
  UserCog,
  Calendar,
  Check,
  MessageCircle,
  Target,
  Building,
  Network
} from 'lucide-react';
import socketService from '../services/socket';
import { getUnreadChats } from '../services/chat';


export default function Sidebar({ collapsed, toggleSidebar }) {
  const location = useLocation();
  const userRole = sessionStorage.getItem('role');
  const userEmail = sessionStorage.getItem('email');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Fetch unread chat count on mount and on socket event
  useEffect(() => {
    if (!userEmail) return;
    const fetchUnread = async () => {
      try {
        const data = await getUnreadChats(userEmail);
        setUnreadChatCount(data.unread_count || 0);
      } catch (e) {
        setUnreadChatCount(0);
      }
    };
    fetchUnread();
    // Listen for chat events
    socketService.connect();
    const handleChatUpdate = () => fetchUnread();
    socketService.on('chat:new_message', handleChatUpdate);
    socketService.on('chat:read', handleChatUpdate);
    return () => {
      socketService.off('chat:new_message');
      socketService.off('chat:read');
    };
  }, [userEmail]);

  const handleNewNoteClick = (e) => {
    e.preventDefault();
    console.log("Dispatching open-note-form event");
    const event = new CustomEvent('open-note-form');
    document.dispatchEvent(event);
  };

  return (
  <aside className={`gm-dark-section shadow-[2px_0_16px_-6px_rgba(0,0,0,0.35)] border-r border-[rgba(63,255,224,0.15)] transition-all duration-300 h-screen backdrop-blur-sm animate-fadeIn ${
    collapsed ? 'w-16' : 'w-64'
  } flex flex-col fixed left-0 top-0 z-40 animate-fadeIn`}>
      <div className="flex items-center h-16 px-4 border-b border-[rgba(63,255,224,0.15)] gm-dark-section backdrop-blur-sm shadow-md">
        {!collapsed && (
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[var(--gm-aqua)] flex items-center justify-center shadow-lg shadow-[rgba(63,255,224,0.35)] transform hover:scale-110 transition-all duration-300 animate-pulse-gentle">
                  <FileText className="text-[#05343a]" size={20} />
                </div>
                <span className="font-bold text-[var(--gm-white)] text-lg drop-shadow-md animate-fadeIn">Notes App</span>
            </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white transition-all duration-300 hover:shadow-lg transform hover:scale-110 backdrop-blur-sm border border-[rgba(63,255,224,0.25)] hover:border-[rgba(63,255,224,0.45)]"
        >
          {collapsed ? <ChevronRight size={18} className="text-[var(--gm-aqua)]" /> : <ChevronLeft size={18} className="text-[var(--gm-aqua)]" />}
        </button>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--gm-aqua)] scrollbar-track-transparent">
        <div className="px-3 mb-6">
          <button 
            onClick={handleNewNoteClick}
            className="flex items-center w-full py-2.5 px-3 bg-[var(--gm-yellow)] hover:bg-[#D5E536] rounded-2xl text-[#1a1a1a] transition-all duration-300 shadow-lg transform hover:scale-105 border border-[rgba(243,254,57,0.35)] backdrop-blur-sm animate-fadeIn"
          >
            <PlusCircle size={20} className="animate-pulse text-[#1a1a1a] transform transition-all duration-300 group-hover:rotate-90" />
            {!collapsed && <span className="ml-3 font-bold">New Note</span>}
          </button>
        </div>
        
        <nav className="space-y-1 px-3">
          <SidebarItem 
            icon={<Home size={20} />} 
            label="Home" 
            to="/" 
            collapsed={collapsed} 
            active={location.pathname === '/'} 
          />
          <SidebarItem 
            icon={<Calendar size={20} />} 
            label="Routine Tasks" 
            to="/routine-tasks" 
            collapsed={collapsed} 
            active={location.pathname === '/routine-tasks'} 
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="All Notes" 
            to="/notes" 
            collapsed={collapsed} 
            active={location.pathname === '/notes'} 
          />
          <SidebarItem 
            icon={<div className="relative"><MessageCircle size={20} />{unreadChatCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold shadow">{unreadChatCount}</span>}</div>} 
            label="Chat" 
            to="/chat" 
            collapsed={collapsed} 
            active={location.pathname === '/chat'} 
          />
          <SidebarItem 
            icon={<Target size={20} />} 
            label="Projects" 
            to="/projects" 
            collapsed={collapsed} 
            active={location.pathname === '/projects'} 
          />
          <SidebarItem 
            icon={<Building size={20} />} 
            label="Real Estate" 
            to="/realestate" 
            collapsed={collapsed} 
            active={location.pathname === '/realestate'} 
          />
          <SidebarItem 
            icon={<Network size={20} />} 
            label="Mindmap" 
            to="/mindmap" 
            collapsed={collapsed} 
            active={location.pathname === '/mindmap'} 
          />
          <SidebarItem 
            icon={<Check size={20} />} 
            label="Completed" 
            to="/completed" 
            collapsed={collapsed} 
            active={location.pathname === '/completed'} 
          />
          <SidebarItem 
            icon={<Archive size={20} />} 
            label="Archived" 
            to="/archived" 
            collapsed={collapsed} 
            active={location.pathname === '/archived'} 
          />
          <SidebarItem 
            icon={<Trash2 size={20} />} 
            label="Trash" 
            to="/trash" 
            collapsed={collapsed} 
            active={location.pathname === '/trash'} 
          />
          <SidebarItem 
            icon={<Info size={20} />} 
            label="About" 
            to="/about" 
            collapsed={collapsed} 
            active={location.pathname === '/about'} 
          />

          {userRole === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <div className="px-3 text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300 uppercase tracking-wider">
                  {!collapsed && "Admin"}
                </div>
              </div>

              <SidebarItem 
                icon={<UserCog size={20} />} 
                label="Manage Users" 
                to="/manage-users" 
                collapsed={collapsed} 
                active={location.pathname.startsWith('/manage-users')}
              />
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, to, collapsed, active }) {
  return (
    <Link 
      to={to}
      className={`flex items-center py-2.5 px-3 rounded-2xl transition-all duration-300 relative group ${
        active 
          ? 'bg-white/5 text-white shadow-lg border border-[rgba(63,255,224,0.25)]' 
          : 'text-slate-300 hover:bg-white/5 hover:shadow-md hover:border hover:border-[rgba(63,255,224,0.15)]'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--gm-aqua)] rounded-r-full shadow-[0_0_12px_rgba(63,255,224,0.6)] animate-pulse"></div>
      )}
      <div className={`transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 ${
        active 
          ? 'text-[var(--gm-aqua)]' 
          : 'text-slate-400 group-hover:text-[var(--gm-aqua)]'
      }`}>{icon}</div>
      {!collapsed && (
        <span className={`ml-3 font-medium transition-all duration-300 opacity-100 group-hover:opacity-100 ${
          active ? 'text-white' : 'text-slate-300 group-hover:text-white'
        }`}>
          {label}
        </span>
      )}
    </Link>
  );
}