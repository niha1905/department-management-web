import React from 'react';
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

export default function Sidebar({ collapsed, toggleSidebar }) {
  const location = useLocation();
  const userRole = sessionStorage.getItem('role');

  const handleNewNoteClick = (e) => {
    e.preventDefault();
    console.log("Dispatching open-note-form event");
    const event = new CustomEvent('open-note-form');
    document.dispatchEvent(event);
  };

  return (
    <aside className={`bg-white shadow-[2px_0_10px_-3px_rgba(0,0,0,0.07)] border-r border-gray-100 transition-all duration-300 h-screen ${
        collapsed ? 'w-16' : 'w-64'
    } flex flex-col fixed left-0 top-0 z-40`}>
      <div className="flex items-center h-16 px-4 border-b border-gray-100">
        {!collapsed && (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="text-blue-600" size={20} />
                </div>
                <span className="font-semibold text-gray-800">Notes App</span>
            </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-50 text-gray-500 transition-all duration-200 hover:shadow-sm"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-6">
          <button 
            onClick={handleNewNoteClick}
            className="flex items-center w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PlusCircle size={20} />
            {!collapsed && <span className="ml-3 font-medium">New Note</span>}
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
            icon={<MessageCircle size={20} />} 
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
                <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
      className={`flex items-center py-2.5 px-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
      }`}
    >
      <div className={`transition-colors duration-200 ${active ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
      {!collapsed && (
        <span className={`ml-3 font-medium transition-all duration-200 ${active ? 'text-blue-600' : ''}`}>
          {label}
        </span>
      )}
    </Link>
  );
}