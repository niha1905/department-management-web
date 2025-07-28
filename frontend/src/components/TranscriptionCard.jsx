import React from "react";
import {
  MoreVertical,
  ClipboardPenLine,
  MessageSquare,
  ArrowUpRight,
  Trash2,
  Check,
  Calendar,
  Clock,
  Mic,
  Layout,
} from "lucide-react";

const TranscriptionCard = ({
  transcription,
  openDropdownId,
  toggleDropdown,
  handleAction,
  formatDate,
  openDetailModal,
}) => {
  // Get user info from session storage
  const userEmail = sessionStorage.getItem("email");

  // Check if this transcription was created by current user
  const isCreator = transcription.created_by === userEmail;

  // Get the first processed note for display
  const firstNote =
    transcription.processed_notes && transcription.processed_notes.length > 0
      ? transcription.processed_notes[0]
      : null;

  // Count total tasks/notes in this transcription
  const taskCount = transcription.processed_notes?.length || 0;

  // Determine the title and content to display
  const displayTitle =
    firstNote?.title ||
    `Transcription (${transcription.language_name || transcription.language})`;
  const displayContent =
    firstNote?.description || transcription.original_content || "";

  // Get tags for display
  const displayTags = firstNote?.tags || [
    "Transcription",
    transcription.language_name || transcription.language,
  ];

  // Get priority from the first note if available
  const priority = firstNote?.priority || false;

  // Get deadline if available
  const deadline = firstNote?.deadline || null;

  // Default color is blue
  const color = "blue";
  const colorMap = {
    blue: "text-blue-800 bg-blue-100 border-blue-500",
    green: "text-green-800 bg-green-100 border-green-500",
    red: "text-red-800 bg-red-100 border-red-500",
    purple: "text-purple-800 bg-purple-100 border-purple-500",
    yellow: "text-yellow-800 bg-yellow-100 border-yellow-500",
    pink: "text-pink-800 bg-pink-100 border-pink-500",
    indigo: "text-indigo-800 bg-indigo-100 border-indigo-500",
    orange: "text-orange-800 bg-orange-100 border-orange-500",
    teal: "text-teal-800 bg-teal-100 border-teal-500",
    gray: "text-gray-800 bg-gray-100 border-gray-500",
  };

  // Check if notes have already been added from this transcription
  const notesAlreadyAdded = transcription.notes_added === true;

  return (
    <div
      className={`bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.08)] 
        transition-all duration-200 border border-gray-100 flex flex-col
        ${priority ? "ring-2 ring-amber-400/50" : ""} cursor-pointer`}
      onClick={() => openDetailModal(transcription)}
    >
      <div className={`p-5 shadow-sm flex-1`}>
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-800">
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {transcription.language_name || transcription.language}
              </span>

              {/* NEW: Task count badge when multiple tasks detected */}
              {taskCount > 1 && (
                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <Layout size={12} className="mr-1" />
                  {taskCount} Tasks
                </span>
              )}

              {priority && (
                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Priority
                </span>
              )}
              {transcription.in_trash && (
                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Trash
                </span>
              )}
              {isCreator && (
                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Created by me
                </span>
              )}

              {/* Show badge when notes have already been added */}
              {notesAlreadyAdded && (
                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <Check size={12} className="mr-1" />
                  Added to Notes
                </span>
              )}
            </div>
          </h3>
           

          <div className="relative">
            <button
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown(transcription._id);
              }}
            >
              <MoreVertical size={18} />
            </button>

            {openDropdownId === transcription._id && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <ul className="py-1">
                  <li>
                    <button
                      onClick={(e) =>
                        handleAction("view", transcription._id, e)
                      }
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-200"
                    >
                      <ArrowUpRight
                        size={16}
                        className="mr-2.5 text-blue-500"
                      />
                      View Details
                    </button>
                  </li>

                  {/* Add to Notes button: only show if not in trash and not already added */}
                  {!transcription.in_trash && !notesAlreadyAdded && (
                    <li>
                      <button
                        onClick={(e) => handleAction("add-to-notes", transcription._id, e)}
                        className="flex items-center px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors duration-200"
                      >
                        <ClipboardPenLine size={16} className="mr-2.5 text-green-500" />
                        Add to Notes
                      </button>
                    </li>
                  )}

                  {transcription.in_trash ? (
                    <>
                      <li>
                        <button
                          onClick={(e) =>
                            handleAction("restore", transcription._id, e)
                          }
                          className="flex items-center px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 w-full text-left transition-colors duration-200"
                        >
                          <Check size={16} className="mr-2.5" />
                          Restore
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={(e) =>
                            handleAction(
                              "permanent-delete",
                              transcription._id,
                              e
                            )
                          }
                          className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-200"
                        >
                          <Trash2 size={16} className="mr-2.5" />
                          Delete Permanently
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button
                        onClick={(e) =>
                          handleAction("delete", transcription._id, e)
                        }
                        className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-200"
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
        </div>

        <div className="mt-3">
           {transcription.processed_notes.map((e, i) => (
              e.title !== ""  ? <h3 className="lineclamp-1 px-2 py-1 fornt-medium text-sm bg-gray-100 rounded-md my-1">{e.title }</h3>:""
            ))}
        </div>

        <div className="grid grid-cols-2">
          {/* Creator info */}
          <div className="mt-3 flex items-center text-xs text-gray-600">
            <ClipboardPenLine size={14} className="mr-1.5" />
            <span>
              {transcription.created_by_name ||
                transcription.created_by ||
                "Unknown"}
              {isCreator && (
                <span className="ml-1 font-medium text-blue-500">(You)</span>
              )}
            </span>
          </div>

          {/* Language info */}
          <div className="mt-3 flex items-center text-xs text-gray-600">
            <Mic size={14} className="mr-1.5" />
            <span>{transcription.language_name || transcription.language}</span>
          </div>

          {/* Enhanced AI Processing indicator */}
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Clock size={14} className="mr-1.5" />
            <span>AI Processed</span>
            {taskCount > 1 && (
              <span className="ml-1 text-green-600 font-medium">
                ({taskCount})
              </span>
            )}
          </div>

          {/* Notes count */}
          {transcription.processed_notes &&
            transcription.processed_notes.length > 0 && (
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <MessageSquare size={14} className="mr-1.5" />
                <span>
                  {transcription.processed_notes.length} note
                  {transcription.processed_notes.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

          {/* Deadline if available */}
          {deadline && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <Calendar size={14} className="mr-1.5" />
              <span>{deadline}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3.5 rounded-b-lg bg-gray-50/50 flex justify-between items-center">
        <div className="flex flex-wrap gap-1.5">
          {displayTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[
                color
              ]
                .split(" ")
                .slice(0, 2)
                .join(" ")} bg-opacity-10`}
            >
              {tag}
            </span>
          ))}
          {displayTags.length > 3 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white bg-black">
              {displayTags.length - 3}+
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {transcription.created_at ? formatDate(transcription.created_at) : ""}
        </span>
      </div>
    </div>
  );
};

export default TranscriptionCard;
