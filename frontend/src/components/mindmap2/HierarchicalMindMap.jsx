
import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles.css';
import { RootNode } from './nodes/RootNode';
import { BranchNode } from './nodes/BranchNode';
import { ContentNode } from './nodes/ContentNode';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchNotes, getProjects, fetchPeople, updateNote, fetchMindmapComments, addMindmapComment, moveNoteToTrash, editMindmapComment, deleteMindmapComment } from '../../services/api';

function AddMindmapCommentForm({ noteId, onCommentAdded }) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const userName = sessionStorage.getItem('name') || 'Unknown';
    const userEmail = sessionStorage.getItem('email') || '';

    const handleSubmit = async e => {
        e.preventDefault();
        if (!value.trim()) return;
        setLoading(true);
        try {
            const comment = await addMindmapComment(noteId, {
                author_name: userName,
                author_email: userEmail,
                comment_text: value
            });
            onCommentAdded(comment);
            setValue('');
            setError('');
        } catch (err) {
            setError('Failed to add comment');
        }
        setLoading(false);
    };
    return (
        <form onSubmit={handleSubmit} style={{marginTop:'0.5em'}}>
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Add a comment..."
              disabled={loading}
              style={{width:'80%'}}
            />
            <button type="submit" disabled={loading || !value.trim()}>Add</button>
            {error && <div style={{color:'red'}}>{error}</div>}
        </form>
    );
}

const nodeTypes = {
  root: RootNode,
  branch: BranchNode,
  content: ContentNode,
};


