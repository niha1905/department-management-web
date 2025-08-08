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
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { NodeFormModal } from './modals/NodeFormModal';

export const nodeTypes = {
  root: RootNode,
  branch: BranchNode,
  content: ContentNode,
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
  // Build a tree from flat nodes using parentId, defaulting to 'root'
  const nodes = [FIXED_ROOT];
  const edges: Edge[] = [];

  const nodeIdToNode = new Map<string, any>();
  flatNodes.forEach((n) => nodeIdToNode.set(n.id, n));

  // children map: parentId -> array of child ids
  const childrenMap = new Map<string, string[]>();
  const ensure = (id: string) => {
    if (!childrenMap.has(id)) childrenMap.set(id, []);
    return childrenMap.get(id)!;
  };

  // Attach nodes to their parent if parent exists, else attach to 'root'
  for (const n of flatNodes) {
    const parentId = n.parentId && nodeIdToNode.has(n.parentId) ? n.parentId : 'root';
    ensure(parentId).push(n.id);
  }

  // Compute leaf counts for tidy vertical spacing
  const leafCountCache = new Map<string, number>();
  const computeLeafCount = (id: string): number => {
    const children = childrenMap.get(id) || [];
    if (children.length === 0) {
      leafCountCache.set(id, 1);
      return 1;
    }
    let sum = 0;
    for (const childId of children) sum += computeLeafCount(childId);
    leafCountCache.set(id, sum);
    return sum;
  };
  computeLeafCount('root');

  // Assign positions: columns by depth (x), vertically spaced by subtree leaf counts (y)
  const xGap = 260;
  const yGap = 120;
  const positions = new Map<string, { x: number; y: number }>();
  positions.set('root', { ...FIXED_ROOT.position });

  const assignPositions = (parentId: string, depth: number, yCursorStart: number) => {
    const children = childrenMap.get(parentId) || [];
    let yCursor = yCursorStart;
    for (const childId of children) {
      const subtreeLeaves = leafCountCache.get(childId) || 1;
      const subTreeHeight = subtreeLeaves * yGap;
      const yCenter = yCursor + subTreeHeight / 2;
      positions.set(childId, {
        x: FIXED_ROOT.position.x + depth * xGap,
        y: yCenter,
      });
      // Layout this child's subtree starting from current yCursor
      assignPositions(childId, depth + 1, yCursor);
      // Advance cursor by the subtree height we just used
      yCursor += subTreeHeight;
    }
    return yCursor;
  };

  // Start laying out children below the root
  const initialYStart = FIXED_ROOT.position.y + 200;
  assignPositions('root', 1, initialYStart);

  // Build nodes and edges arrays
  for (const [id, raw] of nodeIdToNode) {
    const pos = positions.get(id) || { x: FIXED_ROOT.position.x + xGap, y: initialYStart };
    nodes.push({
      id,
      type: 'content',
      position: pos,
      data: {
        ...raw,
        label: raw.title || raw.label || 'Node',
        nodeType: raw.nodeType || 'content',
        gradient: raw.gradient || colorPalette[nodes.length % colorPalette.length],
      },
    });

    const parentId = raw.parentId && nodeIdToNode.has(raw.parentId) ? raw.parentId : 'root';
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: 'straight',
      style: { stroke: '#000', strokeWidth: 4 },
      className: 'mindmap-edge',
    });
  }

  return { nodes, edges };
}

export default function RealEstateMindmapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, unknown>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
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

  // Toggle expand/collapse handler (must be defined before effects that reference it)
  const handleToggle = useCallback((nodeId: string) => {
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
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              expanded: !n.data.expanded,
              collapsed: !n.data.collapsed,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Toggle expand/collapse via global event from node components
  useEffect(() => {
    const handleToggleNode = (event: CustomEvent) => {
      const { id } = event.detail || {};
      if (!id) return;
      handleToggle(id);
    };
    window.addEventListener('toggleNode', handleToggleNode as EventListener);
    return () => {
      window.removeEventListener('toggleNode', handleToggleNode as EventListener);
    };
  }, [handleToggle]);

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

  // Compute only visible nodes/edges based on expanded map
  const getVisibleNodesAndEdges = () => {
    const visibleNodes: Node<Record<string, unknown>>[] = [];
    const visibleEdges: Edge[] = [];
    const nodeMap: Record<string, Node<Record<string, unknown>>> = Object.fromEntries(nodes.map((n) => [n.id, n]));

    function dfs(nodeId: string) {
      const node = nodeMap[nodeId];
      if (!node) return;
      visibleNodes.push(node);
      if (expanded[nodeId] !== false) {
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            visibleEdges.push(edge);
            dfs(edge.target as string);
          }
        });
      }
    }

    dfs('root');
    return { visibleNodes, visibleEdges };
  };

  const { visibleNodes, visibleEdges } = getVisibleNodesAndEdges();

  // Node wrappers to add toggle buttons and propagate hasChildren
  const customNodeTypes = {
    ...nodeTypes,
    content: (props: any) => {
      const hasChildren = edges.some((e) => e.source === props.id);
      if (hasChildren !== props.data.hasChildren) {
        setNodes((nds) =>
          nds.map((n) => (n.id === props.id ? { ...n, data: { ...n.data, hasChildren } } : n))
        );
      }
      return <ContentNode {...props} />;
    },
    root: (props: any) => {
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
    branch: (props: any) => {
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

  return (
    <div className="mindmap-container w-screen h-screen" style={{ background: "#fff" }}>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
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