export type NodeType = 'project' | 'tasks' | 'status' | 'comment';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  status?: string;
  comment?: string;
}

export interface NodeData {
  label: string;
  nodeType?: NodeType;
  tasks?: TaskItem[];
  status?: string;
  comment?: string;
  gradient?: string;
  icon?: string;
}

export interface MindmapNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}