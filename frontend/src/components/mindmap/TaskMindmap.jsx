import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  addEdge,
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
import { NodeFormModal } from './modals/NodeFormModal';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchNotes, getProjects, fetchPeople } from '../../services/api';

const nodeTypes = {
  root: RootNode,
  branch: BranchNode,
  content: ContentNode,
};

export default function TaskMindmap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [expanded, setExpanded] = useState({ root: true });
  const [loading, setLoading] = useState(true);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projectsRes, peopleRes, notesRes] = await Promise.all([
          getProjects(),
          fetchPeople(),
          fetchNotes({}, 'active'),
        ]);

        const projects = projectsRes.projects || [];
        const people = peopleRes || [];
        const notes = notesRes || [];

        const nodes = [];
        const edges = [];

        nodes.push({
          id: 'root',
          type: 'root',
          position: { x: 0, y: 0 },
          data: { label: 'Projects', nodeType: 'root' },
        });

        let yOffset = 100;
        let projectIdx = 0;

        projects.forEach((project) => {
          const projectId = `project-${project._id}`;
          nodes.push({
            id: projectId,
            type: 'branch',
            position: { x: 250, y: yOffset + projectIdx * 300 },
            data: {
              label: project.name,
              nodeType: 'project',
              description: project.description,
            },
          });
          edges.push({ id: `e-root-${projectId}`, source: 'root', target: projectId });

          const assignedUsers = project.assigned_users || [];
          let personIdx = 0;
          
          // Update project node to indicate it has children if there are assigned users
          if (assignedUsers.length > 0) {
            const projectNode = nodes.find(n => n.id === projectId);
            if (projectNode) {
              projectNode.data.hasChildren = true;
              projectNode.data.expanded = true;
            }
          }

          assignedUsers.forEach((userEmail) => {
            const person = people.find((p) => p.email === userEmail || p.name === userEmail);
            const personName = person ? person.name : userEmail;
            const personId = `person-${project._id}-${userEmail}`;

            nodes.push({
              id: personId,
              type: 'branch',
              position: { x: 500, y: yOffset + projectIdx * 300 + personIdx * 150 },
              data: {
                label: personName,
                nodeType: 'person',
                project: project.name,
              },
            });
            edges.push({ id: `e-${projectId}-${personId}`, source: projectId, target: personId });

            const personNotes = notes.filter(
              (note) =>
                note.project_id === project._id &&
                (note.assigned_to?.includes(userEmail) || note.assigned_to?.includes(personName))
            );
            
            // Update person node to indicate it has children if there are notes
            if (personNotes.length > 0) {
              const personNode = nodes.find(n => n.id === personId);
              if (personNode) {
                personNode.data.hasChildren = true;
                personNode.data.expanded = true;
              }
            }

            personNotes.forEach((note, noteIdx) => {
              const noteId = `note-${note._id || note.id}`;
              nodes.push({
                id: noteId,
                type: 'content',
                position: {
                  x: 750,
                  y: yOffset + projectIdx * 300 + personIdx * 150 + noteIdx * 80,
                },
                data: {
                  label: note.title,
                  nodeType: 'note',
                  description: note.content || note.description,
                  status: note.completed ? 'Completed' : 'Not Completed',
                  comments: note.comments || [],
                  noteId: note._id || note.id,
                  completed: note.completed,
                },
              });
              edges.push({ id: `e-${personId}-${noteId}`, source: personId, target: noteId });
            });

            personIdx++;
          });

          // OPTIONAL: Add unassigned notes
          const unassignedNotes = notes.filter(
            (note) =>
              note.project_id === project._id &&
              (!note.assigned_to || note.assigned_to.length === 0)
          );

          if (unassignedNotes.length > 0) {
            const unassignedId = `unassigned-${project._id}`;
            nodes.push({
              id: unassignedId,
              type: 'branch',
              position: { x: 500, y: yOffset + projectIdx * 300 + personIdx * 150 },
              data: { label: 'Unassigned', nodeType: 'person' },
            });
            edges.push({
              id: `e-${projectId}-${unassignedId}`,
              source: projectId,
              target: unassignedId,
            });

            unassignedNotes.forEach((note, noteIdx) => {
              const noteId = `note-${note._id || note.id}`;
              nodes.push({
                id: noteId,
                type: 'content',
                position: {
                  x: 750,
                  y: yOffset + projectIdx * 300 + personIdx * 150 + noteIdx * 80,
                },
                data: {
                  label: note.title,
                  nodeType: 'note',
                  description: note.content || note.description,
                  status: note.completed ? 'Completed' : 'Not Completed',
                  comments: note.comments || [],
                  noteId: note._id || note.id,
                  completed: note.completed,
                },
              });
              edges.push({ id: `e-${unassignedId}-${noteId}`, source: unassignedId, target: noteId });
            });
          }

          projectIdx++;
        });

        setNodes(nodes);
        setEdges(edges);
      } catch (err) {
        console.error('Error loading mindmap data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggle = useCallback((nodeId) => {
    setExpanded((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
    setNodes((nds) => nds.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            expanded: !n.data.expanded,
            collapsed: !n.data.collapsed
          }
        };
      }
      return n;
    }));
  }, [setNodes]);

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

  const { visibleNodes, visibleEdges } = getVisibleNodesAndEdges();

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    const handleEditNode = (event) => {
      const { id, data } = event.detail;
      setModalData({ type: data.nodeType, parentId: '', nodeId: id, data });
      setIsModalOpen(true);
    };
    const handleDeleteNode = (event) => {
      const { id } = event.detail;
      deleteNode(id);
    };
    const handleToggleNode = (event) => {
      const { id } = event.detail;
      handleToggle(id);
    };
    
    window.addEventListener('editNode', handleEditNode);
    window.addEventListener('deleteNode', handleDeleteNode);
    window.addEventListener('toggleNode', handleToggleNode);
    
    return () => {
      window.removeEventListener('editNode', handleEditNode);
      window.removeEventListener('deleteNode', handleDeleteNode);
      window.removeEventListener('toggleNode', handleToggleNode);
    };
  }, [deleteNode, handleToggle]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const customNodeTypes = {
    ...nodeTypes,
    content: (props) => {
      const hasChildren = edges.some((e) => e.source === props.id);
      // Update the node's data to include hasChildren
      if (hasChildren !== props.data.hasChildren) {
        setNodes((nds) => nds.map(n => 
          n.id === props.id 
            ? { ...n, data: { ...n.data, hasChildren } }
            : n
        ));
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
                handleToggle(props.id);
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
                handleToggle(props.id);
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

  return (
    <div className="mindmap-container w-full h-[600px] relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-primary font-medium">Loading mindmap...</p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={customNodeTypes}
        fitView
        className="bg-background w-full h-full"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="hsl(var(--border))" gap={20} size={1} variant="dots" />
        <Controls position="bottom-right" />
        <MiniMap position="top-right" />
      </ReactFlow>
      <NodeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => setIsModalOpen(false)}
        type={modalData?.type}
        initialData={modalData?.data}
      />
    </div>
  );
}
