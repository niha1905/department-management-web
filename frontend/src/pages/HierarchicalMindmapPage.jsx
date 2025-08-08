import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import HierarchicalMindmap from '../components/mindmap2/HierarchicalMindMap';
import { Users, FolderOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function HierarchicalMindmapPage() {
  const [viewType, setViewType] = useState('people');

  return (
    <div className="h-full flex flex-col w-full">
      <div className="mb-2">
        <PageHeader title="Hierarchical Mindmap" />
      </div>
      <div className="p-4 flex-1">
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