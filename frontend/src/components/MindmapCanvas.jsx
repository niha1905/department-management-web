import React from "react";

const MindmapCanvas = ({ tasksByDate, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
      <h2 className="font-semibold text-lg mb-4">Mind Map</h2>
      <div className="text-gray-500 text-center py-8">Mind map functionality coming soon!</div>
      <button onClick={onClose} className="mt-4 bg-gray-200 px-3 py-1 rounded">Close</button>
    </div>
  </div>
);

export default MindmapCanvas;
