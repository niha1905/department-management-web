import React from "react";
import {
  MoreVertical,
  Check,
  Edit,
  Star,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  Clock,
  UserCheck,
  ClipboardPenLine,
} from "lucide-react";
import { canEditNote } from "../services/api";
import ColorPicker from "./ColorPicker";

const NoteCard = ({
  note,
  colorMap,
  openDropdownId,
  toggleDropdown,
  handleAction,
  startEditNote,
  updateNoteColor,
  formatDeadline,
  formatDate,
  openNoteDetail,
}) => {
  // Get user info from session storage
  const userEmail = sessionStorage.getItem("email");

  // Check if user can edit this note
  const canEdit = canEditNote(note);

  // Check if this note was created by current user
  const isCreator = note.created_by === userEmail;

  return (
    <div
      key={note._id}
      className={`bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.08)] transition-all duration-200 border border-gray-100 flex flex-col ${
        note.completed ? "opacity-75" : ""
      } ${note.priority ? "ring-2 ring-amber-400/50" : ""}`}
      onClick={() => openNoteDetail(note)}
    >
      <div
        className={`p-5 shadow-sm rounded-t-lg ${colorMap[
          note.color || "blue"
        ].replace("text-", "border-")} flex-1`}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-gray-800">
            <span className="line-clamp-1">
            {note.title}
            </span>
          <div>
            {note.completed && (
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Completed
              </span>
            )}
            {note.priority && (
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Priority
              </span>
            )}
            {note.in_trash && (
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Trash
              </span>
            )}
            {isCreator && (
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Created by me
              </span>
            )}
            </div>
          </h3>

          <div className="relative">
            <button
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown(note._id);
              }}
            >
              <MoreVertical size={18} />
            </button>

            {openDropdownId === note._id && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <ul className="py-1">
                  <li>
                    <button
                      onClick={(e) => handleAction("complete", note._id, e)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-200"
                    >
                      <Check size={16} className="mr-2.5 text-green-500" />
                      {note.completed
                        ? "Mark as Incomplete"
                        : "Mark as Completed"}
                    </button>
                  </li>

                  {canEdit && (
                    <li>
                      <button
                        onClick={(e) => startEditNote(note, e)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-200"
                      >
                        <Edit size={16} className="mr-2.5 text-blue-500" />
                        Edit Note
                      </button>
                    </li>
                  )}

                  <li>
                    <button
                      onClick={(e) => handleAction("prioritize", note._id, e)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-200"
                    >
                      <Star size={16} className="mr-2.5 text-amber-500" />
                      {note.priority ? "Remove Priority" : "Prioritize"}
                    </button>
                  </li>



                  {canEdit && (
                    <ColorPicker
                      colorMap={colorMap}
                      onSelectColor={updateNoteColor}
                      noteId={note._id}
                    />
                  )}

                  {note.in_trash ? (
                    <>
                      {canEdit && (
                        <li>
                          <button
                            onClick={(e) =>
                              handleAction("restore", note._id, e)
                            }
                            className="flex items-center px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 w-full text-left transition-colors duration-200"
                          >
                            <Check size={16} className="mr-2.5" />
                            Restore
                          </button>
                        </li>
                      )}
                      {canEdit && (
                        <li>
                          <button
                            onClick={(e) =>
                              handleAction("permanent-delete", note._id, e)
                            }
                            className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-200"
                          >
                            <Trash2 size={16} className="mr-2.5" />
                            Delete Permanently
                          </button>
                        </li>
                      )}
                    </>
                  ) : (
                    canEdit && (
                      <li>
                        <button
                          onClick={(e) => handleAction("delete", note._id, e)}
                          className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-200"
                        >
                          <Trash2 size={16} className="mr-2.5" />
                          Move to Trash
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 h-[4.5rem] overflow-hidden">
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {note.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Source and Type indicators */}
          <div className="mt-3 flex items-center gap-2">
            {/* Source indicator */}
            <div className="flex items-center text-xs">
              {note.source === 'mic' ? (
                <MessageSquare size={12} className="mr-1 text-blue-500" title="Voice/Mic" />
              ) : note.source === 'chat' ? (
                <MessageSquare size={12} className="mr-1 text-green-500" title="Chat" />
              ) : note.source === 'calendar' ? (
                <Calendar size={12} className="mr-1 text-purple-500" title="Calendar" />
              ) : (
                <ClipboardPenLine size={12} className="mr-1 text-gray-500" title="Manual" />
              )}
              <span className="text-gray-600">
                {note.source === 'mic' ? 'Voice' : 
                 note.source === 'chat' ? 'Chat' : 
                 note.source === 'calendar' ? 'Calendar' : 'Manual'}
              </span>
            </div>
            
            {/* Type indicator */}
            <div className="flex items-center text-xs">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                note.type === 'project' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {note.type === 'project' ? 'Project' : 'Daily Work'}
              </span>
            </div>
          </div>
          
          {/* Creator info */}
          <div className="mt-3 flex items-center text-xs text-gray-600 justify-end">
            <User size={12} className="mr-1" />
            <span>
              {note.created_by_name || note.created_by || "Unknown"}
              {isCreator && (
                <span className="ml-1 font-medium text-blue-500">(You)</span>
              )}
            </span>
          </div>

          {/* Last editor info when different from creator */}
          {note.last_editor && note.last_editor !== note.created_by && (
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <Clock size={14} className="mr-1.5" />
              <span>{note.last_editor_name || note.last_editor}</span>
            </div>
          )}




          {/* Deadline display */}
          {note.deadline && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <Calendar size={14} className="mr-1.5" />
              <span
                className={`${
                  note.deadline && new Date(note.deadline) < new Date()
                    ? "text-red-500 font-medium"
                    : ""
                }`}
              >
                {formatDeadline(note.deadline)}
              </span>
            </div>
          )}

          {/* Comment count */}
          {note.comments && note.comments.length > 0 && (
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <MessageSquare size={14} className="mr-1.5" />
              <span>
                {note.comments.length} comment
                {note.comments.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 py-3.5 rounded-b-lg bg-gray-50/50 flex justify-between items-center">
        <div className="flex flex-wrap gap-1.5">
          {note.tags &&
            note.tags.slice(0,3).map((tag, idx) => (
              <span
                key={tag + '-' + idx}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  tag === note.type 
                    ? (note.type === 'project' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200')
                    : colorMap[note.color || "blue"] + " bg-opacity-10"
                }`}
              >
                {tag}
              </span>
            ))}
            {
              note.tags && note.tags.length > 3 ? <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white bg-black">{note.tags.length-3}+</span> : null
            }
        </div>
        <span className="text-xs text-gray-500">
          {note.updated_at ? formatDate(note.updated_at) : ""}
        </span>
      </div>
    </div>
  );
};

export default NoteCard;
