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
    <div className={`flex border-b border-gray-200 ${className}`} {...props}>
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
      className={`px-4 py-2 font-medium text-sm transition-colors relative 
        ${isActive 
          ? 'text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-500 hover:text-gray-700'} 
        ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
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