export default function HierarchicalMindMap({ viewType = 'people' }) {
  // Helper to reload all mindmap data
  const reloadMindmapData = useCallback(async () => {
    setLoading(true);
    try {
      const userRole = sessionStorage.getItem('role');
      const userEmail = sessionStorage.getItem('email');
      const userName = sessionStorage.getItem('name');
      let assignedProjects = [];
      let projects = [];
      if (userRole === 'member') {
        const allProjects = await getProjects();
        const myProjects = (allProjects.projects || []).filter(p => Array.isArray(p.assigned_users) && p.assigned_users.includes(userName));
        assignedProjects = myProjects.map(p => p._id);
        projects = myProjects;
      } else {
        const allProjects = await getProjects();
        projects = allProjects.projects || [];
      }
      const peopleRes = await fetchPeople();
      let notesRes = await fetchNotes({}, 'active');
      if (userRole === 'member') {
        notesRes = notesRes.filter(note =>
          note.created_by === userEmail ||
          (note.project_id && assignedProjects.includes(note.project_id))
        );
      } else {
        // Admin: see everything except other users' daily/routine notes
        notesRes = notesRes.filter(note => {
          const isDailyOrRoutine = note.type === 'daily task' || note.type === 'routine task';
          const isOthers = note.created_by !== userEmail;
          return !(isDailyOrRoutine && isOthers);
        });
      }
      const people = peopleRes || [];
      const notes = notesRes || [];

      const nodes = [];
      const edges = [];

      const rootLabel = viewType === 'people' ? 'People' : 'Projects';
      nodes.push({
        id: 'root',
        type: 'root',
        position: { x: 0, y: 0 },
        data: { label: rootLabel, nodeType: 'root' },
      });

      if (viewType === 'people') {
        buildPeopleProjectsView(nodes, edges, people, projects, notes);
      } else {
        buildProjectsPeopleView(nodes, edges, people, projects, notes);
      }

      setNodes(nodes);
      setEdges(edges);
    } catch (err) {
      console.error('Error loading mindmap data:', err);
    } finally {
      setLoading(false);
    }
  }, [viewType]);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklistNotes, setChecklistNotes] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [notesStatus, setNotesStatus] = useState({}); // Track status of each note
  const [editingNote, setEditingNote] = useState(null); // State for editing
  const [individualNodeModal, setIndividualNodeModal] = useState({
    open: false,
    node: null,
    type: null
  });
  // State for note comments in the individual note modal
  const [noteComments, setNoteComments] = useState([]);
  const [noteCommentsLoading, setNoteCommentsLoading] = useState(false);
  const [noteCommentsError, setNoteCommentsError] = useState('');

  // State for editing note details in the modal
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  // State for editing comments
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // State for editable status in the individual note modal
  const [editStatus, setEditStatus] = useState('Ongoing');

  // Sync editStatus with the selected note in the modal
  useEffect(() => {
    if (individualNodeModal.open && individualNodeModal.type === 'note' && individualNodeModal.node?.data?.status) {
      setEditStatus(individualNodeModal.node.data.status);
    }
  }, [individualNodeModal.open, individualNodeModal.type, individualNodeModal.node?.data?.status, individualNodeModal.node?.data?.noteId]);

  // Handler for project node click to show checklist modal
  const handleNodeClick = useCallback((event, node) => {
    if (node?.type === 'branch' && node?.data?.nodeType === 'project') {
      const userRole = sessionStorage.getItem('role');
      const userEmail = sessionStorage.getItem('email');
      const userName = sessionStorage.getItem('name');
      let assignedProjects = [];
      let fetchProjects = [];
      const getNotesAndProjects = () => {
        if (userRole === 'member') {
          getProjects().then(allProjects => {
            const myProjects = (allProjects.projects || []).filter(p => Array.isArray(p.assigned_users) && p.assigned_users.includes(userName));
            assignedProjects = myProjects.map(p => p._id);
            fetchProjects = myProjects;
            fetchNotes({}, 'active').then(notes => {
              let filteredNotes = notes.filter(note =>
                note.created_by === userEmail ||
                (note.project_id && assignedProjects.includes(note.project_id))
              );
              // Show ALL notes for this project (regardless of assigned_to)
              const projectNotes = filteredNotes.filter(
                note => note.project_id === node.data.projectId ||
                        note.project === node.data.projectId ||
                        note.project === node.data.label // fallback support for old notes
              );
              setChecklistNotes(projectNotes);
              setSelectedProject(node.data.label);
              setChecklistModalOpen(true);
              // Initialize status for each note
              const initialStatus = {};
              projectNotes.forEach(note => {
                initialStatus[note._id || note.id] = note.completed ? 'Completed' : 'Ongoing';
              });
              setNotesStatus(initialStatus);
            }).catch(error => {
              console.error('Error fetching notes:', error);
            });
          });
        } else {
          getProjects().then(allProjects => {
            fetchProjects = allProjects.projects || [];
            fetchNotes({}, 'active').then(notes => {
              // Admin: see everything except other users' daily/routine notes
              let filteredNotes = notes.filter(note => {
                const isDailyOrRoutine = note.type === 'daily task' || note.type === 'routine task';
                const isOthers = note.created_by !== userEmail;
                return !(isDailyOrRoutine && isOthers);
              });
              // Show ALL notes for this project (regardless of assigned_to)
              const projectNotes = filteredNotes.filter(
                note => note.project_id === node.data.projectId ||
                        note.project === node.data.projectId ||
                        note.project === node.data.label // fallback support for old notes
              );
              setChecklistNotes(projectNotes);
              setSelectedProject(node.data.label);
              setChecklistModalOpen(true);
              // Initialize status for each note
              const initialStatus = {};
              projectNotes.forEach(note => {
                initialStatus[note._id || note.id] = note.completed ? 'Completed' : 'Ongoing';
              });
              setNotesStatus(initialStatus);
            }).catch(error => {
              console.error('Error fetching notes:', error);
            });
          });
        }
      };
      getNotesAndProjects();
    } else if (node?.type === 'content' && node?.data?.nodeType === 'note') {
      // Handle individual note node click
      setIndividualNodeModal({
        open: true,
        node: node,
        type: 'note'
      });
      // Set up edit fields for the selected note
      setEditMode(false);
      setEditTitle(node?.data?.label || '');
      setEditDesc(node?.data?.description || '');
      setEditLoading(false);
      setEditError('');
      setEditingCommentId(null);
      setEditingCommentText('');
      // Fetch mindmap comments for this note
      const noteId = node?.data?.noteId;
      if (noteId) {
        setNoteCommentsLoading(true);
        setNoteCommentsError('');
        fetchMindmapComments(noteId)
          .then(comments => {
            setNoteComments(comments || []);
            setNoteCommentsLoading(false);
          })
          .catch(err => {
            setNoteComments([]);
            setNoteCommentsError('Failed to load comments');
            setNoteCommentsLoading(false);
          });
      } else {
        setNoteComments([]);
      }
    } else if (node?.type === 'branch' && node?.data?.nodeType === 'person') {
      // Handle individual person node click
      setIndividualNodeModal({
        open: true,
        node: node,
        type: 'person'
      });
    }
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expanded, setExpanded] = useState({ root: true });
  const [loading, setLoading] = useState(true);

  // Handle node expansion/collapse
  const handleNodeExpand = useCallback((nodeId) => {
    setExpanded((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            collapsed: !node.data.collapsed
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Listen for toggle events from node components
  useEffect(() => {
    const handleToggleNode = (event) => {
      const { id } = event.detail || {};
      if (!id) return;
      handleNodeExpand(id);
    };
    window.addEventListener('toggleNode', handleToggleNode);
    return () => window.removeEventListener('toggleNode', handleToggleNode);
  }, [handleNodeExpand]);

  // Function to handle connecting a note to a node
  const onConnect = useCallback((params) => {
    const newEdge = {
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
    };
    setEdges((eds) => [...eds, newEdge]);
  }, [setEdges]);

  useEffect(() => {
    reloadMindmapData();
  }, [reloadMindmapData]);

  const buildPeopleProjectsView = (nodes, edges, people, projects, notes) => {
    let yOffset = 200; // Increased from 150
    let personIdx = 0;

    const peopleMap = {};
    people.forEach(person => {
      if (person.name) peopleMap[person.name] = person;
      if (person.email) peopleMap[person.email] = person;
    });

    const uniquePeople = new Set();
    people.forEach(person => {
      if (person.name) uniquePeople.add(person.name);
    });

    projects.forEach(project => {
      (project.assigned_users || []).forEach(user => {
        uniquePeople.add(user);
      });
    });

    Array.from(uniquePeople).forEach(personName => {
      const personId = `person-${personName}`;
      
      nodes.push({
        id: personId,
        type: 'branch',
        position: { x: 300, y: yOffset + personIdx * 500 }, // Increased spacing from 400
        data: {
          label: personName,
          nodeType: 'person',
          personId: personName,
        },
      });
      
      edges.push({ id: `e-root-${personId}`, source: 'root', target: personId });

      const personProjects = projects.filter(project => 
        (project.assigned_users || []).includes(personName)
      );

      let projectIdx = 0;
      personProjects.forEach(project => {
        const projectId = `project-${personId}-${project._id}`;
        
        nodes.push({
          id: projectId,
          type: 'branch',
          position: { x: 600, y: yOffset + personIdx * 500 + projectIdx * 250 }, // Increased spacing
          data: {
            label: project.name,
            nodeType: 'project',
            description: project.description,
            projectId: project._id, // Add MongoDB project _id
          },
        });
        
        edges.push({ id: `e-${personId}-${projectId}`, source: personId, target: projectId });

        // Show all notes for this project (regardless of assigned_to)
        const projectNotes = notes.filter(
          note => note.project_id === project._id || note.project === project._id
        );

        projectNotes.forEach((note, noteIdx) => {
          const noteId = `note-${projectId}-${note._id || note.id}`;
          
          nodes.push({
            id: noteId,
            type: 'content',
            position: {
              x: 900, // Increased from 750
              y: yOffset + personIdx * 500 + projectIdx * 250 + noteIdx * 120, // Increased spacing
            },
            data: {
              label: note.title,
              nodeType: 'note',
              description: note.content || note.description,
              status: note.completed ? 'Completed' : 'Not Completed',
              comments: note.comments || [],
              noteId: note._id || note.id,
              completed: note.completed,
              gradient: 'gradient-green-blue', // Consistent gradient for all notes
            },
          });
          
          edges.push({ id: `e-${projectId}-${noteId}`, source: projectId, target: noteId });
        });

        projectIdx++;
      });

      personIdx++;
    });
  };

  const buildProjectsPeopleView = (nodes, edges, people, projects, notes) => {
    let yOffset = 200; // Increased from 150
    let projectIdx = 0;

    projects.forEach(project => {
      const projectId = `project-${project._id}`;
      
      nodes.push({
        id: projectId,
        type: 'branch',
        position: { x: 300, y: yOffset + projectIdx * 500 }, // Increased spacing
        data: {
          label: project.name,
          nodeType: 'project',
          description: project.description,
          projectId: project._id, // Add MongoDB project _id
        },
      });
      
      edges.push({ id: `e-root-${projectId}`, source: 'root', target: projectId });

      const assignedUsers = project.assigned_users || [];
      
      let personIdx = 0;
      assignedUsers.forEach(userEmail => {
        const person = people.find(p => p.email === userEmail || p.name === userEmail);
        const personName = person ? person.name : userEmail;
        const personId = `person-${projectId}-${userEmail}`;
        
        nodes.push({
          id: personId,
          type: 'branch',
          position: { x: 600, y: yOffset + projectIdx * 500 + personIdx * 250 }, // Increased spacing
          data: {
            label: personName,
            nodeType: 'person',
            project: project.name,
            personId: personName,
          },
        });
        
        edges.push({ id: `e-${projectId}-${personId}`, source: projectId, target: personId });

        // Show all notes for this project (regardless of assigned_to)
        const projectNotes = notes.filter(
          note => note.project_id === project._id || note.project === project._id
        );

        projectNotes.forEach((note, noteIdx) => {
          const noteId = `note-${personId}-${note._id || note.id}`;
          
          nodes.push({
            id: noteId,
            type: 'content',
            position: {
              x: 900, // Increased from 750
              y: yOffset + projectIdx * 500 + personIdx * 250 + noteIdx * 120, // Increased spacing
            },
            data: {
              label: note.title,
              nodeType: 'note',
              description: note.content || note.description,
              status: note.completed ? 'Completed' : 'Not Completed',
              comments: note.comments || [],
              noteId: note._id || note.id,
              completed: note.completed,
              gradient: 'gradient-green-blue', // Consistent gradient for all notes
            },
          });
          
          edges.push({ id: `e-${personId}-${noteId}`, source: personId, target: noteId });
        });

        personIdx++;
      });

      projectIdx++;
    });
  };

  const handleToggle = useCallback((nodeId) => {
    setExpanded((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, []);

  const getVisibleNodesAndEdges = () => {
    const visibleNodes = [];
    const visibleEdges = [];
    const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

    function dfs(nodeId) {
      const node = nodeMap[nodeId];
      if (!node) return;
      visibleNodes.push(node);
      if (expanded[nodeId] !== false) {
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            visibleEdges.push(edge);
            dfs(edge.target);
          }
        });
      }
    }

    dfs('root');
    return { visibleNodes, visibleEdges };
  };

  // Add new handler for editing notes
  const handleEditNote = async (noteId, newTitle) => {
    try {
      await updateNote(noteId, { title: newTitle });
      setEditingNote(null);
      // Reload mindmap data for real-time update
      reloadMindmapData();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Update handleStatusChange to sync with backend
  const handleStatusChange = async (noteId, status) => {
    try {
      // Find the current note to include its title in the update
      const note = checklistNotes.find(n => (n._id || n.id) === noteId);
      if (!note) return;

      const completed = status === 'Completed';
      await updateNote(noteId, {
        completed,
        title: note.title, // Include existing title
        content: note.content || note.description, // Include existing content
        status: completed ? 'completed' : 'ongoing'
      });

      setNotesStatus(prev => ({ ...prev, [noteId]: status }));
      // Reload mindmap data for real-time update
      reloadMindmapData();
    } catch (error) {
      console.error('Error updating note status:', error);
    }
  };

  // Placeholder for deleting note (to be implemented in api.js)
  const handleDeleteNote = async (noteId) => {
    // Call deleteNote from api.js when implemented
    // await deleteNote(noteId);
    // For now, just move to trash
    try {
      await moveNoteToTrash(noteId);
      // Reload mindmap data for real-time update
      reloadMindmapData();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // Individual node handlers
  const handleIndividualNodeStatusChange = async (nodeId, status) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.data?.nodeType === 'note' && node?.data?.noteId) {
        const completed = status === 'Completed';
        await updateNote(node.data.noteId, {
          completed,
          title: node.data.label,
          content: node.data.description,
          status: completed ? 'completed' : 'ongoing'
        });

        // Update the node data
        setNodes(prev => prev.map(n => 
          n.id === nodeId 
            ? { ...n, data: { ...n.data, status, completed } }
            : n
        ));
      }
    } catch (error) {
      console.error('Error updating individual node status:', error);
    }
  };

  const handleIndividualNodeEdit = async (nodeId, newData) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.data?.nodeType === 'note' && node?.data?.noteId) {
        await updateNote(node.data.noteId, newData);
        // Reload mindmap data for real-time update
        reloadMindmapData();
      }
    } catch (error) {
      console.error('Error updating individual node:', error);
    }
  };

  const handleIndividualNodeDelete = async (nodeId) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.data?.nodeType === 'note' && node?.data?.noteId) {
        // Call deleteNote from api.js when implemented
        // await deleteNote(node.data.noteId);
        console.log(`Placeholder: Delete note with ID ${node.data.noteId}`);
        
        // Remove the node from the mindmap
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
      }
    } catch (error) {
      console.error('Error deleting individual node:', error);
    }
  };

  // Ensure visibleNodes and visibleEdges are defined with defaults
  const { visibleNodes = [], visibleEdges = [] } = getVisibleNodesAndEdges();

  // Wrap node types to render expand/collapse buttons and set hasChildren
  const customNodeTypes = {
    ...nodeTypes,
    content: (props) => {
      const hasChildren = edges.some((e) => e.source === props.id);
      if (hasChildren !== props.data.hasChildren) {
        setNodes((nds) => nds.map((n) => (n.id === props.id ? { ...n, data: { ...n.data, hasChildren } } : n)));
      }
      return <ContentNode {...props} />;
    },
    root: (props) => {
      const hasChildren = edges.some((e) => e.source === props.id);
      return (
        <div className="relative">
          <RootNode {...props} />
          {hasChildren && (
            <button
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white rounded-full border shadow p-1 z-10"
              style={{ borderColor: '#ddd' }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => ({ ...prev, [props.id]: !prev[props.id] }));
              }}
              title={expanded[props.id] === false ? 'Expand' : 'Collapse'}
            >
              {expanded[props.id] === false ? (
                <ChevronRight className="w-4 h-4 text-blue-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-500" />
              )}
            </button>
          )}
        </div>
      );
    },
    branch: (props) => {
      const hasChildren = edges.some((e) => e.source === props.id);
      return (
        <div className="relative">
          <BranchNode {...props} />
          {hasChildren && (
            <button
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white rounded-full border shadow p-1 z-10"
              style={{ borderColor: '#ddd' }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => ({ ...prev, [props.id]: !prev[props.id] }));
              }}
              title={expanded[props.id] === false ? 'Expand' : 'Collapse'}
            >
              {expanded[props.id] === false ? (
                <ChevronRight className="w-4 h-4 text-blue-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-500" />
              )}
            </button>
          )}
        </div>
      );
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading mindmap...</p>
        </div>
      </div>
    );
  }

  const addChecklistToAll = () => {
    const checklistId = `checklist-${Date.now()}`;
    const checklistNode = {
      id: checklistId,
      type: 'content',
      position: { x: 1200, y: 300 }, // Increased x position
      data: {
        label: 'Global Checklist',
        nodeType: 'note',
        description: 'This checklist is connected to all nodes',
        status: 'Not Completed',
        comments: [],
        noteId: checklistId,
        completed: false,
      },
    };
    
    setNodes((nds) => [...nds, checklistNode]);
    
    const newEdges = [];
    nodes.forEach((node) => {
      if (node.type === 'branch') {
        newEdges.push({
          id: `e-${checklistId}-${node.id}-${Date.now()}`,
          source: checklistId,
          target: node.id,
        });
      }
    });
    
    setEdges((eds) => [...eds, ...newEdges]);
  };

  return (
    <div className="h-full w-full">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={addChecklistToAll}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-500/20"
        >
          Add Checklist to All
        </button>
      </div>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={customNodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2.0}
        defaultViewport={{ x: 0, y: 0, zoom: 0.3 }} // Reduced zoom for better overview
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
        onNodeClick={handleNodeClick}
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#f0f0f0" gap={20} /> {/* Increased gap */}
        <Controls />
        <MiniMap />
      </ReactFlow>
      
      {/* Checklist Modal */}
      {checklistModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Checklist for {selectedProject}</h2>
              <button 
                onClick={() => setChecklistModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <ul className="space-y-4">
                {checklistNotes.length === 0 ? (
                  <li className="text-gray-500 text-center py-8">No notes for this project.</li>
                ) : (
                  checklistNotes.map(note => (
                    <li key={note._id || note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <select
                          value={notesStatus[note._id || note.id] || 'Ongoing'}
                          onChange={(e) => handleStatusChange(note._id || note.id, e.target.value)}
                          className="form-select text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Ongoing">🔄 Ongoing</option>
                          <option value="Completed">✅ Completed</option>
                        </select>
                        {notesStatus[note._id || note.id] === 'Completed' && (
                          <button
                            onClick={() => handleDeleteNote(note._id || note.id)}
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                          >
                            🗑️ Send to Trash
                          </button>
                        )}
                      </div>
                      
                      {editingNote === (note._id || note.id) ? (
                        <input
                          type="text"
                          defaultValue={note.title}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onBlur={(e) => handleEditNote(note._id || note.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditNote(note._id || note.id, e.target.value);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className={`block w-full cursor-pointer ${note.completed ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}
                          onClick={() => setEditingNote(note._id || note.id)}
                        >
                          {note.title}
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setChecklistModalOpen(false)} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Node Modal */}
      {individualNodeModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {individualNodeModal.type === 'note' ? 'Note Details' : 'Person Details'}
              </h2>
              <button 
                onClick={() => setIndividualNodeModal({ open: false, node: null, type: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {individualNodeModal.type === 'note' && (() => {
              const note = individualNodeModal.node?.data;

              // Save note edits (title, desc, status)
              const handleSaveEdit = async () => {
                setEditLoading(true);
                setEditError('');
                try {
                  await handleIndividualNodeEdit(individualNodeModal.node.id, {
                    title: editTitle,
                    description: editDesc,
                    status: editStatus
                  });
                  setEditMode(false);
                } catch (e) {
                  setEditError('Failed to save changes');
                }
                setEditLoading(false);
              };

              // Comment delete handler
              const handleDeleteComment = async (commentId) => {
                try {
                  await deleteMindmapComment(note.noteId, commentId);
                  // Remove comment from local state for instant update
                  setNoteComments(prev => prev.filter(c => c._id !== commentId));
                } catch (e) {
                  alert('Failed to delete comment');
                }
              };

              // Comment edit handler
              const handleEditComment = async (commentId) => {
                try {
                  const updated = await editMindmapComment(note.noteId, commentId, editingCommentText);
                  // Update comment in local state for instant update
                  setNoteComments(prev => prev.map(c => c._id === commentId ? { ...c, comment_text: editingCommentText } : c));
                  setEditingCommentId(null);
                  setEditingCommentText('');
                } catch (e) {
                  alert('Failed to edit comment');
                }
              };

              return (
                <div className="space-y-8">
                  {/* Title, Description, Status - editable */}
                  <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
                    {editMode ? (
                      <>
                        <input
                          className="w-full px-4 py-2 border border-blue-400 rounded-lg text-xl font-semibold mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          disabled={editLoading}
                          placeholder="Title"
                        />
                        <textarea
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          rows={3}
                          disabled={editLoading}
                          placeholder="Description"
                        />
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status-select">Status</label>
                          <select
                            id="status-select"
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            disabled={editLoading}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200"
                            disabled={editLoading}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                            disabled={editLoading}
                          >
                            Cancel
                          </button>
                        </div>
                        {editError && <div className="text-red-500 mt-2 text-sm">{editError}</div>}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold text-blue-900 flex-1">{note.label}</h3>
                          {!note.trashed && (
                            <button
                              onClick={() => setEditMode(true)}
                              className="ml-2 text-blue-500 hover:text-blue-700 text-sm underline"
                            >Edit</button>
                          )}
                        </div>
                        <p className="mb-2 text-gray-700 whitespace-pre-line text-base">{note.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium text-gray-700">Status:</span>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${note.status === 'Completed' ? 'bg-green-100 text-green-700' : note.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>{note.status}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-blue-800 text-lg">Comments</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-blue-50 rounded-lg p-3 border border-blue-100">
                      {noteCommentsLoading ? (
                        <div className="text-gray-500">Loading comments...</div>
                      ) : noteCommentsError ? (
                        <div className="text-red-500">{noteCommentsError}</div>
                      ) : noteComments.length === 0 ? (
                        <div className="text-gray-400 italic">No comments yet.</div>
                      ) : (
                        <ul className="mb-2 space-y-1">
                          {noteComments.map(c => (
                            <li key={c._id} className="flex items-start gap-2 group">
                              <span className="font-semibold text-blue-900">{c.author_name}:</span>
                              {editingCommentId === c._id ? (
                                <>
                                  <input
                                    className="border border-blue-300 rounded px-2 py-1 text-sm"
                                    value={editingCommentText}
                                    onChange={e => setEditingCommentText(e.target.value)}
                                    autoFocus
                                  />
                                  <button
                                    className="text-green-600 text-xs ml-1"
                                    onClick={() => handleEditComment(c._id)}
                                  >Save</button>
                                  <button
                                    className="text-gray-500 text-xs ml-1"
                                    onClick={() => setEditingCommentId(null)}
                                  >Cancel</button>
                                </>
                              ) : (
                                <>
                                  <span className="text-gray-800">{c.comment_text}</span>
                                  {c.author_email === (sessionStorage.getItem('email') || '') && (
                                    <>
                                      <button
                                        className="text-blue-500 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => { setEditingCommentId(c._id); setEditingCommentText(c.comment_text); }}
                                      >Edit</button>
                                      <button
                                        className="text-red-500 text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteComment(c._id)}
                                      >Delete</button>
                                    </>
                                  )}
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <AddMindmapCommentForm
                      noteId={note.noteId}
                      onCommentAdded={comment => setNoteComments([...noteComments, comment])}
                    />
                  </div>

                  {/* Send to Trash button, only if not trashed */}
                  {!note.trashed && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          moveNoteToTrash(note.noteId)
                            .then(() => {
                              setIndividualNodeModal({ open: false, node: null, type: null });
                              // Optionally refetch notes or update state here
                            })
                            .catch(err => alert('Failed to move to trash'));
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        🗑️ Send to Trash
                      </button>
                      <button
                        onClick={() => setIndividualNodeModal({ open: false, node: null, type: null })}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  )}
                  {/* If trashed, only show Close button */}
                  {note.trashed && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setIndividualNodeModal({ open: false, node: null, type: null })}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {individualNodeModal.type === 'person' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    defaultValue={individualNodeModal.node.data.label}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Projects</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    {individualNodeModal.node.data.project || 'No specific project assigned'}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setIndividualNodeModal({ open: false, node: null, type: null })}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}