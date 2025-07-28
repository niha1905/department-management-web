import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const TagInput = ({ tags, setTags, placeholder = "Add tags..." }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus input when clicking on the container
  useEffect(() => {
    const handleContainerClick = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        inputRef.current?.focus();
      }
    };

    document.addEventListener('click', handleContainerClick);
    return () => document.removeEventListener('click', handleContainerClick);
  }, []);

  // Add a tag when pressing Enter, Tab, or comma
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      // Remove the last tag when pressing Backspace with empty input
      removeTag(tags[tags.length - 1]);
    }
  };

  // Add tag from input
  const addTag = () => {
    const trimmedInput = input.trim();
    
    // Process comma-separated values
    const newTags = trimmedInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    if (newTags.length > 0) {
      // Only add tags that don't already exist
      const uniqueNewTags = newTags.filter(tag => !tags.includes(tag));
      if (uniqueNewTags.length > 0) {
        setTags([...tags, ...uniqueNewTags]);
      }
      setInput('');
    }
  };

  // Handle paste event to add multiple tags at once
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedTags = pastedData
      .split(/[,\n]/)  // Split by commas or newlines
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
      
    if (pastedTags.length > 0) {
      const uniquePastedTags = pastedTags.filter(tag => !tags.includes(tag));
      if (uniquePastedTags.length > 0) {
        setTags([...tags, ...uniquePastedTags]);
      }
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-wrap gap-2 p-2 border rounded-md bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
    >
      {tags.map((tag, idx) => (
        <div 
          key={tag + '-' + idx} 
          className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
        >
          <span className="mr-1">{tag}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="text-blue-700 hover:text-blue-900 focus:outline-none"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        onPaste={handlePaste}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-grow outline-none min-w-[120px] text-sm"
      />
    </div>
  );
};

export default TagInput;
