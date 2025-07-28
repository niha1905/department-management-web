import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

const ColorPicker = ({ colorMap, onSelectColor, noteId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorPickerRef = useRef(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (colorName, e) => {
    e.stopPropagation();
    onSelectColor(noteId, colorName, e);
    setIsOpen(false);
  };

  return (
    <li className="relative" ref={colorPickerRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-200"
      >
        <Palette size={16} className="mr-2.5 text-indigo-500" />
        Change Color
      </button>
      
      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-100 p-3 overflow-hidden">
          <div className="grid grid-cols-5 gap-2.5">
            {Object.entries(colorMap).map(([colorName, colorClass]) => (
              <button 
                key={colorName}
                onClick={(e) => handleColorSelect(colorName, e)}
                className={`w-7 h-7 rounded-full ${colorClass.split(' ')[0]} hover:ring-2 hover:ring-offset-2 hover:ring-gray-300 transition-all duration-200 transform hover:scale-110`}
                title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
              />
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

export default ColorPicker;
