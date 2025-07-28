import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileText, FilesIcon, ChevronDown, Check } from 'lucide-react';

const AddNotesButton = ({ 
  onClick, 
  onAddAll,
  notesCount, 
  className = "",
  disabled = false,
  alreadyAdded = false // New prop to indicate if notes were already added
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If there's only one note, just show a simple button
  if (notesCount === 1) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(0); // Pass the index 0 for the single note
        }}
        disabled={disabled}
        className={`${
          alreadyAdded 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        } ${className}`}
      >
        {alreadyAdded ? (
          <>
            <Check size={18} />
            <span>Already Added</span>
          </>
        ) : (
          <>
            <Plus size={18} />
            <span>Add to Notes</span>
          </>
        )}
      </button>
    );
  }

  // For multiple notes, show a dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className={`${
          alreadyAdded 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        } ${className}`}
      >
        {alreadyAdded ? (
          <>
            <Check size={18} />
            <span>Already Added</span>
          </>
        ) : (
          <>
            <Plus size={18} />
            <span>Add Notes</span>
          </>
        )}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onAddAll();
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100"
            >
              <FilesIcon size={16} className="text-blue-600" />
              <span>Add All Notes ({notesCount})</span>
            </button>
            
            <div className="px-4 py-2 text-xs text-gray-500">Or add individual note:</div>
            
            <div className="max-h-64 overflow-y-auto">
              {Array.from({ length: notesCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onClick(index);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText size={16} className="text-gray-500" />
                  <span>Note {index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNotesButton;
