import React, { useCallback, useState, useEffect } from 'react';
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
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { NodeFormModal } from './modals/NodeFormModal';

export const nodeTypes = {
  root: RootNode,
  branch: BranchNode,
  content: ContentNode,
};

export const customNodeTypes = {
  ...nodeTypes,
  content: (props) => {
    const { id, data } = props;
    return <ContentNode {...props} />;
  },
};
export const branchNodeTypes = {
  root: RootNode,
  branch: BranchNode,
};
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

const FIXED_ROOT = {
  id: 'root',
  type: 'root',
  position: { x: 400, y: 50 },
  data: { label: 'grandmagnum', nodeType: 'root', gradient: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' },
};

function buildNodesAndEdgesFromFlat(flatNodes) {
  // Show all nodes, connect to their actual parentId if present, else to root
  const nodes = [FIXED_ROOT];
  const edges: Edge[] = [];
  // Map for quick lookup
  const nodeIds = new Set(['root']);
  flatNodes.forEach(n => nodeIds.add(n.id));
  flatNodes.forEach((n, idx) => {
    nodes.push({
      id: n.id,
      type: 'content',
      position: { x: 400 + idx * 180 - (flatNodes.length-1)*90, y: 250 + (idx % 3) * 120 },
      data: {
        ...n,
        label: n.title || n.label || 'Node',
        nodeType: n.nodeType || 'content',
        gradient: n.gradient || colorPalette[idx % colorPalette.length],
      },
    });
    // Connect to actual parent if present in nodeIds, else to root
    const parentId = n.parentId && nodeIds.has(n.parentId) ? n.parentId : 'root';
    edges.push({
      id: `e-${parentId}-${n.id}`,
      source: parentId,
      target: n.id,
      type: 'straight',
      style: { stroke: '#000', strokeWidth: 4 },
      className: 'mindmap-edge',
    });
  });
  return { nodes, edges };
}

export default function RealEstateMindmapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, unknown>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  type NodeType = 'root' | 'branch' | 'content'; // Add this type definition above or here

  const [modalData, setModalData] = useState<{
    type: NodeType;
    parentId: string;
    nodeId?: string;
    data?: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load nodes from backend
  const loadMindmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/real_estate_mindmap/all');
      const data = await res.json();
      const { nodes: loadedNodes, edges: loadedEdges } = buildNodesAndEdgesFromFlat(data.nodes);
      setNodes(loadedNodes);
      setEdges(loadedEdges);
    } catch (err) {
      setNodes([FIXED_ROOT]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadMindmap();
  }, [loadMindmap]);

  // Save new child node to backend
  const handleSubmit = async (data: any) => {
    if (modalData?.nodeId) {
      // Editing not implemented for now
      setIsModalOpen(false);
      return;
    }
    // Only send fields that are filled in the form
    const payload: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        payload[key] = data[key];
      }
    });
    // Assign a gradient color for the new node
    const allChildrenCount = nodes.length;
    payload.gradient = colorPalette[allChildrenCount % colorPalette.length];
    // Ensure parentId is set correctly
    if (modalData?.parentId) {
      payload.parentId = modalData.parentId;
    } else {
      payload.parentId = 'root'; // fallback to root if not specified
    }
    try {
      await fetch('/api/real_estate_mindmap/add_child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await loadMindmap();
    } catch (err) {
      // Optionally show error
    }
    setIsModalOpen(false);
  };

  // Edit node in backend
  const handleEditNode = async (nodeId: string, updatedData: Record<string, any>) => {
    // Only send fields that are filled in the form
    const payload: Record<string, any> = {};
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] !== undefined && updatedData[key] !== null && updatedData[key] !== '') {
        payload[key] = updatedData[key];
      }
    });
    payload.id = nodeId;
    try {
      await fetch('/api/real_estate_mindmap/add_child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await loadMindmap();
    } catch (err) {
      // Optionally show error
    }
  };

  // Delete node in backend
  const handleDeleteNode = async (nodeId) => {
    try {
      await fetch(`/api/real_estate_mindmap/delete_child/${nodeId}`, {
        method: 'DELETE',
      });
      await loadMindmap();
    } catch (err) {
      // Optionally show error
    }
  };

  // Event listeners for node actions
  useEffect(() => {
    const handleAddNodeEvent = (event: CustomEvent) => {
      // Ensure parentId is the id of the node where 'Add Child' was triggered
      const { type, parentId } = event.detail;
      // If parentId is missing, fallback to 'root'
      setModalData({ type, parentId: parentId || 'root' });
      setIsModalOpen(true);
    };
    const handleEditNodeEvent = (event: CustomEvent) => {
      const { id, data } = event.detail;
      setModalData({ type: data.nodeType, parentId: data.parentId, nodeId: id, data });
      setIsModalOpen(true);
    };
    const handleDeleteNodeEvent = (event: CustomEvent) => {
      const { id } = event.detail;
      handleDeleteNode(id);
    };
    window.addEventListener('addNode', handleAddNodeEvent as EventListener);
    window.addEventListener('editNode', handleEditNodeEvent as EventListener);
    window.addEventListener('deleteNode', handleDeleteNodeEvent as EventListener);
    return () => {
      window.removeEventListener('addNode', handleAddNodeEvent as EventListener);
      window.removeEventListener('editNode', handleEditNodeEvent as EventListener);
      window.removeEventListener('deleteNode', handleDeleteNodeEvent as EventListener);
    };
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="mindmap-container w-screen h-screen" style={{ background: "#fff" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={customNodeTypes}
        fitView
        className="w-full h-full"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          color="e5e7eb" // gray-200
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
          onSubmit={async (data) => {
            if (modalData?.nodeId) {
              await handleEditNode(modalData.nodeId, data);
            } else if (modalData) {
              await handleSubmit(data);
            }
            setIsModalOpen(false);
          }}
          type={modalData?.type}
          initialData={{ ...modalData?.data, parentId: modalData?.parentId }}
        />
      </div>
    </div>
  );
}