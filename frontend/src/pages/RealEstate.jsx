import React from 'react';
import RealEstateMindmapPage from '../components/mindmap/RealEstateMindmapPage';

export default function RealEstate() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-800">Real Estate</h1>
        <p className="text-gray-500 text-sm mt-1">Integrated Mindmap</p>
      </div>
      <div className="flex-1">
        <RealEstateMindmapPage />
      </div>
    </div>
  );
} 