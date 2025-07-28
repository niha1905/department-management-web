import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MoreVertical, Phone, Video, Info, Paperclip, Smile, Mic, MicOff, Edit3, Check, X, StickyNote, Users } from 'lucide-react';
import { fetchUsers, sendMessage, fetchMessages, fetchChatRooms, createChatRoom } from '../services/api';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import { useNotes } from '../context/NotesContext';
// import socketService from '../services/socket';


// --- Waveform Visualizer ---
const WaveformVisualizer = ({ isRecording, audioContext, analyser }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = 'rgb(239, 246, 255)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgb(59, 130, 246)');
        gradient.addColorStop(1, 'rgb(147, 197, 253)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyser]);

  if (!isRecording) return null;

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-700">Recording...</span>
        </div>
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          className="flex-1 rounded"
        />
      </div>
    </div>
  );
};

// --- Transcript Editor Modal ---
const TranscriptEditor = ({ isOpen, transcript, onSave, onCancel, isLoading }) => {
  const [editedText, setEditedText] = useState(transcript);
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditedText(transcript);
  }, [transcript]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedText.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Edit Transcribed Text</h3>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Edit the transcribed text before sending. Press Ctrl+Enter to save or Escape to cancel.
          </p>
        </div>
        <div className="flex-1 p-4">
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Edit your transcribed text here..."
            disabled={isLoading}
          />
          <div className="mt-2 text-xs text-gray-500">
            {editedText.length} characters
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editedText.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Text Preview Modal ---
const TextPreviewModal = ({ isOpen, text, onExtractNotes, onCancel, sourceInfo }) => {
  const [selectedText, setSelectedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedText(text);
    }
  }, [isOpen, text]);

  const handleExtractNotes = async () => {
    if (!selectedText.trim()) return;
    
    setIsExtracting(true);
    try {
      await onExtractNotes(selectedText);
    } catch (error) {
      console.error('Error extracting notes:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedText(text);
  };

  const handleClearSelection = () => {
    setSelectedText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <StickyNote className="w-5 h-5 text-blue-600" />
              <span>Preview Text for Notes</span>
            </h3>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Review and select the text content you want to extract notes from.
            {sourceInfo && (
              <span className="block mt-1 text-xs text-blue-600">
                Source: {sourceInfo}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex-1 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleClearSelection}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Clear Selection
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {selectedText.length} characters selected
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              placeholder="Select the text content you want to extract notes from..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isExtracting}
          >
            Cancel
          </button>
          <button
            onClick={handleExtractNotes}
            disabled={!selectedText.trim() || isExtracting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <StickyNote className="w-4 h-4" />
                <span>Extract Notes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Notes Preview Modal ---
const NotesPreviewModal = ({ isOpen, notes, isLoading, onSave, onCancel, onEditNote, sourceData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <StickyNote className="w-5 h-5 text-blue-600" />
              <span>Extracted Notes Preview</span>
            </h3>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Review the AI-extracted notes below. You can edit them before saving.
            {window.extractedNotesContext?.chatSources && (
              <span className="block mt-1 text-xs text-blue-600">
                Extracted from {window.extractedNotesContext.chatSources.length} conversation{window.extractedNotesContext.chatSources.length !== 1 ? 's' : ''}
              </span>
            )}
            {window.extractedNotesContext?.chatSource && (
              <span className="block mt-1 text-xs text-blue-600">
                Extracted from conversation with {window.extractedNotesContext.chatSource.name}
                {window.extractedNotesContext.selectedMessages && (
                  <span> • {window.extractedNotesContext.selectedMessages} selected message{window.extractedNotesContext.selectedMessages !== 1 ? 's' : ''}</span>
                )}
              </span>
            )}
            {sourceData?.duplicateCount > 0 && (
              <span className="block mt-1 text-xs text-orange-600">
                ⚠️ {sourceData.duplicateCount} duplicate{sourceData.duplicateCount !== 1 ? 's' : ''} filtered out
              </span>
            )}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Extracting notes from message...</p>
              </div>
            </div>
          ) : notes && notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          note.type === 'project' ? 'bg-purple-100 text-purple-700' :
                          note.type === 'discussion' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {note.type}
                        </span>
                        <span className={`w-3 h-3 rounded-full ${
                          note.color === 'red' ? 'bg-red-400' :
                          note.color === 'green' ? 'bg-green-400' :
                          note.color === 'yellow' ? 'bg-yellow-400' :
                          note.color === 'purple' ? 'bg-purple-400' :
                          'bg-blue-400'
                        }`}></span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{note.description}</p>
                      {note.deadline && (
                        <p className="text-xs text-gray-500">
                          Deadline: {new Date(note.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag, tagIndex) => (
                            <span key={tag + '-' + tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onEditNote(index, note)}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No actionable notes found in this message.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isLoading || !notes || notes.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <StickyNote className="w-4 h-4" />
            <span>
              Save {notes ? notes.length : 0} Note{notes && notes.length !== 1 ? 's' : ''}
              {sourceData?.duplicateCount > 0 && (
                <span className="text-xs opacity-75">
                  {' '}({sourceData.duplicateCount} duplicate{sourceData.duplicateCount !== 1 ? 's' : ''} filtered)
                </span>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChats, setSelectedChats] = useState([]); // Multiple selected chats
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState({}); // Messages for all selected chats
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [useSpeechRec, setUseSpeechRec] = useState(false); // Toggle for using speech recognition
  const [recordingMode, setRecordingMode] = useState(false); // true = recording, false = not
  const [selectedMessages, setSelectedMessages] = useState(new Set()); // Selected messages for notes extraction
  const [messageSelectionMode, setMessageSelectionMode] = useState(false); // Toggle for message selection mode
  const [chatSelectionMode, setChatSelectionMode] = useState(false); // Toggle for chat selection mode
  const [showTextPreview, setShowTextPreview] = useState(false); // Text preview modal
  const [previewText, setPreviewText] = useState(''); // Text to preview
  const [previewSourceInfo, setPreviewSourceInfo] = useState(''); // Source information for preview
  
  // Notes extraction from context
  const { 
    extractNotesFromMessage, 
    extractedNotes, 
    showNotesModal: showNotesPreview, 
    isExtractingNotes,
    saveExtractedNotes,
    cancelNotesExtraction,
    updateExtractedNote,
    sourceData
  } = useNotes();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const streamRef = useRef(null);

  const currentUser = {
    email: sessionStorage.getItem('email'),
    name: sessionStorage.getItem('name'),
    role: sessionStorage.getItem('role')
  };

  const {
    transcript: liveTranscript,
    isListening: isSpeechListening,
    error: speechError,
    startListening: startSpeechListening,
    stopListening: stopSpeechListening
  } = useLiveTranscription({
    language: 'en-US',
    onResult: (text) => setRecordedText(text)
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadUsers();
    loadChatRooms();
    const interval = setInterval(() => {
      if (selectedChat) {
        loadMessages(selectedChat.id);
      }
    }, 3000);

    // --- SOCKET.IO: Listen for new messages and online users ---
    // socketService.connect();
    // const handleChatMessage = (data) => {
    //   if (selectedChat && data.chatId === selectedChat.id) {
    //     setMessages(prev => [...prev, data.message]);
    //   }
    // };
    // const handleOnlineUsers = (data) => {
    //   setOnlineUsers(new Set(data.onlineUsers));
    // };
    // socketService.on('chat_message', handleChatMessage);
    // socketService.on('chat_online_users', handleOnlineUsers);

    if (selectedChat) {
      // socketService.emit('join_chat', { chatId: selectedChat.id, user: currentUser.email });
    }

    return () => {
      clearInterval(interval);
      // socketService.off('chat_message');
      // socketService.off('chat_online_users');
      if (selectedChat) {
        // socketService.emit('leave_chat', { chatId: selectedChat.id, user: currentUser.email });
      }
    };
  }, [selectedChat, currentUser.email]);

  const loadUsers = async () => {
    try {
      const response = await fetchUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadChatRooms = async () => {
    try {
      const rooms = await fetchChatRooms();
      setChatRooms(rooms || []);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const chatMessages = await fetchMessages(chatId);
      setMessages(chatMessages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      setLoading(true);
      let existingRoom = chatRooms.find(room =>
        room.participants.includes(user.email) &&
        room.participants.includes(currentUser.email) &&
        room.participants.length === 2
      );
      if (!existingRoom) {
        existingRoom = await createChatRoom([currentUser.email, user.email], 'direct');
        setChatRooms(prev => [...prev, existingRoom]);
      }
      
      const chatInfo = {
        id: existingRoom._id,
        name: user.name,
        email: user.email,
        type: 'direct',
        avatar: user.avatar || null,
        isOnline: onlineUsers.has(user.email)
      };
      
      if (chatSelectionMode) {
        // Add to chat selection for notes
        setSelectedChats(prev => {
          const exists = prev.find(chat => chat.id === chatInfo.id);
          if (exists) {
            return prev.filter(chat => chat.id !== chatInfo.id);
          } else {
            return [...prev, chatInfo];
          }
        });
        // Load messages for this chat
        await loadMessagesForChat(existingRoom._id);
      } else {
        // Single chat mode
        setSelectedChat(chatInfo);
        setSelectedChats([]);
        await loadMessages(existingRoom._id);
      }
    } catch (error) {
      console.error('Failed to select user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForChat = async (chatId) => {
    try {
      const chatMessages = await fetchMessages(chatId);
      setAllMessages(prev => ({
        ...prev,
        [chatId]: chatMessages || []
      }));
    } catch (error) {
      console.error('Failed to load messages for chat:', error);
    }
  };

  const handleChatSelectionToggle = () => {
    setChatSelectionMode(!chatSelectionMode);
    if (chatSelectionMode) {
      // Exiting chat selection mode, clear selections
      setSelectedChats([]);
      setAllMessages({});
    }
  };

  const removeChatFromSelection = (chatId) => {
    setSelectedChats(prev => prev.filter(chat => chat.id !== chatId));
    setAllMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[chatId];
      return newMessages;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageToSend = newMessage.trim();
    if (!messageToSend) return;
    
    if (chatSelectionMode) {
      if (selectedChats.length === 0) return;
      await sendMessageToAllSelectedChats(messageToSend);
    } else {
      if (!selectedChat) return;
      await sendMessageToChat(messageToSend);
    }
  };

  const sendMessageToChat = async (messageContent, targetChatId = null) => {
    const chatId = targetChatId || (selectedChat?.id);
    if (!messageContent || !chatId) return;
    
    try {
      setIsSendingMessage(true);
      const messageData = {
        chatId: chatId,
        content: messageContent,
        sender: currentUser.email,
        senderName: currentUser.name,
        type: 'text'
      };
      const sentMessage = await sendMessage(messageData);
      
      if (chatSelectionMode) {
        // Update messages for the specific chat
        setAllMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), sentMessage]
        }));
      } else {
        // Single chat mode
        setMessages(prev => [...prev, sentMessage]);
      }
      
      setNewMessage('');
      setRecordedText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const sendMessageToAllSelectedChats = async (messageContent) => {
    if (!messageContent || selectedChats.length === 0) return;
    
    try {
      setIsSendingMessage(true);
      const promises = selectedChats.map(chat => 
        sendMessageToChat(messageContent, chat.id)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to send message to all chats:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // --- AUDIO RECORDING AND TRANSCRIPTION LOGIC ---
  // Toggle-based recording for paragraph/long speech
  const handleRecordToggle = () => {
    if (!recordingMode) {
      setRecordedText('');
      setShowTranscriptEditor(false);
      setRecordingMode(true);
      startSpeechListening();
    } else {
      stopSpeechListening();
      setRecordingMode(false);
      setShowTranscriptEditor(true);
    }
  };

  const handleTranscriptSave = async (editedText) => {
    setShowTranscriptEditor(false);
    await sendMessageToChat(editedText);
  };

  const handleTranscriptCancel = () => {
    setShowTranscriptEditor(false);
    setRecordedText('');
  };

  // --- NOTES EXTRACTION LOGIC ---
  const handleMakeNotes = async (message) => {
    try {
      setPreviewText(message.content);
      setPreviewSourceInfo(`Message from ${message.senderName || message.sender} at ${formatTime(message.timestamp)}`);
      setShowTextPreview(true);
    } catch (error) {
      console.error('Error preparing text preview:', error);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const result = await saveExtractedNotes();
      if (result.success) {
        // Show success message with details
        let message = `Successfully saved ${result.savedCount} note${result.savedCount !== 1 ? 's' : ''}`;
        if (result.duplicateCount > 0) {
          message += ` (${result.duplicateCount} duplicate${result.duplicateCount !== 1 ? 's' : ''} skipped)`;
        }
        // You could add a toast notification here
        console.log(message);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleCancelNotes = () => {
    cancelNotesExtraction();
  };

  const handleEditNote = (index, updatedNote) => {
    updateExtractedNote(index, updatedNote);
  };

  const handleMakeNotesFromAllChats = async () => {
    if (selectedChats.length === 0) return;
    
    try {
      // Collect all messages from all selected chats
      const allMessagesFromChats = [];
      
      selectedChats.forEach(chat => {
        const chatMessages = allMessages[chat.id] || [];
        chatMessages.forEach(message => {
          allMessagesFromChats.push({
            ...message,
            chatName: chat.name,
            chatEmail: chat.email
          });
        });
      });
      
      if (allMessagesFromChats.length === 0) {
        alert('No messages found in selected chats to extract notes from.');
        return;
      }
      
      // Combine all messages into a single text for AI processing
      const combinedText = allMessagesFromChats
        .map(msg => `[${msg.chatName} - ${formatTime(msg.timestamp)}]: ${msg.content}`)
        .join('\n\n');
      
      setPreviewText(combinedText);
      setPreviewSourceInfo(`${selectedChats.length} conversation${selectedChats.length !== 1 ? 's' : ''} with ${allMessagesFromChats.length} total messages`);
      setShowTextPreview(true);
    } catch (error) {
      console.error('Error preparing text preview:', error);
    }
  };

  const handleMakeNotesFromSelectedChat = async (chatId) => {
    const chat = selectedChats.find(c => c.id === chatId);
    const chatMessages = allMessages[chatId] || [];
    
    if (chatMessages.length === 0) {
      alert(`No messages found in conversation with ${chat.name}.`);
      return;
    }
    
    try {
      // Combine messages from this specific chat
      const combinedText = chatMessages
        .map(msg => `[${formatTime(msg.timestamp)}]: ${msg.content}`)
        .join('\n\n');
      
      setPreviewText(combinedText);
      setPreviewSourceInfo(`Conversation with ${chat.name} (${chatMessages.length} messages)`);
      setShowTextPreview(true);
    } catch (error) {
      console.error('Error preparing text preview:', error);
    }
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleMessageSelectionMode = () => {
    setMessageSelectionMode(!messageSelectionMode);
    if (messageSelectionMode) {
      // Exiting selection mode, clear selections
      setSelectedMessages(new Set());
    }
  };

  const handleMakeNotesFromSelectedMessages = async () => {
    if (selectedMessages.size === 0) {
      alert('Please select at least one message to extract notes from.');
      return;
    }
    
    try {
      // Get selected messages
      const selectedMessageObjects = messages.filter(msg => 
        selectedMessages.has(msg._id || msg.timestamp + msg.sender)
      );
      
      if (selectedMessageObjects.length === 0) {
        alert('No valid messages found in selection.');
        return;
      }
      
      // Combine selected messages
      const combinedText = selectedMessageObjects
        .map(msg => `[${msg.senderName || msg.sender} - ${formatTime(msg.timestamp)}]: ${msg.content}`)
        .join('\n\n');
      
      setPreviewText(combinedText);
      setPreviewSourceInfo(`${selectedMessageObjects.length} selected message${selectedMessageObjects.length !== 1 ? 's' : ''} from conversation with ${selectedChat.name}`);
      setShowTextPreview(true);
      
      // Clear selection after showing preview
      setSelectedMessages(new Set());
      setMessageSelectionMode(false);
    } catch (error) {
      console.error('Error preparing text preview:', error);
    }
  };

  const clearMessageSelection = () => {
    setSelectedMessages(new Set());
    setMessageSelectionMode(false);
  };

  const handleTextPreviewExtractNotes = async (selectedText) => {
    try {
      // Create a mock message object with the selected text
      const message = {
        content: selectedText,
        sender: 'system',
        senderName: 'Text Preview',
        timestamp: new Date().toISOString()
      };
      
      await extractNotesFromMessage(message);
      setShowTextPreview(false);
    } catch (error) {
      console.error('Error extracting notes from text preview:', error);
    }
  };

  const handleTextPreviewCancel = () => {
    setShowTextPreview(false);
    setPreviewText('');
    setPreviewSourceInfo('');
  };

  const filteredUsers = users.filter(user =>
    user.email !== currentUser.email &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex bg-white">
      {/* Sidebar - Users List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
            <button
              onClick={handleChatSelectionToggle}
              className={`p-2 rounded-lg transition-colors ${
                chatSelectionMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={chatSelectionMode ? 'Exit Chat Selection' : 'Select Chats for Notes'}
            >
              <StickyNote className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {chatSelectionMode && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">
                Chat selection mode: Click users to add/remove from notes selection
              </p>
              {selectedChats.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Selected: {selectedChats.length} chat{selectedChats.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.email}
              onClick={() => handleUserSelect(user)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                chatSelectionMode 
                  ? selectedChats.find(chat => chat.email === user.email) 
                    ? 'bg-green-50 border-green-200' 
                    : ''
                  : selectedChat?.email === user.email 
                    ? 'bg-blue-50 border-blue-200' 
                    : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.has(user.email) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role} • {user.department}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {chatSelectionMode && selectedChats.length > 0 ? (
          // Chat selection mode with selected chats
          <div className="flex-1 flex flex-col">
            {/* Chat selection header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    <StickyNote className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Notes from Multiple Chats</h2>
                    <p className="text-sm text-gray-500">
                      {selectedChats.length} conversation{selectedChats.length !== 1 ? 's' : ''} selected for notes extraction
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMakeNotesFromAllChats}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                    title="Extract notes from all selected conversations"
                    disabled={isExtractingNotes || selectedChats.length === 0}
                  >
                    <StickyNote className="w-4 h-4" />
                    <span className="text-sm font-medium">Extract Notes</span>
                  </button>
                  <button
                    onClick={handleChatSelectionToggle}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Exit chat selection"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Selected chats preview */}
            <div className="flex-1 overflow-y-auto p-4">
              {isExtractingNotes && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Extracting notes from conversations...</p>
                      <p className="text-xs text-blue-600">Analyzing {selectedChats.length} chat{selectedChats.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedChats.map((chat) => (
                  <div key={chat.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {chat.name.charAt(0).toUpperCase()}
                          </div>
                          {chat.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{chat.name}</h3>
                          <p className="text-xs text-gray-500">{chat.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMakeNotesFromSelectedChat(chat.id)}
                          className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={`Extract notes from conversation with ${chat.name}`}
                          disabled={isExtractingNotes}
                        >
                          <StickyNote className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeChatFromSelection(chat.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove from selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Messages for this chat */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(allMessages[chat.id] || []).slice(-5).map((message, index) => {
                        const isOwnMessage = message.sender === currentUser.email;
                        return (
                          <div key={message._id || index} className="text-xs">
                            <div className={`max-w-full px-2 py-1 rounded ${
                              isOwnMessage
                                ? 'bg-blue-100 text-blue-900 ml-4'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="truncate">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {(!allMessages[chat.id] || allMessages[chat.id].length === 0) && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : chatSelectionMode ? (
          // Chat selection mode with no chats selected
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <StickyNote className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select conversations for notes</h3>
              <p className="text-gray-500">Choose users from the sidebar to extract notes from their conversations</p>
            </div>
          </div>
        ) : (
          // Single chat mode
          selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </div>
                      {selectedChat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h2>
                      <p className="text-sm text-gray-500">
                        {selectedChat.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {messageSelectionMode && (
                      <>
                        <button
                          onClick={handleMakeNotesFromSelectedMessages}
                          disabled={selectedMessages.size === 0 || isExtractingNotes}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Extract notes from ${selectedMessages.size} selected message${selectedMessages.size !== 1 ? 's' : ''}`}
                        >
                          <StickyNote className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Make Notes ({selectedMessages.size})
                          </span>
                        </button>
                        <button
                          onClick={clearMessageSelection}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Clear selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={toggleMessageSelectionMode}
                      className={`p-2 rounded-lg transition-colors ${
                        messageSelectionMode
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title={messageSelectionMode ? 'Exit selection mode' : 'Select messages for notes'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Info className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender === currentUser.email;
                  const showDate = index === 0 ||
                    formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                  return (
                    <div key={message._id || index}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } ${messageSelectionMode ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={messageSelectionMode ? () => toggleMessageSelection(message._id || message.timestamp + message.sender) : undefined}
                        >
                          {messageSelectionMode && (
                            <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedMessages.has(message._id || message.timestamp + message.sender)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300'
                            }`}>
                              {selectedMessages.has(message._id || message.timestamp + message.sender) && (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          )}
                          {!isOwnMessage && (
                            <p className="text-xs font-medium mb-1 text-gray-600">
                              {message.senderName}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {/* Make Notes Button - only show when not in selection mode */}
                        {!messageSelectionMode && (
                          <button
                            onClick={() => handleMakeNotes(message)}
                            className="mt-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center space-x-1"
                            title="Extract notes from this message"
                            disabled={isExtractingNotes}
                          >
                            <StickyNote className="w-3 h-3" />
                            <span>Make Notes</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className={`p-2 rounded-lg transition-colors ${
                      recordingMode
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={handleRecordToggle}
                    title={recordingMode ? 'Stop Recording' : 'Start Recording'}
                    disabled={isTranscribing}
                  >
                    {recordingMode ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      id="chat-message-input"
                      name="chat-message"
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isTranscribing ? "Transcribing..." : "Type a message..."}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      disabled={isRecording || isTranscribing}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
                <WaveformVisualizer
                  isRecording={isRecording}
                  audioContext={audioContext}
                  analyser={analyser}
                />
                {isTranscribing && (
                  <div className="mt-2 flex items-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Transcribing with Whisper...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-500">Select a user from the sidebar to start chatting</p>
              </div>
            </div>
          )
        )}
      </div>
      <TranscriptEditor
        isOpen={showTranscriptEditor}
        transcript={recordedText}
        onSave={handleTranscriptSave}
        onCancel={handleTranscriptCancel}
        isLoading={isSendingMessage}
      />
      <TextPreviewModal
        isOpen={showTextPreview}
        text={previewText}
        onExtractNotes={handleTextPreviewExtractNotes}
        onCancel={handleTextPreviewCancel}
        sourceInfo={previewSourceInfo}
      />
      <NotesPreviewModal
        isOpen={showNotesPreview}
        notes={extractedNotes}
        isLoading={isExtractingNotes}
        onSave={handleSaveNotes}
        onCancel={handleCancelNotes}
        onEditNote={handleEditNote}
        sourceData={sourceData}
      />
    </div>
  );
}
