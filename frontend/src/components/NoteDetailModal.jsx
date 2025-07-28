import React, { useState, useRef, useEffect } from "react";
import { X, Calendar, User, Edit, MessageSquare, Send, Clock, MoreVertical, RotateCcw, ChevronDown, ChevronUp, Star, Trash2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addNoteComment, canEditNote, getNoteVersions, rollbackNote } from "../services/api";
import { cn, buttonVariants, textareaStyles } from "../utils/styles";
import Comment from "./Comment";

const NoteDetailModal = ({
  note,
  isOpen,
  onClose,
  colorMap,
  formatDeadline,
  handleAction,
  startEditNote,
  refreshNoteDetail,
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeComments, setActiveComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSubmittingRollback, setIsSubmittingRollback] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const modalRef = useRef(null);
  const commentInputRef = useRef(null);
  const menuRef = useRef(null);
  
  // New state to toggle between comments and version history
  const [activeTab, setActiveTab] = useState("comments"); // can be "comments" or "versions"

  const userName = sessionStorage.getItem("name") || "User";
  const userEmail = sessionStorage.getItem("email") || "";
  const userRole = sessionStorage.getItem("role");

  // Check if user can edit this note
  const canEdit = canEditNote(note);

  // Check if this note was created by current user
  const isCreator = note && note.created_by === userEmail;

  useEffect(() => {
    // Set active comments from note
    if (note && note.comments) {
      setActiveComments(note.comments);
    }
  }, [note]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && commentInputRef.current && activeTab === "comments") {
      commentInputRef.current.focus();
    }
  }, [isOpen, activeTab]);
  
  // Load versions when switching to version history tab
  useEffect(() => {
    if (activeTab === "versions" && note?._id && versions.length === 0) {
      loadVersions();
    }
  }, [activeTab, note?._id, versions.length]);

  // Load versions
  const loadVersions = async () => {
    if (!note || !note._id) return;
    
    setIsLoadingVersions(true);
    try {
      const fetchedVersions = await getNoteVersions(note._id);
      setVersions(fetchedVersions);
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Handle rollback to previous version
  const handleRollback = async (versionId) => {
    if (!canEdit) return;
    
    setIsSubmittingRollback(true);
    try {
      await rollbackNote(note._id, versionId);
      refreshNoteDetail();
      loadVersions(); // Refresh versions after rollback
    } catch (error) {
      console.error("Failed to rollback:", error);
    } finally {
      setIsSubmittingRollback(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addNoteComment(note._id, comment, userName, userEmail);
      setComment("");
      refreshNoteDetail(); // Refresh note data to get the new comment
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdated = () => {
    refreshNoteDetail(); // Refresh note data after comment update/delete/reply
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (!isOpen || !note) return null;

  // Filter top-level comments (comments with no parent_id)
  const topLevelComments = note.comments
    ? note.comments.filter((c) => !c.parent_id)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex"
        >
          {/* Note header */}
          <div
            className={`p-6 w-1/2 rounded-l-lg ${colorMap[note.color || "blue"].replace(
              "text-",
              "border-"
            )}`}
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {note.title}
                </h2>
                <div className="flex gap-2 mt-1.5">
                  {note.completed && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Completed
                    </span>
                  )}

                  {note.in_trash && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Trash
                    </span>
                  )}
                  {isCreator && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Created by me
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {/* Three dots menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-30 border border-gray-100 overflow-hidden">
                      <ul className="py-1 text-sm">
                        {canEdit && (
                          <li>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(false);
                                startEditNote(note, e);
                              }}
                              className="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                            >
                              <Edit size={16} className="mr-2.5 text-blue-500" />
                              Edit Note
                            </button>
                          </li>
                        )}
                        <li>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMenuOpen(false);
                              setActiveTab("versions"); // Switch to version history tab
                            }}
                            className="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                          >
                            <Clock size={16} className="mr-2.5 text-indigo-500" />
                            Version History
                          </button>
                        </li>

                        {canEdit && note.in_trash && (
                          <>
                            <li>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsMenuOpen(false);
                                  handleAction('restore', note._id, e);
                                  onClose();
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-green-600 hover:bg-green-50"
                              >
                                
                                Restore
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsMenuOpen(false);
                                  handleAction('permanent-delete', note._id, e);
                                  onClose();
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50"
                              >
                                Delete Permanently
                              </button>
                            </li>
                          </>
                        )}
                        {canEdit && !note.in_trash && (
                          <li>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(false);
                                handleAction('delete', note._id, e);
                                onClose();
                              }}
                              className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50"
                            >
                            <Trash2 size={16} className="mr-2.5" />

                              Move to Trash
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditNote(note, e);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <Edit size={18} className="text-gray-500" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Note details */}
            <div className="flex flex-col space-y-4">
              {/* Note description */}
              <div className="min-h-[80px] text-gray-700 whitespace-pre-wrap">
                {note.description}
              </div>
              
              {/* Creator info - make sure this is always displayed prominently */}
              {note.created_by && (
                <div className="flex items-center text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded-md">
                  <User size={16} className="mr-2" />
                  <span>
                    <span className="font-medium">Created by:</span> {note.created_by_name || note.created_by}
                    {isCreator && <span className="ml-2 text-blue-500 font-medium">(You)</span>}
                  </span>
                </div>
              )}

              {/* Last updated info */}
              {note.last_editor && (
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={14} className="mr-2" />
                  <span>
                    Last updated by {note.last_editor_name || note.last_editor} on {formatDate(note.updated_at)}
                  </span>
                </div>
              )}

              {/* Metadata: tags, assignment and deadline */}
              <div className="flex flex-wrap gap-3 pt-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {note.tags &&
                    note.tags.map((tag, idx) => (
                      <span
                        key={tag + '-' + idx}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          colorMap[note.color || "blue"]
                        } bg-opacity-10`}
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                {/* Spacer */}
                <div className="flex-grow"></div>



                {/* Deadline */}
                {note.deadline && (
                  <div className="flex items-center text-xs bg-gray-50 px-3 py-1.5 rounded-full">
                    <Calendar size={12} className="mr-1.5" />
                    <span
                      className={`${
                        note.deadline && new Date(note.deadline) < new Date()
                          ? "text-red-500 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {formatDeadline(note.deadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel - Comments or Version History */}
          <div className="flex-1 overflow-y-auto p-6 w-1/2">
            {/* Toggle tabs for Comments/History */}
            <div className="flex border-b border-gray-200 mb-4">
              <button 
                onClick={() => setActiveTab("comments")}
                className={`flex items-center py-2 px-4 ${
                  activeTab === "comments" 
                    ? "border-b-2 border-blue-600 text-blue-600 font-medium" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <MessageSquare size={18} className="mr-2" />
                Comments ({note.comments ? note.comments.length : 0})
              </button>
              <button 
                onClick={() => setActiveTab("versions")}
                className={`flex items-center py-2 px-4 ${
                  activeTab === "versions" 
                    ? "border-b-2 border-blue-600 text-blue-600 font-medium" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <History size={18} className="mr-2" />
                Version History
              </button>
            </div>

            {/* Comments View */}
            {activeTab === "comments" && (
              <>
                <div className="space-y-4 mb-6">
                  {topLevelComments && topLevelComments.length > 0 ? (
                    topLevelComments.map((comment) => (
                      <Comment
                        key={comment.id}
                        comment={comment}
                        noteId={note._id}
                        colorMap={colorMap}
                        onCommentUpdated={handleCommentUpdated}
                        currentUserEmail={userEmail}
                        allComments={note.comments || []}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <p>No comments yet</p>
                      <p className="text-sm mt-1">
                        Be the first to add a comment
                      </p>
                    </div>
                  )}
                </div>

                {/* Comment form */}
                <div className="p-6 border-t border-gray-100">
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <textarea
                      ref={commentInputRef}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className={cn(textareaStyles, "flex-grow")}
                      placeholder="Add a comment..."
                      rows="2"
                      disabled={isSubmitting}
                    />
                    <button
                      type="submit"
                      disabled={!comment.trim() || isSubmitting}
                      className={cn(
                        buttonVariants.primary,
                        "px-4 py-2 rounded-lg self-end",
                        (!comment.trim() || isSubmitting) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Sending
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Send size={16} className="mr-1.5" />
                          Send
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Version History View */}
            {activeTab === "versions" && (
              <div className="h-full">
                {isLoadingVersions ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading version history...</p>
                  </div>
                ) : versions.length > 0 ? (
                  <div className="space-y-4 pb-6">
                    {versions.map((version, index) => (
                      <div 
                        key={version.version_id || index}
                        className={`p-4 rounded-md ${
                          version.is_current 
                            ? 'bg-blue-50 border border-blue-100' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">
                              {version.editor_name || version.editor_email || 'Unknown'}
                              {version.is_current && <span className="ml-2 text-blue-600">(Current)</span>}
                            </p>
                            <p className="text-sm text-gray-500">{formatDate(version.timestamp)}</p>
                            
                            {version.rollback_comment && (
                              <p className="mt-2 text-sm italic text-gray-600">{version.rollback_comment}</p>
                            )}
                            
                            <div className="mt-3 bg-white/50 p-3 rounded-md border border-gray-100">
                              <p className="text-sm font-medium text-gray-700">
                                <span className="text-blue-700">Title:</span> {version.title}
                              </p>
                              {version.description && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    <span className="text-blue-700">Description:</span>
                                  </p>
                                  <p className="text-sm text-gray-600 line-clamp-3">
                                    {version.description}
                                  </p>
                                </div>
                              )}
                              
                              {version.tags && version.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {version.tags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className={`px-2 py-0.5 text-xs rounded-full ${
                                        colorMap[version.color || "blue"]
                                      }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Rollback button */}
                          {!version.is_current && canEdit && (
                            <button
                              onClick={() => handleRollback(version.version_id)}
                              disabled={isSubmittingRollback}
                              className={cn(
                                buttonVariants.secondary,
                                "flex items-center text-xs px-3 py-1.5",
                                isSubmittingRollback ? "opacity-50 cursor-not-allowed" : ""
                              )}
                            >
                              <RotateCcw size={12} className="mr-1.5" />
                              Restore Version
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <p>No version history found</p>
                    <p className="text-sm mt-1">
                      Version history will be recorded when changes are made
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NoteDetailModal;
