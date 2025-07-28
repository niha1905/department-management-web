import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import HierarchicalMindmap from '../components/mindmap2/HierarchicalMindMap';
import { Users, FolderOpen } from 'lucide-react';

export default function HierarchicalMindmapPage() {
  const [viewType, setViewType] = useState('people');

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Hierarchical Mindmap</h1>
        <Tabs defaultValue="people" onValueChange={setViewType} className="w-full">
          <TabsList className="grid grid-cols-2 w-80">
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              People → Projects
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Projects → People
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people" className="h-[calc(100vh-180px)]">
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <HierarchicalMindmap viewType="people" />
            </div>
          </TabsContent>
          <TabsContent value="projects" className="h-[calc(100vh-180px)]">
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <HierarchicalMindmap viewType="projects" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}