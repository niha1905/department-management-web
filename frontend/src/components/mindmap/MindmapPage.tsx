import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RootNode } from './nodes/RootNode';
import { BranchNode } from './nodes/BranchNode';
import { ContentNode } from './nodes/ContentNode';
import { NodeFormModal } from './modals/NodeFormModal';
import { initialNodes, initialEdges } from './mindmapData';
import { NodeData, NodeType } from './types';
import toast from 'react-hot-toast';
import socketService from '../../services/socket';
// Move nodeTypes outside the component to avoid React Flow warning
export const nodeTypes = {
  root: RootNode,
  branch: BranchNode,
  content: ContentNode,
};

export default function MindmapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, unknown>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    type: NodeType;
    parentId: string;
    nodeId?: string;
    data?: NodeData;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounce ref for autosave
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave function
  const autosave = (newNodes: Node<Record<string, unknown>>[]) => {
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(async () => {
      for (const node of newNodes) {
        await fetch('/api/mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(node),
        });
      }
      toast.success('Mindmap autosaved!');
    }, 500); // 500ms debounce
  };

  // Load mindmap from backend or use initialNodes/initialEdges
  useEffect(() => {
    async function loadMindmap() {
      setLoading(true);
      try {
        const res = await fetch('/api/mindmap/hierarchical/projects');
        const data = await res.json();
        if (data.mindmap && data.mindmap.length > 0) {
          setNodes(data.mindmap);
          setEdges(initialEdges); // You may want to store edges in DB for full persistence
        } else {
          setNodes(initialNodes);
          setEdges(initialEdges);
        }
      } catch (err) {
        setNodes(initialNodes);
        setEdges(initialEdges);
      } finally {
        setLoading(false);
      }
    }
    loadMindmap();
  }, [setNodes, setEdges]);

  // Wrap onNodesChange to trigger autosave
  const handleNodesChange = (changes: any) => {
    onNodesChange(changes);
    // Use the updated nodes after change
    setTimeout(() => autosave(nodes), 0); // nodes is updated after onNodesChange
  };

  // Save mindmap to backend
  const saveMindmap = async () => {
    for (const node of nodes) {
      await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
    }
    alert('Mindmap saved!');
  };

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]);

  // Event listeners for node actions
  useEffect(() => {
    const handleAddNode = (event: CustomEvent) => {
      const { type, parentId } = event.detail;
      setModalData({ type, parentId });
      setIsModalOpen(true);
    };

    const handleEditNode = (event: CustomEvent) => {
      const { id, data } = event.detail;
      setModalData({ type: data.nodeType, parentId: '', nodeId: id, data });
      setIsModalOpen(true);
    };

    const handleDeleteNode = (event: CustomEvent) => {
      const { id } = event.detail;
      deleteNode(id);
    };

    window.addEventListener('addNode', handleAddNode as EventListener);
    window.addEventListener('editNode', handleEditNode as EventListener);
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);

    return () => {
      window.removeEventListener('addNode', handleAddNode as EventListener);
      window.removeEventListener('editNode', handleEditNode as EventListener);
      window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
    };
  }, [deleteNode]);

  // Real-time socket event listeners
  useEffect(() => {
    socketService.connect();
    socketService.on('node_added', (node) => {
      setNodes((nds) => nds.some(n => n.id === node.id) ? nds : [...nds, node]);
      // Optionally add edge if not present
    });
    socketService.on('node_updated', (node) => {
      setNodes((nds) => nds.map(n => n.id === node.id ? node : n));
    });
    socketService.on('node_deleted', ({ id }) => {
      setNodes((nds) => nds.filter(n => n.id !== id));
      setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id));
    });
    return () => {
      socketService.off('node_added');
      socketService.off('node_updated');
      socketService.off('node_deleted');
    };
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback((type: NodeType, parentId: string) => {
    setModalData({ type, parentId });
    setIsModalOpen(true);
  }, []);

  const handleEditNode = useCallback((nodeId: string, type: NodeType, data: NodeData) => {
    setModalData({ type, parentId: '', nodeId, data });
    setIsModalOpen(true);
  }, []);

  const colorPalette = [
    'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
    'bg-gradient-to-r from-green-400 to-green-600 text-white',
    'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
    'bg-gradient-to-r from-purple-400 to-purple-600 text-white',
    'bg-gradient-to-r from-pink-400 to-pink-600 text-white',
    'bg-gradient-to-r from-red-400 to-red-600 text-white',
    'bg-gradient-to-r from-teal-400 to-teal-600 text-white',
    'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white',
  ];

  const createNode = useCallback((data: NodeData, type: NodeType, parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    console.log('createNode called with:', { data, type, parentId });
    // Calculate position based on parent and existing children
    const childrenCount = nodes.filter(n => 
      edges.some(e => e.source === parentId && e.target === n.id)
    ).length;
    const baseY = parentNode.position.y + 180 + childrenCount * 120;
    const baseX = parentNode.position.x + (childrenCount * 250) - (childrenCount * 125);
    const color = colorPalette[nodes.length % colorPalette.length];
    const nodeId = `${Date.now()}-${Math.floor(Math.random()*10000)}`;

    let newNode: Node<Record<string, any>>;
    if (data.nodeType === 'project') {
      newNode = {
        id: nodeId,
        type: 'branch',
        position: { x: baseX, y: baseY },
        data: {
          label: data.label,
          nodeType: 'project',
          gradient: color,
        },
      };
    } else if (data.nodeType === 'tasks' && data.tasks && Array.isArray(data.tasks)) {
      // If tasks, create a content node with tasks array
      newNode = {
        id: nodeId,
        type: 'content',
        position: { x: baseX, y: baseY },
        data: {
          label: data.label,
          nodeType: 'tasks',
          tasks: data.tasks,
          gradient: color,
        },
      };
    } else if (data.nodeType === 'status') {
      newNode = {
        id: nodeId,
        type: 'content',
        position: { x: baseX, y: baseY },
        data: {
          label: data.label,
          nodeType: 'status',
          status: data.status,
          comment: data.comment,
          gradient: color,
        },
      };
    } else if (data.nodeType === 'comment') {
      newNode = {
        id: nodeId,
        type: 'content',
        position: { x: baseX, y: baseY },
        data: {
          label: data.label,
          nodeType: 'comment',
          comment: data.comment,
          gradient: color,
        },
      };
    } else {
      // fallback
      newNode = {
        id: nodeId,
        type: 'content',
        position: { x: baseX, y: baseY },
        data: {
          label: data.label,
          nodeType: data.nodeType,
          gradient: color,
        },
      };
    }
    const newEdge: Edge = {
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: 'straight',
      style: { stroke: '#000', strokeWidth: 4 },
      className: 'mindmap-edge',
    };
    // Debug log
    console.log('Creating node:', newNode);
    // Optimistically update UI
    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    // Emit to backend for persistence and broadcast
    socketService.emit('add_node', newNode);
  }, [nodes, edges, colorPalette, setNodes, setEdges]);

  // Edit node logic
  const editNode = useCallback((nodeId: string, updatedData: NodeData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updatedData } } : n));
    const updatedNode = nodes.find(n => n.id === nodeId);
    if (updatedNode) {
      const newNode = { ...updatedNode, data: { ...updatedNode.data, ...updatedData } };
      socketService.emit('update_node', newNode);
    }
  }, [nodes, setNodes]);

  // Delete node logic
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    socketService.emit('delete_node', { id: nodeId });
  }, [setNodes, setEdges]);

  // Update event listeners for edit and delete
  useEffect(() => {
    socketService.connect();
    socketService.on('node_added', (node) => {
      setNodes((nds) => nds.some(n => n.id === node.id) ? nds : [...nds, node]);
    });
    socketService.on('node_updated', (node) => {
      setNodes((nds) => nds.map(n => n.id === node.id ? node : n));
    });
    socketService.on('node_deleted', ({ id }) => {
      setNodes((nds) => nds.filter(n => n.id !== id));
      setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id));
    });
    return () => {
      socketService.off('node_added');
      socketService.off('node_updated');
      socketService.off('node_deleted');
    };
  }, [setNodes, setEdges]);

  return (
    <div className="mindmap-container w-screen h-screen"> {/* Ensures full width and height */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background w-full h-full"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card border border-border rounded-lg shadow-lg"
        />
        <MiniMap 
          className="bg-card border border-border rounded-lg"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--muted) / 0.8)"
        />
      </ReactFlow>
      <div className="mindmap-controls">
        <NodeFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => {
            if (modalData?.nodeId) {
              editNode(modalData.nodeId, data);
            } else if (modalData?.parentId) {
              createNode(data, modalData.type, modalData.parentId);
            }
            setIsModalOpen(false);
          }}
          type={modalData?.type}
          initialData={modalData?.data}
        />
      </div>
    </div>
  );
}