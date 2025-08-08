import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Clock, Calendar, AlertTriangle, Check, CheckCheck, Trash2, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import notificationService from '../services/notificationService.jsx';

const NotificationModal = ({ isOpen, onClose, filterToday }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [soundEnabled, setSoundEnabled] = useState(notificationService.soundEnabled);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Get initial notifications
      setNotifications(notificationService.getNotifications());
      
      // Listen for updates
      const handleNotificationUpdate = (updatedNotifications) => {
        setNotifications([...updatedNotifications]);
      };
      
      notificationService.addListener(handleNotificationUpdate);
      
      return () => {
        notificationService.removeListener(handleNotificationUpdate);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter for today if requested
  let filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;
  if (filterToday) {
    const today = new Date();
    filteredNotifications = filteredNotifications.filter(n => {
      if (!n.timestamp) return false;
      const notifDate = new Date(n.timestamp);
      return notifDate.getFullYear() === today.getFullYear() &&
        notifDate.getMonth() === today.getMonth() &&
        notifDate.getDate() === today.getDate();
    });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    onClose();
  };

  const getNotificationIcon = (type, priority) => {
    if (priority) {
      return <AlertTriangle size={20} className="text-amber-500" />;
    }
    
    switch (type) {
      case 'note_deadline':
        return <Calendar size={20} className="text-blue-500" />;
      case 'ai_note_deadline':
        return <Clock size={20} className="text-purple-500" />;
      case 'chat_message':
        return <MessageCircle size={20} className="text-green-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getNotificationBgColor = (notification) => {
    if (!notification.read) {
      if (notification.priority) {
        return 'bg-amber-50 border-amber-200';
      }
      if (notification.type === 'chat_message') {
        return 'bg-green-50 border-green-200';
      }
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-white border-gray-200';
  };

  const toggleSound = () => {
    const newSoundState = notificationService.toggleSound();
    setSoundEnabled(newSoundState);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'chat_message') {
      // Open the specific chat
      notificationService.openChat(notification.chatId);
      onClose(); // Close the notification modal
    } else {
      // For other types, just mark as read
      handleMarkAsRead(notification.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16 px-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          ref={modalRef}
          className="bg-[var(--gm-white)] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-[var(--color-border)] max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--gm-white)]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-[var(--gm-aqua)]" />
                <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  title={soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
                >
                  {soundEnabled ? (
                    <Volume2 size={18} className="text-emerald-600" />
                  ) : (
                    <VolumeX size={18} className="text-gray-500" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-b border-[var(--color-border)] bg-gray-50">
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-[var(--gm-aqua)] hover:opacity-80 font-medium"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-gray-600 font-medium mb-2">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === 'unread' 
                    ? "You're all caught up!" 
                    : 'Deadline alerts will appear here'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${getNotificationBgColor(notification)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                    <div className="w-2 h-2 bg-[var(--gm-aqua)] rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          
                          {notification.priority && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Priority
                            </span>
                          )}
                          
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'note_deadline' 
                      ? 'bg-[var(--gm-aqua)]/15 text-[var(--gm-aqua)]' 
                              : notification.type === 'ai_note_deadline'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                          }`}>
                            {notification.type === 'note_deadline' ? 'Note' : 
                             notification.type === 'ai_note_deadline' ? 'AI Note' : 'Chat'}
                          </span>
                        </div>

                        {notification.deadline && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                            <Calendar size={12} />
                            <span>
                              Due: {new Date(notification.deadline).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NotificationModal;
