import React, { useState, useRef } from 'react';
import { Send, MoreVertical, Edit, Trash2, CheckSquare, Reply, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, buttonVariants, textareaStyles } from '../utils/styles';
import { updateComment, deleteComment, addNoteComment } from '../services/api';

const Comment = ({ 
  comment, 
  noteId, 
  colorMap, 
  onCommentUpdated, 
  depth = 0,
  currentUserEmail,
  allComments = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  
  const userName = sessionStorage.getItem('name') || 'User';
  const userEmail = sessionStorage.getItem('email') || '';
  
  const isAuthor = userEmail === comment.author_email;

  // Find replies to this comment from the flat list
  const replies = allComments.filter(c => c.parent_id === comment.id);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateComment(noteId, comment.id, { text: editText });
      setIsEditing(false);
      onCommentUpdated();
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    
    setIsSubmitting(true);
    try {
      console.log(`Submitting reply to comment ${comment.id}`);
      await addNoteComment(
        noteId, 
        replyText, 
        userName, 
        userEmail, 
        comment.id
      );
      setReplyText('');
      setShowReplyForm(false);
      onCommentUpdated();
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      await deleteComment(noteId, comment.id);
      onCommentUpdated();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const toggleCommentComplete = async () => {
    try {
      await updateComment(noteId, comment.id, { completed: !comment.completed });
      onCommentUpdated();
    } catch (error) {
      console.error('Failed to update comment status:', error);
    }
  };

  const updateCommentColor = async (color) => {
    try {
      await updateComment(noteId, comment.id, { color });
      setIsColorPickerOpen(false);
      setIsMenuOpen(false);
      onCommentUpdated();
    } catch (error) {
      console.error('Failed to update comment color:', error);
    }
  };

  // Max depth for nested comments to avoid excessive indentation
  const maxDepth = 5;
  const currentDepth = Math.min(depth, maxDepth);
  const indentMargin = currentDepth * 16;
  
  return (
    <div className="space-y-3">
      <div 
        className={`bg-white rounded-lg shadow-md ${comment.completed ? 'border-green-200 bg-green-50/40' : `border-${comment.color || 'gray'}-100`}`}
        style={{ marginLeft: indentMargin }}
      >
        {/* Comment header */}
        <div className={`px-4 py-2 flex justify-between items-center border-b ${comment.completed ? 'border-green-200' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {comment.author ? comment.author.substring(0, 2).toUpperCase() : 'AN'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{comment.author || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
            </div>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
            {comment.completed && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Completed
              </span>
            )}
          </div>
          
          {/* Comment menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors duration-200"
            >
              <MoreVertical size={16} />
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg z-30 border border-gray-100 overflow-hidden"
                >
                  <ul className="py-1 text-sm">
                    {isAuthor && (
                      <li>
                        <button 
                          onClick={() => { setIsMenuOpen(false); setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 100); }}
                          className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          <Edit size={14} className="mr-2 text-blue-500" />
                          Edit
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={() => { setIsMenuOpen(false); setShowReplyForm(true); }}
                        className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Reply size={14} className="mr-2 text-gray-500" />
                        Reply
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={toggleCommentComplete}
                        className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <CheckSquare size={14} className={`mr-2 ${comment.completed ? 'text-green-500' : 'text-gray-500'}`} />
                        {comment.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      </button>
                    </li>
                    {isAuthor && (
                      <>
                        <li>
                          <button
                            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                            className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            <Palette size={14} className="mr-2 text-indigo-500" />
                            Change Color
                          </button>
                          
                          {/* Color picker */}
                          {isColorPickerOpen && (
                            <div className="px-3 pb-2">
                              <div className="grid grid-cols-5 gap-1 mt-1">
                                {Object.entries(colorMap).map(([colorName, colorClass]) => (
                                  <button 
                                    key={colorName}
                                    onClick={() => updateCommentColor(colorName)}
                                    className={`w-5 h-5 rounded-full ${colorClass.split(' ')[0]} hover:ring-2 hover:ring-offset-1`}
                                    title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </li>
                        <li>
                          <button
                            onClick={() => { setIsMenuOpen(false); handleDeleteComment(); }}
                            className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Comment content */}
        <div className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={textareaStyles}
                rows="3"
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className={cn(
                    buttonVariants.secondary,
                    "px-3 py-1.5 text-xs rounded-lg"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editText.trim() || isSubmitting}
                  className={cn(
                    buttonVariants.primary,
                    "px-3 py-1.5 text-xs rounded-lg",
                    (!editText.trim() || isSubmitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
          )}
        </div>
      </div>
      
      {/* Reply form */}
      <AnimatePresence>
        {showReplyForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-8 bg-white rounded-lg shadow-md p-3"
            style={{ marginLeft: indentMargin + 16 }}
          >
            <div className="flex items-start gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={cn(textareaStyles, "flex-grow text-sm")}
                rows="2"
                placeholder="Write a reply..."
                disabled={isSubmitting}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || isSubmitting}
                  className={cn(
                    "p-1 rounded text-blue-600 hover:bg-blue-50",
                    (!replyText.trim() || isSubmitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Render replies recursively */}
      {replies.length > 0 && (
        <div className="space-y-3 mt-2">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              noteId={noteId}
              colorMap={colorMap}
              onCommentUpdated={onCommentUpdated}
              depth={depth + 1}
              currentUserEmail={currentUserEmail}
              allComments={allComments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
