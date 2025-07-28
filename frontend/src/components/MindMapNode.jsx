import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Brain, Lightbulb, Target, Rocket, Users, Zap } from 'lucide-react';

// Utility for className joining (if you don't have a cn function)
function cn(...args) {
  return args.filter(Boolean).join(' ');
}

const iconMap = {
  brain: Brain,
  lightbulb: Lightbulb,
  target: Target,
  rocket: Rocket,
  users: Users,
  zap: Zap,
};

const nodeColors = [
  'from-green-400 to-blue-500',
  'from-pink-400 to-purple-500',
  'from-yellow-400 to-red-500',
  'from-teal-400 to-cyan-500',
  'from-indigo-400 to-blue-700',
];

export function MindMapNode({ node, isExpanded, onToggle, level = 0, expanded, onComplete, childRefs }) {
  const [isHovered, setIsHovered] = useState(false);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(node.status || "incomplete");
  const hasChildren = node.children && node.children.length > 0;
  const IconComponent = node.icon ? iconMap[node.icon] || Brain : Brain;
  const colorClass = nodeColors[level % nodeColors.length];
  const nodeSize = level === 0 ? 130 : 110;

  return (
    <div className="relative flex flex-col items-center">
      {/* Checkbox for non-root nodes */}
      {node.id !== 'root' && (
        <button
          className={cn(
            'absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors duration-300',
            node.completed ? 'bg-green-400 animate-pulse' : 'bg-gray-200 hover:bg-blue-300'
          )}
          onClick={e => { e.stopPropagation(); onComplete && onComplete(node); }}
          title={node.completed ? 'Completed' : 'Mark as complete'}
        >
          {node.completed && <Check className="w-4 h-4 text-white" />}
        </button>
      )}
      {/* Main Node */}
      <div
        className={cn(
          'relative rounded-full border-4 border-white cursor-pointer transition-all duration-500 flex flex-col items-center justify-center shadow-xl',
          'bg-gradient-to-br',
          colorClass,
          isHovered ? 'scale-110 ring-4 ring-blue-300' : ''
        )}
        style={{ width: nodeSize, height: nodeSize }}
        onClick={() => hasChildren && onToggle(node.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <IconComponent className="w-10 h-10 text-white mb-1" />
        <div className="text-center text-white font-bold text-base">{node.title}</div>
        {hasChildren && (
          <div className="absolute -bottom-3 right-1/2 translate-x-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
          </div>
        )}
        {/* Status dropdown and comment for task nodes */}
        {node.icon === "target" && (
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-3 w-56 z-30 border">
            <div className="mb-2">
              <label className="block text-xs font-semibold mb-1">Status:</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded px-2 py-1">
                <option value="incomplete">Incomplete</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs font-semibold mb-1">Comment:</label>
              <input type="text" value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Add comment..." />
            </div>
            {/* You can add a button to save/update status/comment if needed */}
          </div>
        )}
      </div>
      {/* Description Tooltip */}
      {node.description && isHovered && (
        <div className="absolute top-full mt-4 bg-white/95 rounded-lg p-3 shadow-xl border max-w-xs z-20 animate-expand">
          <p className="text-sm text-gray-700">{node.description}</p>
        </div>
      )}
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex items-center justify-center mt-8">
          <div className="flex flex-wrap gap-8">
            {node.children.map((child, idx) => (
              <div
                key={child.id}
                ref={childRefs ? el => (childRefs.current[idx] = el) : null}
              >
                <MindMapNode
                  node={child}
                  isExpanded={!!(expanded && expanded[child.id])}
                  onToggle={onToggle}
                  level={level + 1}
                  expanded={expanded}
                  onComplete={onComplete}
                  childRefs={childRefs}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}