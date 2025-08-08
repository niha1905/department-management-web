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
  'from-green-400 via-emerald-500 to-blue-500',
  'from-pink-400 via-fuchsia-500 to-purple-600',
  'from-yellow-400 via-amber-500 to-red-500',
  'from-teal-400 via-cyan-500 to-blue-500',
  'from-indigo-400 via-violet-500 to-blue-700',
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
            'absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300',
            node.completed ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse-gentle' : 'bg-gray-200 hover:bg-gradient-to-r hover:from-blue-300 hover:to-indigo-400'
          )}
          onClick={e => { e.stopPropagation(); onComplete && onComplete(node); }}
          title={node.completed ? 'Completed' : 'Mark as complete'}
        >
          {node.completed && <Check className="w-4 h-4 text-white animate-fadeIn" />}
        </button>
      )}
      {/* Main Node */}
      <div
        className={cn(
          'relative rounded-full border-4 border-white/80 cursor-pointer transition-all duration-500 flex flex-col items-center justify-center',
          'bg-gradient-to-br backdrop-blur-sm animate-fadeIn',
          colorClass,
          isHovered ? 'scale-110 ring-4 ring-blue-300 shadow-2xl shadow-indigo-500/30' : 'shadow-xl'
        )}
        style={{ width: nodeSize, height: nodeSize }}
        onClick={() => hasChildren && onToggle(node.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <IconComponent className={cn(
          "w-10 h-10 text-white mb-1 transition-transform duration-300",
          isHovered ? "scale-110" : ""
        )} />
        <div className="text-center text-white font-bold text-base drop-shadow-md">{node.title}</div>
        {hasChildren && (
          <div className="absolute -bottom-3 right-1/2 translate-x-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-lg hover:border-indigo-300">
            {isExpanded ? 
              <ChevronDown className="w-4 h-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600" /> : 
              <ChevronRight className="w-4 h-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600" />
            }
          </div>
        )}
        {/* Status dropdown and comment for task nodes */}
        {node.icon === "target" && (
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 w-56 z-30 border border-indigo-100 animate-fadeIn">
            <div className="mb-2">
              <label className="block text-xs font-semibold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Status:</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)} 
                className="w-full border border-indigo-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all duration-300"
              >
                <option value="incomplete">Incomplete</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs font-semibold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Comment:</label>
              <input 
                type="text" 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                className="w-full border border-indigo-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all duration-300" 
                placeholder="Add comment..." 
              />
            </div>
            {/* You can add a button to save/update status/comment if needed */}
          </div>
        )}
      </div>
      {/* Description Tooltip */}
      {node.description && isHovered && (
        <div className="absolute top-full mt-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-indigo-100 max-w-xs z-20 animate-expand">
          <p className="text-sm text-gray-700 leading-relaxed">{node.description}</p>
        </div>
      )}
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex items-center justify-center mt-8 animate-fadeIn">
          <div className="flex flex-wrap gap-8">
            {node.children.map((child, idx) => (
              <div
                key={child.id}
                ref={childRefs ? el => (childRefs.current[idx] = el) : null}
                className="animate-fadeIn"
                style={{ animationDelay: `${idx * 100}ms` }}
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