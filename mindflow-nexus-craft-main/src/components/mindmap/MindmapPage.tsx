import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { RootNode } from './nodes/RootNode';
import { BranchNode } from './nodes/BranchNode';
import { ContentNode } from './nodes/ContentNode';
import { AddNodeButton } from './nodes/AddNodeButton';
import { NodeFormModal } from './modals/NodeFormModal';
import { initialNodes, initialEdges } from './mindmapData';
import { NodeData, NodeType } from './types';

const nodeTypes = {
  root: RootNode,
  branch: BranchNode,
  content: ContentNode,
  addButton: AddNodeButton,
};

export default function MindmapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    type: NodeType;
    parentId: string;
    nodeId?: string;
    data?: NodeData;
  } | null>(null);

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

  const createNode = useCallback((data: NodeData, type: NodeType, parentId: string) => {
    const nodeId = `${Date.now()}`;
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    // Calculate position based on parent and existing children
    const childrenCount = nodes.filter(n => 
      edges.some(e => e.source === parentId && e.target === n.id)
    ).length;
    
    const baseY = parentNode.position.y + 150;
    const baseX = parentNode.position.x + (childrenCount * 250) - (childrenCount * 125);

    const newNode = {
      id: nodeId,
      type: 'content',
      position: { x: baseX, y: baseY },
      data: { ...data, nodeType: type },
    };

    const newEdge = {
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: 'smoothstep',
      className: 'mindmap-edge',
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setIsModalOpen(false);
    setModalData(null);
  }, [nodes, edges, setNodes, setEdges]);

  const updateNode = useCallback((nodeId: string, data: NodeData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
    setIsModalOpen(false);
    setModalData(null);
  }, [setNodes]);


  return (
    <div className="mindmap-container w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
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

      <NodeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalData(null);
        }}
        onSubmit={(data) => {
          if (modalData?.nodeId) {
            updateNode(modalData.nodeId, data);
          } else if (modalData?.parentId) {
            createNode(data, modalData.type, modalData.parentId);
          }
        }}
        type={modalData?.type || 'project'}
        initialData={modalData?.data}
      />
    </div>
  );
}