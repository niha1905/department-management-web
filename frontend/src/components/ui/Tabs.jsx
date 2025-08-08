import React, { createContext, useContext, useState } from 'react';

// Create context for tabs
const TabsContext = createContext(null);

// Main Tabs container
export function Tabs({ defaultValue, className, children, onValueChange, ...props }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Handle tab change with callback
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// TabsList component (container for tab triggers)
export function TabsList({ className, children, ...props }) {
  return (
    <div className={`flex border-b border-gray-200 bg-white/5 backdrop-blur-sm rounded-t-xl p-1 shadow-lg ${className}`} {...props}>
      {children}
    </div>
  );
}

// TabsTrigger component (tab buttons)
export function TabsTrigger({ value, className, children, ...props }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={`px-5 py-2.5 font-medium text-sm transition-all duration-300 relative 
        ${isActive 
          ? 'text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-lg shadow-lg' 
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 rounded-t-lg'} 
        ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse"></span>
      )}
    </button>
  );
}

// TabsContent component (content shown when tab is active)
export function TabsContent({ value, className, children, ...props }) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
