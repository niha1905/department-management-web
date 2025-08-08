import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Check as CheckIcon, Target, Users, TrendingUp, X, Tag, FileText, User, Building, Edit, Trash2, Plus, Minus, Brain, Lightbulb, Zap } from 'lucide-react';
import TaskDetailModal from '../components/TaskDetailModal';
import { fetchNotes, updateNote, deleteNote, getProjects, fetchUsers, fetchPeople } from '../services/api';
import { toast } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MindMapNode } from '../components/MindMapNode';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import * as XLSX from 'xlsx';

import Calendar from '../components/calendar/Calendar';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded hover:bg-gray-100">
          <span className="text-xl">×</span>
        </button>
        {children}
      </div>
    </div>
  );
};

// Modal for calendar day events
function CalendarEventModal({ open, date, tasks, onClose }) {
  if (!open) return null;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-blue-600">
            <span className="inline-block mr-2">📅</span>
            Tasks for {formattedDate}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="my-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {tasks && tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map((task, idx) => (
                <li key={task._id || idx} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-sm">
                  <div className="font-medium text-gray-800 flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    {task.title}
                  </div>
                  {task.deadline && (
                    <div className="text-sm text-gray-500 mt-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Due: {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {task.description && (
                    <div className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-gray-100">{task.description}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-center py-8 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No tasks scheduled for this day.</p>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// Handler for calendar day click
// This should be placed inside your Dashboard component
// Example usage in render:
// <Calendar onDayClick={handleCalendarDayClick} ... />

// In your Dashboard component's render/return section, add:
// <CalendarEventModal
//   open={calendarModalOpen}
//   date={calendarModalDate}
//   tasks={calendarModalTasks}
//   onClose={() => setCalendarModalOpen(false)}
// />

// Modal for user notes in project (checkboxes)
const handleUserNoteCheckbox = async (note) => {
  await updateNote(note._id, { ...note, completed: true });
  loadNotes();
  fetchNotes({}, 'active').then(setAllNotes);
  setModalNode(prev => {
    if (!prev || !prev.userNotes) return prev;
    const updatedNotes = prev.userNotes.map(n => n._id === note._id ? { ...n, completed: true } : n);
    return { ...prev, userNotes: updatedNotes };
  });
};

const UserNotesModal = ({ modalNode, onClose }) => {
  if (!modalNode || !modalNode.userNotes) return null;
  const completedNotes = modalNode.userNotes.filter(n => n.completed);
  const activeNotes = modalNode.userNotes.filter(n => !n.completed);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] relative">
        <h2 className="text-xl font-bold mb-2">Notes for {modalNode.title} in {modalNode.project?.name}</h2>
        <button className="absolute top-2 right-4 text-gray-500" onClick={onClose}>✕</button>
        <div className="mb-4">
          {activeNotes.length === 0 ? (
            <div className="text-gray-500">No active notes.</div>
          ) : (
            activeNotes.map(note => (
              <label key={note._id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={note.completed}
                  onChange={() => handleUserNoteCheckbox(note)}
                  className="mr-2"
                />
                <span className="flex-1">{note.title}</span>
              </label>
            ))
          )}
        </div>
        {completedNotes.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <div className="text-green-600 font-semibold mb-1">Completed Notes:</div>
            {completedNotes.map(note => (
              <div key={note._id} className="line-through text-gray-400 mb-1">{note.title}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  // All hooks and state declarations must come first
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalNode, setModalNode] = useState(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalDate, setCalendarModalDate] = useState(null);
  const [calendarModalTasks, setCalendarModalTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const canvasRef = useRef(null);
  const [mindMapData, setMindMapData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({ root: true });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [expanded, setExpanded] = useState({ root: true });
  const rootRef = useRef(null);
  const childRefs = useRef([]);
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({ container: null, root: null, children: [] });
  const [mindMapView, setMindMapView] = useState('daily'); // Only 'daily' view
  // Removed projects and people state for mindmap
  const [allNotes, setAllNotes] = useState([]);
  // ...existing code...
  const userRole = sessionStorage.getItem('role');
  const userEmail = sessionStorage.getItem('email');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedNode, setFocusedNode] = useState(null);
  const autoAssignRanRef = useRef(false);
  const [tab, setTab] = useState('dashboard');
  const [realEstateMindMap, setRealEstateMindMap] = useState(null);
  const [realEstateError, setRealEstateError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const [mindMapRoot, setMindMapRoot] = useState(null);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [routineTasks, setRoutineTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const userRole = sessionStorage.getItem('role');
      const userEmail = sessionStorage.getItem('email');
      const userName = sessionStorage.getItem('name');
      let assignedProjects = [];
      if (userRole === 'member') {
        // Fetch all projects and filter to those assigned to this user
        const allProjects = await getProjects();
        const myProjects = (allProjects.projects || []).filter(p => Array.isArray(p.assigned_users) && p.assigned_users.includes(userName));
        assignedProjects = myProjects.map(p => p._id);
        setProjects(myProjects);
      } else {
        // Admin: show all projects
        const allProjects = await getProjects();
        setProjects(allProjects.projects || []);
      }
      // Fetch notes with custom filter
      let noteFilter = {};
      if (userRole === 'member') {
        noteFilter = {
          $or: [
            { created_by: userEmail },
            { project_id: assignedProjects.length > 0 ? { $in: assignedProjects } : null }
          ]
        };
      } else {
        noteFilter = { created_by: userEmail };
      }
      // Backend must support $or/$in, or filter client-side if not
      let fetchedNotes = await fetchNotes({}, 'active');
      if (userRole === 'member') {
        fetchedNotes = fetchedNotes.filter(note =>
          note.created_by === userEmail ||
          (note.project_id && assignedProjects.includes(note.project_id))
        );
      } else {
        // Admin: see everything except other users' daily/routine notes
        fetchedNotes = fetchedNotes.filter(note => {
          const isDailyOrRoutine = note.type === 'daily task' || note.type === 'routine task';
          const isOthers = note.created_by !== userEmail;
          return !(isDailyOrRoutine && isOthers);
        });
      }
      setNotes(fetchedNotes);
      setAllNotes(fetchedNotes);
      loadRoutineTasks();
    };
    fetchData();
  }, []);

  // Listen for note creation events to refresh routine tasks
  useEffect(() => {
    const handleNoteCreated = (event) => {
      const { note } = event.detail;
      if (note && note.type === 'routine task') {
        loadRoutineTasks(); // Refresh routine tasks when a new one is created
      }
    };

    document.addEventListener('note-created', handleNoteCreated);
    return () => {
      document.removeEventListener('note-created', handleNoteCreated);
    };
  }, []);

  // ...existing code...

  // Throttle animation frame updates for better performance
  useEffect(() => {
    let frameId;
    let lastUpdate = Date.now();
    const animate = () => {
      const now = Date.now();
      // Only update every ~60ms (~16fps)
      if (now - lastUpdate > 60) {
        setAnimationFrame(prev => prev + 1);
        lastUpdate = now;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Only generate mind map when notes or projects/people change, not on every animation frame
  useEffect(() => {
    if (notes.length > 0) {
      generateMindMap();
    }
  }, [notes, allNotes]);

  useLayoutEffect(() => {
    if (!rootRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rootRect = rootRef.current.getBoundingClientRect();
    const childrenRects = childRefs.current.map(ref => ref?.getBoundingClientRect());
    setPositions({
      container: containerRect,
      root: rootRect,
      children: childrenRects,
    });
  }, [notes, expanded]);

  const loadRoutineTasks = async () => {
    try {
      if (!userEmail) return;
      const response = await fetch(`/api/notes?filter_type=routine task&filter_created_by=${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch routine tasks');
      const data = await response.json();
      const tasks = data.notes || [];
      setRoutineTasks(tasks.filter(task => !task.completed));
      setCompletedTasks(tasks.filter(task => task.completed));
    } catch (error) {
      console.error('Error loading routine tasks:', error);
    }
  };

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const fetchedNotes = await fetchNotes({}, 'active');
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMindMap = () => {
    const dailyTasks = notes.filter(note => note.type === 'daily task' && !note.completed);
    const mindMap = [
      {
        id: 'center',
        text: 'Daily Tasks',
        x: 400,
        y: 300,
        type: 'center',
        children: [],
        pulse: true
      }
    ];

    dailyTasks.slice(0, 8).forEach((task, index) => {
      const angle = (index / Math.max(dailyTasks.length, 1)) * 2 * Math.PI;
      const radius = 150 + Math.sin(animationFrame * 0.02 + index) * 10;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      mindMap.push({
        id: task._id,
        text: task.title,
        x: x,
        y: y,
        type: 'task',
        data: task,
        parent: 'center',
        originalX: x,
        originalY: y,
        expanded: expandedNodes[task._id]
      });
    });

    setMindMapData(mindMap);
    drawMindMap(mindMap);
  };

  const drawMindMap = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach(node => {
      if (node.parent && node.parent !== 'center') {
        const parent = data.find(n => n.id === node.parent);
        if (parent) {
          const dx = node.x - parent.x;
          const dy = node.y - parent.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          const gradient = ctx.createLinearGradient(parent.x, parent.y, node.x, node.y);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(0.5, '#8b5cf6');
          gradient.addColorStop(1, '#10b981');
          
          ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
          
          ctx.shadowBlur = 0;
          
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();

          const numDots = 3;
          for (let i = 0; i < numDots; i++) {
            const progress = ((animationFrame * 0.02) + (i * 0.3)) % 1;
            const dotX = parent.x + dx * progress;
            const dotY = parent.y + dy * progress;
            
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
          }

          const arrowLength = 12;
          const arrowAngle = Math.PI / 6;
          
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(
            node.x - arrowLength * Math.cos(angle - arrowAngle),
            node.y - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(
            node.x - arrowLength * Math.cos(angle + arrowAngle),
            node.y - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    });

    data.forEach(node => {
      const isCenter = node.type === 'center';
      const isProject = node.type === 'project';
      const isExpanded = node.expanded;
      const isHovered = hoveredNode === node.id;
      
      const baseSize = isCenter ? 50 : 35;
      const hoverScale = isHovered ? 1.2 : 1;
      const pulseScale = node.pulse ? 1 + Math.sin(animationFrame * 0.1) * 0.1 : 1;
      const size = baseSize * hoverScale * pulseScale;
      
      if (isHovered) {
        ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 15, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size);
      
      if (isCenter) {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.7, '#1d4ed8');
        gradient.addColorStop(1, '#1e40af');
      } else if (isProject) {
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.7, '#6d28d9');
        gradient.addColorStop(1, '#5b21b6');
      } else {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.7, '#059669');
        gradient.addColorStop(1, '#047857');
      }
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = isExpanded ? '#ffffff' : '#e5e7eb';
      ctx.lineWidth = isExpanded ? 4 : 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(node.x - size * 0.3, node.y - size * 0.3, size * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.fillStyle = '#ffffff';
      ctx.font = isCenter ? 'bold 16px Arial' : '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const maxWidth = isCenter ? 80 : 60;
      const words = node.text.split(' ');
      let line = '';
      let y = node.y - (words.length > 1 ? 8 : 0);
      
      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, node.x, y);
          line = word + ' ';
          y += 18;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, node.x, y);
      ctx.shadowBlur = 0;

      if (!isCenter && node.data) {
        const indicatorSize = 10;
        const indicatorX = node.x + size - 8;
        const indicatorY = node.y - size + 8;
        
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorSize, 0, 2 * Math.PI);
        ctx.fillStyle = isExpanded ? '#ef4444' : '#10b981';
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isExpanded ? '-' : '+', indicatorX, indicatorY);
      }
    });

    data.forEach(node => {
      if (node.expanded && node.data) {
        drawExpandedDetails(node, ctx);
      }
    });
  };

  const drawExpandedDetails = (node, ctx) => {
    const detailX = node.x + 200;
    const detailY = node.y - 100;
    const detailWidth = 300;
    const detailHeight = 200;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.roundRect = function(x, y, width, height, radius) {
      this.beginPath();
      this.moveTo(x + radius, y);
      this.lineTo(x + width - radius, y);
      this.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.lineTo(x + width, y + height - radius);
      this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.lineTo(x + radius, y + height);
      this.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.lineTo(x, y + radius);
      this.quadraticCurveTo(x, y, x + radius, y);
      this.closePath();
    };
    
    ctx.roundRect(detailX, detailY, detailWidth, detailHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(node.text, detailX + 15, detailY + 25);

    const status = getStatusText(node.data.completed, node.data.deadline);
    const statusColor = getStatusColor(node.data.completed, node.data.deadline);
    ctx.fillStyle = statusColor.includes('green') ? '#10b981' : 
                   statusColor.includes('red') ? '#ef4444' : 
                   statusColor.includes('yellow') ? '#f59e0b' : '#6b7280';
    ctx.font = '12px Arial';
    ctx.fillText(status, detailX + 15, detailY + 45);

    if (node.data.description) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      const desc = node.data.description.length > 50 ? 
        node.data.description.substring(0, 50) + '...' : 
        node.data.description;
      ctx.fillText(desc, detailX + 15, detailY + 65);
    }

    const buttonY = detailY + detailHeight - 40;
    
    ctx.fillStyle = '#10b981';
    ctx.roundRect(detailX + 15, buttonY, 80, 25, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Complete', detailX + 55, buttonY + 12);

    ctx.fillStyle = '#3b82f6';
    ctx.roundRect(detailX + 105, buttonY, 60, 25, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Edit', detailX + 135, buttonY + 12);

    ctx.fillStyle = '#ef4444';
    ctx.roundRect(detailX + 175, buttonY, 60, 25, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Delete', detailX + 205, buttonY + 12);
  };

  const handleMindmapClick = (e, target) => {
    const rect = target.getBoundingClientRect();
    // Convert mouse coordinates to mindmap coordinates, accounting for pan and zoom
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check for expanded node details click
    mindMapData.forEach(node => {
      if (node.expanded && node.data) {
        const detailX = node.x + 200;
        const detailY = node.y - 100;
        const detailWidth = 300;
        const detailHeight = 200;
        if (x >= detailX && x <= detailX + detailWidth &&
            y >= detailY && y <= detailY + detailHeight) {
          const buttonY = detailY + detailHeight - 40;
          if (x >= detailX + 15 && x <= detailX + 95 &&
              y >= buttonY && y <= buttonY + 25) {
            handleCompleteTask(node.data);
            return;
          }
          if (x >= detailX + 105 && x <= detailX + 165 &&
              y >= buttonY && y <= buttonY + 25) {
            handleEditTask(node.data);
            return;
          }
          if (x >= detailX + 175 && x <= detailX + 235 &&
              y >= buttonY && y <= buttonY + 25) {
            handleDeleteTask(node.data);
            return;
          }
        }
      }
    });

    // Find the clicked node, using correct radius and coordinates
    const clickedNode = mindMapData.find(node => {
      const baseSize = node.type === 'center' ? 50 : 35;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < baseSize;
    });
    handleNodeClick(clickedNode);
  };

  const handleCompleteTask = async (taskData) => {
    try {
      await updateNote(taskData._id, { ...taskData, completed: true });
      toast.success('Task completed!');
      loadNotes();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleEditTask = (taskData) => {
    toast.info('Edit functionality coming soon!');
  };

  const handleDeleteTask = async (taskData) => {
    const taskId = taskData._id || taskData;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteNote(taskId);
        setShowDetailModal(false);
        setModalNode(null);
        toast.success('Task deleted successfully');
        loadNotes(); // Refresh notes
        toast.success('Task deleted!');
        loadNotes();
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleEditTaskInline = async (id, changes) => {
    try {
      await updateNote(id, changes);
      setModalNode(prev => prev ? { ...prev, ...changes } : prev);
      toast.success('Task updated');
      loadNotes();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hovered = mindMapData.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < (node.type === 'center' ? 50 : 35);
    });
    
    setHoveredNode(hovered ? hovered.id : null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (completed, deadline) => {
    if (completed) return 'bg-green-100 text-green-800';
    if (deadline) {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      if (deadlineDate < now) return 'bg-red-100 text-red-800';
      if (deadlineDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (completed, deadline) => {
    if (completed) return 'Completed';
    if (deadline) {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      if (deadlineDate < now) return 'Overdue';
      if (deadlineDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'Due Soon';
    }
    return 'Active';
  };

  const getTodayTasks = () => {
    const today = new Date();
    return notes.filter(note => {
      if (note.deadline) {
        const deadline = new Date(note.deadline);
        return deadline.toDateString() === today.toDateString();
      }
      return false;
    });
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return notes.filter(note => {
      if (note.deadline && !note.completed) {
        const deadline = new Date(note.deadline);
        return deadline < today;
      }
      return false;
    });
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return notes.filter(note => {
      if (note.deadline && !note.completed) {
        const deadline = new Date(note.deadline);
        return deadline > today && deadline <= nextWeek;
      }
      return false;
    });
  };

  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    return notes.filter(note => {
      if (note.deadline) {
        const deadline = new Date(note.deadline);
        return deadline.toDateString() === date.toDateString();
      }
      return false;
    });
  };

  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks();
  const calendarDays = getCalendarDays();

  const handleToggle = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleComplete = async (node) => {
    if (node.completed) return;
    // Optimistically update the UI
    function removeNodeFromTree(tree, nodeId) {
      if (tree.id === nodeId) {
        return null;
      }
      if (tree.children && tree.children.length > 0) {
        const newChildren = tree.children
          .map(child => removeNodeFromTree(child, nodeId))
          .filter(Boolean);
        return { ...tree, children: newChildren };
      }
      return tree;
    }
    const prevMindMapRoot = mindMapRoot;
    try {
      // Prepare required fields for updateNote
      let updatePayload = { completed: true };
      if (node.data) {
        if (node.data.title || node.data.text) updatePayload.title = node.data.title || node.data.text;
        if (node.data.description) updatePayload.description = node.data.description;
      } else {
        if (node.title || node.text) updatePayload.title = node.title || node.text;
        if (node.description) updatePayload.description = node.description;
      }
      // Fallback: if neither title nor description, use id as title
      if (!updatePayload.title && !updatePayload.description) {
        updatePayload.title = node.id;
        updatePayload.description = '';
      }
      await updateNote(node.id, updatePayload);
      setMindMapRoot(removeNodeFromTree(mindMapRoot, node.id));
      toast.success('Task marked as completed!');
      loadNotes(); // Refresh notes from backend
    } catch (error) {
      setMindMapRoot(prevMindMapRoot);
      toast.error('Failed to complete task');
    }
  };

  const getDailyTasksMindMap = () => {
    return {
      id: 'root',
      title: 'Daily Work',
      color: 'bg-blue-400',
      icon: 'brain',
      children: notes
        .filter(note => note.type === 'daily task' && !note.completed)
        .map(note => ({
          id: note._id,
          title: note.title,
          description: note.description,
          color: 'bg-green-200',
          icon: 'zap',
          completed: note.completed,
          children: [],
        })),
    };
  };

  // Hierarchical mindmap: notes connected to projects by projectId
  // Example: getProjectsMindMapHierarchical
  const getProjectsMindMapHierarchical = (projects, notes) => {
    return {
      id: 'root',
      title: 'Projects',
      icon: 'rocket',
      children: projects.map(project => ({
        id: project._id,
        title: project.title,
        description: project.description,
        icon: 'target',
        color: 'bg-purple-200',
        children: notes
          .filter(note => note.projectId === project._id)
          .map(note => ({
            id: note._id,
            title: note.title,
            description: note.description,
            icon: 'zap',
            color: 'bg-green-200',
            completed: note.completed,
            children: [],
          })),
      })),
    };
  };

  // Removed getPeopleMindMap

  // Removed useEffect for people mindmap

  const filterMindMap = (node) => {
    if (!searchQuery.trim()) return node;
    const q = searchQuery.toLowerCase();
    const match = (str) => str && str.toLowerCase().includes(q);
    const nodeMatches = match(node.title) || match(node.description) || match(node.assigned_to || '') || match(node.id || '');
    if (!node.children || node.children.length === 0) {
      return nodeMatches ? { ...node, highlight: true } : null;
    }
    const filteredChildren = node.children.map(filterMindMap).filter(Boolean);
    if (nodeMatches || filteredChildren.length > 0) {
      return { ...node, highlight: nodeMatches, children: filteredChildren };
    }
    return null;
  };
  // handleDeleteTask has been merged with the other handler

  const handleStatusChange = async (taskId) => {
    try {
      const task = modalNode;
      const newStatus = !task.completed;
      await updateNote(taskId, { completed: newStatus });
      setModalNode({ ...task, completed: newStatus });
      if (newStatus) {
        setMindMapRoot(prev => {
          if (!prev) return prev;
          function removeNode(node, id) {
            if (!node.children || node.children.length === 0) return node;
            const filteredChildren = node.children
              .filter(child => child.id !== id)
              .map(child => removeNode(child, id));
            return { ...node, children: filteredChildren };
          }
          return removeNode(prev, taskId);
        });
        setShowDetailModal(false);
      }
      toast.success(`Task marked as ${newStatus ? 'completed' : 'not completed'}`);
      loadNotes(); // Refresh notes
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  useEffect(() => {
    setMindMapRoot(getDailyTasksMindMap());
    setExpandedNodes({ root: true });
  }, [notes, allNotes, searchQuery]);

  if (searchQuery.trim() && mindMapRoot) {
    const filteredRoot = filterMindMap(mindMapRoot);
    if (!filteredRoot) {
      setMindMapRoot({ id: 'root', title: 'No matches found', children: [] });
    } else {
      setMindMapRoot(filteredRoot);
    }
  }

  const handleNodeClick = (node) => {
    if (!node || node.id === 'root' || node.id === 'center' || node.type === 'center') return;

    const modalData = {
      id: node.id || node._id, // Ensure we have an id for API calls
      title: node.title || node.text || '', // Use title or text property
      description: node.description || (node.data && node.data.description) || '',
      completed: node.completed || (node.data && node.data.completed) || false,
      deadline: node.deadline || (node.data && node.data.deadline)
    };
    
    setModalNode(modalData);
    setShowDetailModal(true);
  };;

  const handleModalCompleteNote = async (note) => {
    await updateNote(note._id, { ...note, completed: true });
    loadNotes();
    fetchNotes({}, 'active').then(setAllNotes);
    setShowDetailModal(false);
  };

  const handleModalTrashNote = async (note) => {
    await updateNote(note._id, { ...note, in_trash: true });
    loadNotes();
    fetchNotes({}, 'active').then(setAllNotes);
    setShowDetailModal(false);
  };

  const userName = sessionStorage.getItem('name') || 'User';
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Add drag, zoom, and expand/collapse to the downward tree mindmap
  // --- State additions ---
  // (already present) const [zoom, setZoom] = useState(1);
  // (already present) const [draggingNodeId, setDraggingNodeId] = useState(null);
  // (already present) const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // (already present) const [expandedNodes, setExpandedNodes] = useState({});

  // --- Update layout to skip collapsed nodes ---
  function layoutMindMapTree(node, x, y, level = 0, siblingIndex = 0, siblingsCount = 1, parentWidth = 0) {
    const verticalSpacing = 140;
    const horizontalSpacing = 160;
    node.x = x;
    node.y = y;
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    // Only layout children if expanded
    if (!expandedNodes[node.id]) return;
    const totalWidth = (node.children.length - 1) * horizontalSpacing;
    node.children.forEach((child, i) => {
      const childX = x - totalWidth / 2 + i * horizontalSpacing;
      const childY = y + verticalSpacing;
      layoutMindMapTree(child, childX, childY, level + 1, i, node.children.length, totalWidth);
    });
  }

  // Draw straight vertical lines from parent to child
  
  // Gradient palette (updated to match MindMapNode.jsx)
  const mindmapGradients = [
    { from: '#34d399', to: '#3b82f6' }, // green-400 to blue-500
    { from: '#f472b6', to: '#8b5cf6' }, // pink-400 to purple-500
    { from: '#facc15', to: '#ef4444' }, // yellow-400 to red-500
    { from: '#2dd4bf', to: '#06b6d4' }, // teal-400 to cyan-500
    { from: '#818cf8', to: '#1d4ed8' }, // indigo-400 to blue-700
  ];

  function drawMindMapTreeNodes(ctx, node, animationFrame = 0, hoveredNodeId = null, colorIndex = 0) {
    const isCenter = node.id === 'root' || node.type === 'center' || node.type === 'section';
    const isDelegation = node.type === 'delegation';
    const isHovered = hoveredNodeId === node.id;
    const baseSize = isCenter ? 62 : isDelegation ? 30 : 62;
    const hoverScale = isHovered ? 1.18 : 1;
    const pulseScale = node.pulse ? 1 + Math.sin(animationFrame * 0.1) * 0.08 : 1;
    const size = baseSize * hoverScale * pulseScale;

    // Pick gradient for this node
    let grad;
    if (isCenter) {
      grad = ctx.createLinearGradient(node.x - size, node.y - size, node.x + size, node.y + size);
      grad.addColorStop(0, '#60a5fa'); // blue-400
      grad.addColorStop(1, '#2563eb'); // blue-600
    } else {
      const palette = mindmapGradients[colorIndex % mindmapGradients.length];
      grad = ctx.createLinearGradient(node.x - size, node.y - size, node.x + size, node.y + size);
      grad.addColorStop(0, palette.from);
      grad.addColorStop(1, palette.to);
    }

    // Soft drop shadow for floating effect
      ctx.save();
      ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.shadowColor = 'rgba(0,0,0,0.13)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

    // Thin, semi-transparent white border
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.lineWidth = isCenter ? 4 : 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.restore();

    // Gentle hover glow and description tooltip
    if (isHovered) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 10, 0, 2 * Math.PI);
      ctx.shadowColor = 'rgba(102,126,234,0.25)';
      ctx.shadowBlur = 32;
      ctx.strokeStyle = 'rgba(102,126,234,0.18)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Show description tooltip if available
      if (node.description) {
        ctx.save();
        ctx.font = '14px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(30,41,59,0.97)';
        const tooltipWidth = Math.min(ctx.measureText(node.description).width + 32, 260);
        const tooltipX = node.x - tooltipWidth / 2;
        const tooltipY = node.y - size - 38;
        ctx.beginPath();
        ctx.moveTo(tooltipX, tooltipY);
        ctx.lineTo(tooltipX + tooltipWidth, tooltipY);
        ctx.lineTo(tooltipX + tooltipWidth, tooltipY + 38);
        ctx.lineTo(tooltipX, tooltipY + 38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '14px Segoe UI, Arial, sans-serif';
        ctx.fillText(node.description.length > 40 ? node.description.slice(0, 40) + '...' : node.description, node.x, tooltipY + 12);
        ctx.restore();
      }
    }

    // Draw Lucide SVG icon centered above the text
    ctx.save();
    const IconComponent = iconMap[node.icon] || iconMap['brain'];
    // Render SVG to string
    const svgString = IconComponent?.toSvg ? IconComponent.toSvg({ color: '#fff', width: 38, height: 38 }) : null;
    if (svgString) {
      const img = new window.Image();
      const svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
      img.onload = function() {
        ctx.drawImage(img, node.x - 19, node.y - 42, 38, 38);
      };
      img.src = svg;
      // If cached, draw immediately
      if (img.complete) {
        ctx.drawImage(img, node.x - 19, node.y - 42, 38, 38);
      }
    } else {
      // fallback: draw emoji
      let icon = '🧠';
      if (node.icon === 'rocket') icon = '🚀';
      else if (node.icon === 'target') icon = '🎯';
      else if (node.icon === 'users') icon = '👥';
      else if (node.icon === 'zap') icon = '⚡';
      else if (node.icon === 'lightbulb') icon = '💡';
      ctx.font = 'bold 38px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.93;
      ctx.fillText(icon, node.x, node.y - 22);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // --- Modern text style, improved wrapping ---
    ctx.save();
    let baseFontSize = isCenter ? 18 : 16;
    let fontFamily = '600 16px "Segoe UI", Arial, sans-serif';
    let maxLines = 3;
    let lineHeight = 23;
    let text = (node.title || node.text || '').trim();
    const maxWidth = size * 1.5;
    let words = text.split(' ');
    let lines = [];
    let line = '';
    ctx.font = `${baseFontSize}px Segoe UI, Arial, sans-serif`;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        lines.push(line.trim());
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line.trim());
    // If too many lines, reduce font size and line height
    while (lines.length > maxLines && baseFontSize > 10) {
      baseFontSize -= 2;
      lineHeight -= 2;
      ctx.font = `${baseFontSize}px Segoe UI, Arial, sans-serif`;
      lines = [];
      line = '';
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line.trim());
    }
    // If still too many lines, add ellipsis
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + '...').width > maxWidth && last.length > 0) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last + '...';
    }
    ctx.font = `${baseFontSize}px Segoe UI, Arial, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 3;
    // Center lines vertically, with padding from icon
    let y = node.y + 18 + (baseFontSize < 16 ? 2 : 0) - ((lines.length - 1) * lineHeight / 2);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], node.x, y + i * lineHeight);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw expand/collapse button if node has children and is not root
    if (node.children && node.children.length > 0 && node.id !== 'root') {
      const btnX = node.x + 62 - 18;
      const btnY = node.y - 62 + 18;
      ctx.save();
      ctx.beginPath();
      ctx.arc(btnX, btnY, 14, 0, 2 * Math.PI);
      ctx.fillStyle = expandedNodes[node.id] ? '#ef4444' : '#10b981';
      ctx.shadowColor = 'rgba(0,0,0,0.10)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(expandedNodes[node.id] ? '-' : '+', btnX, btnY + 1);
      ctx.restore();
    }

    // Only draw children if expanded
    if (node.children && node.children.length > 0 && expandedNodes[node.id]) {
      node.children.forEach((child, idx) => drawMindMapTreeNodes(ctx, child, animationFrame, hoveredNode, idx));
    }

    // Checklist for leaf nodes (no children)
    if ((!node.children || node.children.length === 0) && node.id !== 'root') {
      const checkX = node.x + size - 18;
      const checkY = node.y - size + 18;
      ctx.save();
      ctx.beginPath();
      ctx.arc(checkX, checkY, 14, 0, 2 * Math.PI);
      ctx.fillStyle = node.completed ? '#10b981' : '#e5e7eb';
      ctx.shadowColor = 'rgba(0,0,0,0.10)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (node.completed) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', checkX, checkY + 1);
      }
      ctx.restore();
    }
  }

  function drawMindMapTreeLines(ctx, node) {
    if (!Array.isArray(node.children) || node.children.length === 0) return;
    if (!expandedNodes[node.id]) return;
    node.children.forEach(child => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(node.x, node.y + 62); // start at bottom of parent node
      ctx.lineTo(child.x, child.y - 62); // end at top of child node
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 5;
      ctx.shadowColor = 'rgba(139,92,246,0.18)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
      drawMindMapTreeLines(ctx, child);
    });
  }

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y, mindMapRoot, zoom, pan, expandedNodes);
    if (node) {
      handleNodeClick(node);
    }
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mindMapRoot || !mindMapRoot.children || mindMapRoot.children.length === 0) return;

    // Add click event listener
    canvas.addEventListener('click', handleCanvasClick);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    layoutMindMapTree(mindMapRoot, canvas.width / 2 / zoom, canvas.height / 2 / zoom);
    drawMindMapTreeLines(ctx, mindMapRoot);
    drawMindMapTreeNodes(ctx, mindMapRoot, animationFrame, hoveredNode);
    ctx.restore();

    // Cleanup
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [mindMapRoot, animationFrame, hoveredNode, zoom, pan]);

  const handleRealEstateUpload = (e) => {
    setRealEstateError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        let mindMap = { id: 'root', title: 'Real Estate Projects', icon: 'rocket', children: [] };
        let currentProject = null;
        let rowIndex = 0;
        function isCellBold(sheet, rowIdx, colIdx) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          const cell = sheet[cellRef];
          return cell && cell.s && cell.s.font && cell.s.font.bold;
        }
        while (rowIndex < rows.length) {
          const row = rows[rowIndex];
          if (!row || row.length === 0) { rowIndex++; continue; }
          if (row[0] && isCellBold(sheet, rowIndex, 0)) {
            currentProject = {
              id: row[0],
              title: row[0],
              icon: 'target',
              children: []
            };
            mindMap.children.push(currentProject);
            rowIndex++;
            while (rowIndex < rows.length) {
              const taskRow = rows[rowIndex];
              if (!taskRow || taskRow.length === 0) { rowIndex++; continue; }
              if (taskRow[0] && isCellBold(sheet, rowIndex, 0)) break;
              const taskTitle = taskRow[0];
              if (taskTitle) {
                const users = taskRow[1] ? taskRow[1].split(/,|\n/).map(p => p.trim()).filter(Boolean) : [];
                currentProject.children.push({
                  id: taskTitle + (taskRow[1] || ''),
                  title: taskTitle,
                  icon: 'zap',
                  children: users.map(u => ({ id: u, title: u, icon: 'users', children: [] }))
                });
              }
              rowIndex++;
            }
          } else {
            rowIndex++;
          }
        }
        setRealEstateMindMap(mindMap);
      } catch (err) {
        setRealEstateError('Failed to parse Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Add iconMap for Lucide icons
  const iconMap = {
    brain: Brain,
    lightbulb: Lightbulb,
    target: Target,
    rocket: Target, // fallback to Target for 'rocket' icon
    users: Users,
    zap: Zap,
  };

  // Move getNodeAtPosition helper outside of event handlers
  function getNodeAtPosition(x, y, root, zoom, pan, expandedNodes) {
    let found = null;
    function search(node) {
      const dist = Math.sqrt((x - node.x * zoom - pan.x) ** 2 + (y - node.y * zoom - pan.y) ** 2);
      if (dist < 62 * zoom && node.id !== 'root') found = node;
      if (node.children && node.children.length > 0 && expandedNodes[node.id]) {
        for (let child of node.children) {
          search(child);
        }
      }
    }
    if (root) search(root);
    return found;
  }

  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on expand/collapse button
    function checkExpandButton(node) {
      if (node.children && node.children.length > 0) { // removed node.id !== 'root'
        const btnX = node.x + 62 - 18;
        const btnY = node.y - 62 + 18;
        const dist = Math.sqrt((x - btnX) ** 2 + (y - btnY) ** 2);
        if (dist < 14) { // 14 is the button radius
          handleToggle(node.id);
          return true;
        }
      }
      if (node.children && node.children.length > 0 && expandedNodes[node.id]) {
        for (let child of node.children) {
          if (checkExpandButton(child)) return true;
        }
      }
      return false;
    }
    if (mindMapRoot && checkExpandButton(mindMapRoot)) {
      return; // Don't start drag/pan if expand/collapse was clicked
    }

    // Check if mouse is on a node (for drag/expand)
    const node = getNodeAtPosition(x, y, mindMapRoot, zoom, pan, expandedNodes);
    if (node) {
      setDraggingNodeId(node.id);
      setDragOffset({ x: (x - pan.x) / zoom - node.x, y: (y - pan.y) / zoom - node.y });
      return;
    }
    // Otherwise, start panning with left mouse button
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanOrigin({ ...pan });
    }

    // Checklist detection for leaf nodes
    function checkLeafChecklist(node) {
      if ((!node.children || node.children.length === 0) && node.id !== 'root') {
        const size = 62; // base size for non-root nodes
        const checkX = node.x + size - 18;
        const checkY = node.y - size + 18;
        const dist = Math.sqrt((x - checkX) ** 2 + (y - checkY) ** 2);
        if (dist < 14) {
          handleComplete(node);
          return true;
        }
      }
      if (node.children && node.children.length > 0 && expandedNodes[node.id]) {
        for (let child of node.children) {
          if (checkLeafChecklist(child)) return true;
        }
      }
      return false;
    }
    if (mindMapRoot && checkLeafChecklist(mindMapRoot)) {
      return;
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panOrigin.x + dx, y: panOrigin.y + dy });
      return;
    }
    if (!draggingNodeId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xNode = (e.clientX - rect.left - pan.x) / zoom;
    const yNode = (e.clientY - rect.top - pan.y) / zoom;
    function updateNode(node) {
      if (node.id === draggingNodeId) {
        node.x = xNode - dragOffset.x;
        node.y = yNode - dragOffset.y;
      }
      if (node.children && node.children.length > 0 && expandedNodes[node.id]) {
        node.children.forEach(updateNode);
      }
    }
    if (mindMapRoot) updateNode(mindMapRoot);
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.1));
  const handleZoomOut = () => setZoom(z => Math.max(0.2, z - 0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e) => {
      e.preventDefault();
      // Zoom centered on mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newZoom = Math.max(0.2, Math.min(2, zoom + delta));
      // Adjust pan so zoom is centered on mouse
      setPan((prevPan) => ({
        x: prevPan.x - (mouseX * (newZoom - zoom)),
        y: prevPan.y - (mouseY * (newZoom - zoom)),
      }));
      setZoom(newZoom);
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan]);

  // Request browser notification permission on app load
  useEffect(() => {
    if (window.Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // In-app and browser push notifications for reminders
  useEffect(() => {
    // Track notified note IDs in a ref to avoid duplicate notifications in this session
    const notifiedRef = window.__notifiedNotesRef = window.__notifiedNotesRef || new Set();
    const interval = setInterval(() => {
      const now = new Date();
      const soon = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
      notes.forEach(note => {
        if (
          note.deadline &&
          !note.completed &&
          !notifiedRef.has(note._id) &&
          new Date(note.deadline) > now &&
          new Date(note.deadline) <= soon
        ) {
          // In-app toast
          toast(`Reminder: ${note.title} is due soon!`, { icon: '⏰' });
          // Browser push notification
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Reminder', {
              body: `${note.title} is due soon!`,
              icon: '/favicon.ico', // Optional: path to your app icon
            });
          }
          notifiedRef.add(note._id);
        }
      });
    }, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [notes]);

  // Fetch daily tasks on mount and when notes change, with error handling
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/notes?filter_type=daily task&filter_created_by=${encodeURIComponent(userEmail)}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data && data.notes) setDailyTasks(data.notes);
      })
      .catch(err => {
        console.error('Failed to fetch daily tasks:', err);
        toast.error('Failed to fetch daily tasks');
      });
  }, [notes]);

  // Helper to get daily tasks for a specific date
  const getDailyTasksForDate = (date) => {
    if (!date) return [];
    return dailyTasks.filter(task => {
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        return deadline.toDateString() === date.toDateString();
      }
      return false;
    });
  };

  // Handler for calendar day click
  const handleCalendarDayClick = (date) => {
    if (!date) return;
    // Set clicked date to local midnight
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);
    const dayTasks = notes.filter(note => {
      if (note.deadline) {
        const deadline = new Date(note.deadline);
        deadline.setHours(0, 0, 0, 0);
        return deadline.getTime() === clickedDate.getTime();
      }
      return false;
    });
    setCalendarModalDate(clickedDate);
    setCalendarModalTasks(dayTasks);
    setCalendarModalOpen(true);
  };

  const handleCalendarEventClick = (clickedDate) => {
    const dayTasks = allNotes.filter(note => {
      if (note.deadline) {
        const deadline = new Date(note.deadline);
        deadline.setHours(0, 0, 0, 0);
        return deadline.getTime() === clickedDate.getTime();
      }
      return false;
    });
    setCalendarModalDate(clickedDate);
    setCalendarModalTasks(dayTasks);
    setCalendarModalOpen(true);
  };

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('dashboard-search');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Component render
  return (
    <>
      {showDetailModal && modalNode && (
        <TaskDetailModal
          task={modalNode}
          onClose={() => {
            setShowDetailModal(false);
            setModalNode(null);
          }}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteTask}
          onEdit={handleEditTaskInline}
        />
      )}
      <div className="w-full max-w-7xl mx-auto px-4 flex justify-end mt-4">
        {/* Remove the RealEstate button */}
      </div>
      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard" onClick={() => setTab('dashboard')}>Dashboard</TabsTrigger>
          {/* Remove RealEstate TabTrigger */}
        </TabsList>
        <>
          <TabsContent value="dashboard">
            <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-2 flex flex-col md:flex-row md:items-center md:justify-between bg-[var(--gm-white)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--color-border)]">
              <div>
                <h1 className="text-4xl font-extrabold text-[var(--gm-dark)] mb-2">Dashboard</h1>
                <div className="text-[var(--gm-aqua)] text-lg font-medium">Welcome, {userName}!</div>
              </div>
              <div className="font-medium text-base mt-2 md:mt-0 bg-[var(--gm-dark)] text-[var(--gm-white)] px-4 py-1 rounded-full shadow-sm border border-[rgba(63,255,224,0.25)]">{todayStr}</div>
            </div>
            <div className="w-full max-w-7xl mx-auto px-4 flex gap-4 mb-4">
              <button onClick={() => setMindMapView('daily')} className={`px-4 py-2 rounded-lg font-medium ${mindMapView==='daily'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>Daily Tasks</button>
            </div>
            <div className="w-full max-w-7xl mx-auto px-4 mb-4 flex items-center gap-2 relative">
              <div className="relative w-full flex items-center">
                <div className="absolute left-4 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, projects, people..."
                  id="dashboard-search"
                  className="w-full pl-12 pr-12 py-3 border-0 rounded-full focus:ring-2 focus:ring-[var(--gm-aqua)]/40 transition-all duration-300 bg-white shadow-lg hover:shadow-xl focus:shadow-xl text-slate-900 placeholder-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-4 p-1.5 rounded-full bg-indigo-100 text-indigo-500 hover:bg-indigo-200 transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Live search dropdown */}
              {searchQuery && (
                <div className="absolute left-4 right-4 top-14 bg-[var(--gm-white)]/95 backdrop-blur-sm border border-[var(--color-border)] rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.08)] z-10 max-h-72 overflow-auto p-2 animate-fadeIn">
                  {(mindMapRoot?.children || [])
                    .filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 8)
                    .map(n => {
                      // Determine tag color based on node type or properties
                      const tagColor = n.type === 'project' ? 
                        'bg-gradient-to-r from-purple-500 to-indigo-500' : 
                        n.priority === 'high' ? 
                        'bg-gradient-to-r from-red-500 to-rose-500' : 
                        n.priority === 'medium' ? 
                        'bg-gradient-to-r from-amber-400 to-orange-500' : 
                        'bg-gradient-to-r from-emerald-400 to-teal-500';
                      
                      return (
                        <button
                          key={n.id}
                          className="w-full text-left px-4 py-3 my-1 hover:bg-indigo-50/80 rounded-xl flex items-center gap-3 transition-all duration-300 hover:shadow-md group"
                          onClick={() => {
                            setModalNode({
                              id: n.id,
                              title: n.title || '',
                              description: n.description || '',
                              completed: !!n.completed,
                              deadline: n.deadline || null,
                            });
                            setShowDetailModal(true);
                          }}
                        >
                          <span className={`inline-block w-3 h-3 rounded-full bg-[var(--gm-aqua)] shadow-sm group-hover:scale-125 transition-all duration-300`} />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-800">{n.title}</span>
                            {n.deadline && (
                              <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5">
                                <CalendarIcon className="w-3 h-3" /> {new Date(n.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                           {n.completed ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white shadow-sm">
                              Completed
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-[rgba(63,255,224,0.12)] text-[var(--gm-aqua)] shadow-sm`}>
                              {n.type || 'Task'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  {((mindMapRoot?.children || []).filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0) && (
                    <div className="px-4 py-3 text-sm text-indigo-400 italic text-center">No results found</div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto px-4 py-4">
              <div ref={containerRef} className="relative flex flex-col items-center bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl shadow-lg border border-indigo-100/50 p-6 col-span-2" style={{ minHeight: 300 }}>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4" aria-label="Task Mind Map">Interactive Task Mind Map</h2>
                <div className="flex gap-3 mb-4">
                  <button 
                    onClick={handleZoomOut} 
                    className="px-4 py-2 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleZoomIn} 
                    className="px-4 py-2 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 rounded-full bg-white/80 text-indigo-700 font-medium shadow-md">
                    Zoom: {(zoom * 100).toFixed(0)}%
                  </span>
                </div>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  style={{ 
                    width: '100%', 
                    maxWidth: 800, 
                    height: 600, 
                    border: '1px solid rgba(99, 102, 241, 0.1)', 
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f0f4ff, #eef2ff, #f5f3ff)', 
                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)',
                    cursor: draggingNodeId ? 'grabbing' : isPanning ? 'grabbing' : 'grab' 
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="transition-shadow duration-300 hover:shadow-lg"
                />
                {positions.root && positions.children.length > 0 && positions.container && (
                  <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 0 }}
                  >
                    <defs>
                      <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {positions.children.map((child, idx) => {
                      if (!child) return null;
                      const containerRect = positions.container;
                      const x1 = positions.root.left + positions.root.width / 2 - containerRect.left;
                      const y1 = positions.root.top + positions.root.height / 2 - containerRect.top;
                      const x2 = child.left + child.width / 2 - containerRect.left;
                      const y2 = child.top + child.height / 2 - containerRect.top;
                      const cx = (x1 + x2) / 2;
                      const cy = Math.min(y1, y2) - 60;
                      const t = (Date.now() / 1000 + idx * 0.2) % 1;
                      const qx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
                      const qy = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
                      return (
                        <g key={idx}>
                          <path
                            d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
                            stroke="url(#line-gradient)"
                            strokeWidth="6"
                            fill="none"
                            filter="url(#glow)"
                          />
                          <circle
                            cx={qx}
                            cy={qy}
                            r="8"
                            fill="#fff"
                            opacity="0.7"
                          >
                            <animate
                              attributeName="opacity"
                              values="0.7;1;0.7"
                              dur="1.2s"
                              repeatCount="indefinite"
                              begin={`${idx * 0.2}s`}
                            />
                          </circle>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-6 col-span-1" style={{ maxWidth: 340 }}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2" aria-label="Calendar">Calendar</h2>
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 ring-1 ring-black/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setSelectedDate(newDate);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setSelectedDate(newDate);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          →
                        </button>
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                    </div>
                    <Calendar
                      calendarDays={calendarDays}
                      getDailyTasksForDate={getDailyTasksForDate}
                      getTasksForDate={getTasksForDate}
                      navigate={navigate}
                      onDayClick={handleCalendarDayClick}
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2" aria-label="Today's Tasks">Today's Tasks</h2>
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
                    </div>
                    <div className="space-y-3">
                      {todayTasks.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tasks due today</p>
                      ) : (
                        todayTasks.map(task => (
                          <div key={task._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                              <p className="text-xs text-gray-500">{formatDate(task.deadline)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3" aria-label="Quick Stats">Quick Stats</h2>
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl shadow-lg border border-indigo-100/50 p-6">
                    <h3 className="text-xl font-bold text-indigo-700 mb-5 border-b border-indigo-100 pb-2">Quick Stats</h3>
                    <div className="space-y-5">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-4 shadow-lg shadow-green-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-white">Completed Today</span>
                          </div>
                          <span className="text-xl font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                            {notes.filter(note => note.completed && new Date(note.updated_at).toDateString() === new Date().toDateString()).length}
                          </span>
                        </div>
                        <div className="mt-3 bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full" style={{ width: `${Math.min(100, notes.filter(note => note.completed && new Date(note.updated_at).toDateString() === new Date().toDateString()).length * 10)}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl p-4 shadow-lg shadow-blue-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-white">Pending Tasks</span>
                          </div>
                          <span className="text-xl font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                            {notes.filter(note => !note.completed).length}
                          </span>
                        </div>
                        <div className="mt-3 bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full" style={{ width: `${Math.min(100, notes.filter(note => !note.completed).length * 5)}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-400 to-fuchsia-500 rounded-xl p-4 shadow-lg shadow-purple-500/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-white">Active Projects</span>
                          </div>
                          <span className="text-xl font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                            {notes.filter(note => note.type === 'project' && !note.completed).length}
                          </span>
                        </div>
                        <div className="mt-3 bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full" style={{ width: `${Math.min(100, notes.filter(note => note.type === 'project' && !note.completed).length * 20)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Routine Tasks Checklist */}
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3" aria-label="Routine Tasks">Routine Tasks</h2>
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl shadow-lg border border-indigo-100/50 p-6">
                    <div className="flex items-center gap-3 mb-5 border-b border-indigo-100 pb-3">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-2 rounded-lg shadow-md shadow-green-500/20">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-indigo-700">Daily Routine</h3>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {routineTasks.length === 0 ? (
                        <p className="text-indigo-500 text-sm italic">No routine tasks for today</p>
                      ) : (
                        routineTasks.slice(0, 10).map(task => {
                          // Determine priority color based on task properties
                          const priorityColor = task.priority === 'high' || task.color === 'red' ? 
                            'from-red-400 to-rose-500 shadow-red-500/30' : 
                            task.priority === 'medium' || task.color === 'amber' ? 
                            'from-amber-400 to-orange-500 shadow-orange-500/30' : 
                            'from-green-400 to-emerald-500 shadow-green-500/30';
                            
                          return (
                            <div 
                              key={task._id} 
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${task.completed ? 
                                'bg-slate-100/50' : 
                                'hover:bg-white hover:shadow-md'}`}
                            >
                              <button
                                onClick={async () => {
                                  try {
                                    await updateNote(task._id, { ...task, completed: true });
                                    await loadRoutineTasks(); // Refresh the tasks
                                    toast.success('Task completed!');
                                  } catch (error) {
                                    toast.error('Failed to update task');
                                  }
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${task.completed ? 
                                  'bg-gradient-to-r from-green-400 to-emerald-500 shadow-md shadow-green-500/30' : 
                                  'border-2 border-indigo-200 hover:border-indigo-400 hover:scale-110'}`}
                              >
                                {task.completed && (
                                  <CheckIcon className="w-4 h-4 text-white animate-scale-check" />
                                )}
                              </button>
                              <div className="flex-1">
                                <p className={`text-sm font-medium transition-all duration-300 ${task.completed ? 
                                  'text-slate-400 line-through' : 
                                  'text-slate-700'}`}>
                                  {task.title}
                                </p>
                                {task.deadline && (
                                  <p className="text-xs text-indigo-400">
                                    {new Date(task.deadline).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 bg-gradient-to-r ${priorityColor} text-white`}>
                                {task.tags?.[0] || 'routine'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* Completed Tasks Section */}
                    {completedTasks.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-indigo-100">
                        <h4 className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-sm shadow-green-500/30"></div>
                          Completed ({completedTasks.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {completedTasks.slice(0, 5).map(task => (
                            <div key={task._id} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white transition-all duration-300">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                                <CheckIcon className="w-2 h-2 text-white" />
                              </div>
                              <p className="text-xs text-slate-400 line-through">{task.title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DndProvider>
            </div>
            {(overdueTasks.length > 0 || upcomingTasks.length > 0) && (
              <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600 mb-3" aria-label="Overdue Tasks">Overdue Tasks</h2>
                    <div className="bg-gradient-to-br from-slate-50 to-rose-50 rounded-xl shadow-lg border border-rose-100/50 p-6">
                      <div className="flex items-center gap-3 mb-5 border-b border-rose-100 pb-3">
                        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-2 rounded-lg shadow-md shadow-red-500/20">
                          <AlertCircle className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-rose-700">Overdue</h3>
                      </div>
                      <div className="space-y-3">
                        {overdueTasks.length === 0 ? (
                          <p className="text-rose-500 text-sm italic">No overdue tasks</p>
                        ) : (
                          overdueTasks.map(task => (
                            <div 
                              key={task._id} 
                              className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-sm hover:shadow-md hover:from-red-100 hover:to-rose-100 transition-all duration-300 border border-rose-100"
                            >
                              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-sm shadow-red-500/30 animate-pulse"></div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" /> Overdue: {formatDate(task.deadline)}
                                </p>
                              </div>
                              <button 
                                className="p-2 rounded-full bg-white shadow-sm hover:shadow-md hover:bg-rose-50 transition-all duration-300"
                                onClick={async () => {
                                  try {
                                    await updateNote(task._id, { ...task, completed: true });
                                    toast.success('Task marked as complete!');
                                  } catch (error) {
                                    toast.error('Failed to update task');
                                  }
                                }}
                              >
                                <CheckIcon className="w-4 h-4 text-rose-500" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3" aria-label="Upcoming Tasks">Upcoming Tasks</h2>
                    <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl shadow-lg border border-purple-100/50 p-6">
                      <div className="flex items-center gap-3 mb-5 border-b border-purple-100 pb-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg shadow-md shadow-purple-500/20">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-purple-700">Upcoming</h3>
                      </div>
                      <div className="space-y-3">
                        {upcomingTasks.length === 0 ? (
                          <p className="text-purple-500 text-sm italic">No upcoming tasks</p>
                        ) : (
                          upcomingTasks.slice(0, 10).map(task => (
                            <div 
                              key={task._id} 
                              className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm hover:shadow-md hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 border border-purple-100"
                            >
                              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-sm shadow-purple-500/30"></div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                <p className="text-xs font-medium text-purple-600 flex items-center gap-1 mt-1">
                                  <CalendarIcon className="w-3 h-3" /> {formatDate(task.deadline)}
                                </p>
                              </div>
                              <button 
                                className="p-2 rounded-full bg-white shadow-sm hover:shadow-md hover:bg-purple-50 transition-all duration-300"
                                onClick={() => {
                                  // Navigate to task detail or open modal
                                  toast.success('Task details opened!');
                                }}
                              >
                                <Edit className="w-4 h-4 text-purple-500" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showDetailModal && modalNode && modalNode.userNotes ? (
              <UserNotesModal modalNode={modalNode} onClose={() => setShowDetailModal(false)} />
            ) : null}
          </TabsContent>
        </>
      </Tabs>
      <CalendarEventModal
        open={calendarModalOpen}
        date={calendarModalDate}
        tasks={calendarModalTasks}
        onClose={() => setCalendarModalOpen(false)}
      />
    </>
  );
};

export default Dashboard;