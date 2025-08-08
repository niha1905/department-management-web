import { fetchNotes, getTranscriptions } from './api';
import socketService from './socket';
import toast from 'react-hot-toast';

// Singleton service for deadline notifications (notes, AI notes) and chat notifications
class NotificationService {
  // Get unread chat messages count for a specific user (by email or userId)
  getUnreadCountForUser(userEmail) {
    return this.notifications.filter(
      n => n.type === 'chat_message' && !n.read && n.senderName === userEmail
    ).length;
  }
  constructor() {
    this.notifications = [];
    this.checkInterval = null;
    this.listeners = new Set();
    this.isRunning = false;
    this.soundEnabled = localStorage.getItem('notificationSound') !== 'false';
    this.currentChatId = null; // Track active chat to avoid notifications for current chat
  }

  // Add listener for notification updates
  addListener(callback) {
    this.listeners.add(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Start the notification service
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    // Check immediately
    this.checkDeadlines();
    
    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkDeadlines();
    }, 60000); // Check every minute

    // Set up socket listeners for chat notifications
    this.setupChatNotifications();

    console.log('Notification service started');
  }

  // Set up socket listeners for real-time chat notifications
  setupChatNotifications() {
    try {
      socketService.connect();
      
      // Listen for new chat messages
      socketService.on('new_message', (data) => {
        this.handleNewMessage(data);
      });

      // Listen for typing indicators
      socketService.on('user_typing', (data) => {
        this.handleTypingIndicator(data);
      });

      console.log('Chat notifications setup complete');
    } catch (error) {
      console.error('Error setting up chat notifications:', error);
    }
  }

  // Handle new message notification
  handleNewMessage(data) {
    const { message, senderName, chatId } = data;
    const currentUser = sessionStorage.getItem('email');
    
    // Don't notify if:
    // 1. Message is from current user
    // 2. User is currently viewing this chat
    if (message.sender === currentUser || this.currentChatId === chatId) {
      return;
    }

    // Create notification
    const notification = {
      id: `message_${message._id}_${Date.now()}`,
      type: 'chat_message',
      title: `New message from ${senderName}`,
      message: this.truncateMessage(message.content),
      senderName,
      chatId,
      messageId: message._id,
      timestamp: new Date(message.timestamp),
      read: false,
      priority: false
    };

    this.addChatNotification(notification);
    this.showChatAlert(notification);
    this.playNotificationSound();
  }

  // Set current active chat (to avoid notifications for active chat)
  setCurrentChat(chatId) {
    this.currentChatId = chatId;
  }

  // Clear current chat
  clearCurrentChat() {
    this.currentChatId = null;
  }

  // Add chat notification (separate from deadline notifications)
  addChatNotification(notification) {
    // Check if we already have a notification from this sender in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existingNotification = this.notifications.find(n => 
      n.type === 'chat_message' && 
      n.senderName === notification.senderName &&
      n.timestamp > oneMinuteAgo &&
      !n.read
    );

    if (existingNotification) {
      // Update existing notification
      existingNotification.message = `${notification.message} (and other messages)`;
      existingNotification.timestamp = notification.timestamp;
    } else {
      // Add new notification
      this.addNotification(notification);
    }
  }

  // Show in-app notification for chat messages
  showChatAlert(notification) {
    // Show toast notification with chat-specific styling
    toast((t) => (
      <div className="flex items-center space-x-3" onClick={() => this.openChat(notification.chatId, t.id)}>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {notification.senderName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 cursor-pointer">
          <p className="text-sm font-medium text-gray-900">{notification.senderName}</p>
          <p className="text-sm text-gray-600 truncate">{notification.message}</p>
        </div>
      </div>
    ), {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #3b82f6',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer'
      },
    });

    // Try to show browser notification if permission granted and window not focused
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `chat_${notification.chatId}`,
        requireInteraction: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        this.openChat(notification.chatId);
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Truncate long messages for notifications
  truncateMessage(content, maxLength = 50) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  // Open chat (this will be handled by the chat component)
  openChat(chatId, toastId = null) {
    if (toastId) {
      toast.dismiss(toastId);
    }
    
    // Emit event that chat components can listen to
    window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }));
    
    // Mark related notifications as read
    this.notifications
      .filter(n => n.type === 'chat_message' && n.chatId === chatId)
      .forEach(n => n.read = true);
    
    this.notifyListeners();
  }

  // Play notification sound
  playNotificationSound() {
    if (!this.soundEnabled) return;
    
    try {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Toggle notification sound
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('notificationSound', this.soundEnabled.toString());
    return this.soundEnabled;
  }

  // Handle typing indicators (optional feature)
  handleTypingIndicator(data) {
    // This could be used to show typing indicators in the UI
    // For now, we'll just emit an event that components can listen to
    window.dispatchEvent(new CustomEvent('userTyping', { detail: data }));
  }

  // Stop the notification service
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Notification service stopped');
  }

  // Check for upcoming deadlines
  async checkDeadlines() {
    try {
      const userEmail = sessionStorage.getItem('email');
      if (!userEmail) return;

      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Fetch notes and transcriptions with proper error handling
      let notesResponse = null;
      let transcriptionsResponse = null;

      try {
        notesResponse = await fetchNotes({ 
          view: 'active', 
          deadline_start: now.toISOString(), 
          deadline_end: fiveMinutesFromNow.toISOString() 
        });
      } catch (error) {
        console.error('Error fetching notes for notifications:', error);
        notesResponse = null;
      }

      try {
        transcriptionsResponse = await getTranscriptions(userEmail, 'active');
      } catch (error) {
        console.error('Error fetching transcriptions for notifications:', error);
        transcriptionsResponse = null;
      }

      const upcomingNotifications = [];

      // Check notes deadlines - handle different response formats
      let notes = [];
      if (notesResponse) {
        if (Array.isArray(notesResponse)) {
          notes = notesResponse;
        } else if (notesResponse.notes && Array.isArray(notesResponse.notes)) {
          notes = notesResponse.notes;
        } else if (notesResponse.data && Array.isArray(notesResponse.data)) {
          notes = notesResponse.data;
        }
      }

      notes.forEach(note => {
        if (note.deadline && !note.completed) {
          const deadlineDate = new Date(note.deadline);
          const timeUntilDeadline = deadlineDate.getTime() - now.getTime();
          
          // If deadline is within 5 minutes and hasn't been notified already
          if (timeUntilDeadline > 0 && timeUntilDeadline <= 5 * 60 * 1000) {
            const notificationId = `note_${note._id}_${deadlineDate.getTime()}`;
            
            if (!this.hasNotificationBeenShown(notificationId)) {
              upcomingNotifications.push({
                id: notificationId,
                type: 'note_deadline',
                title: 'Note Deadline Alert',
                message: `"${note.title}" is due in ${Math.ceil(timeUntilDeadline / 60000)} minutes`,
                item: note,
                deadline: deadlineDate,
                timestamp: now,
                read: false
              });
            }
          }
        }
      });

      // Check AI notes/transcriptions deadlines
      const transcriptions = Array.isArray(transcriptionsResponse) ? transcriptionsResponse : [];
      transcriptions.forEach(transcription => {
        if (transcription.processed_notes && Array.isArray(transcription.processed_notes)) {
          transcription.processed_notes.forEach((aiNote, index) => {
            if (aiNote.deadline) {
              try {
                const deadlineDate = new Date(aiNote.deadline);
                const timeUntilDeadline = deadlineDate.getTime() - now.getTime();
                
                // If deadline is within 5 minutes and hasn't been notified already
                if (timeUntilDeadline > 0 && timeUntilDeadline <= 5 * 60 * 1000) {
                  const notificationId = `ai_note_${transcription._id}_${index}_${deadlineDate.getTime()}`;
                  
                  if (!this.hasNotificationBeenShown(notificationId)) {
                    upcomingNotifications.push({
                      id: notificationId,
                      type: 'ai_note_deadline',
                      title: 'AI Note Deadline Alert',
                      message: `"${aiNote.title}" is due in ${Math.ceil(timeUntilDeadline / 60000)} minutes`,
                      item: aiNote,
                      deadline: deadlineDate,
                      timestamp: now,
                      read: false,
                      transcriptionId: transcription._id
                    });
                  }
                }
              } catch (dateError) {
                console.warn('Invalid date format in AI note deadline:', aiNote.deadline);
              }
            }
          });
        }
      });

      // Add new notifications and show alerts
      upcomingNotifications.forEach(notification => {
        this.addNotification(notification);
        this.showAlert(notification);
        this.markNotificationAsShown(notification.id);
      });

    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }

  // Add notification to the list
  addNotification(notification) {
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    this.notifyListeners();
  }

  // Show browser notification and toast
  showAlert(notification) {
    // Show toast notification
    toast.error(notification.message, {
      duration: 6000,
      position: 'top-right',
      style: {
        borderLeft: notification.type === 'project' ? '4px solid #f59e0b' : '4px solid #ef4444',
      },
    });

    // Try to show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: true, // Keep notification visible until user interacts
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }

    // Emit socket event for other tabs
    // socketService.emit('deadline_alert', {
    //   notification: notification,
    //   user_email: sessionStorage.getItem('email')
    // });
  }

  // Check if notification has been shown already (prevent duplicates)
  hasNotificationBeenShown(notificationId) {
    const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
    const fiveMinutesAgo = new Date().getTime() - 5 * 60 * 1000;
    
    // Clean old entries
    const validNotifications = shownNotifications.filter(item => item.timestamp > fiveMinutesAgo);
    localStorage.setItem('shownNotifications', JSON.stringify(validNotifications));
    
    return validNotifications.some(item => item.id === notificationId);
  }

  // Mark notification as shown to prevent duplicates
  markNotificationAsShown(notificationId) {
    const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
    shownNotifications.push({
      id: notificationId,
      timestamp: new Date().getTime()
    });
    localStorage.setItem('shownNotifications', JSON.stringify(shownNotifications));
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyListeners();
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Request browser notification permission
  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return Notification.requestPermission().then(permission => {
        return permission === 'granted';
      });
    }
    return Promise.resolve(Notification.permission === 'granted');
  }

  // Show change notification
  showChangeNotification(action, itemType, itemName, details = '') {
    const userName = sessionStorage.getItem('name') || sessionStorage.getItem('email') || 'User';
    const message = `${userName} ${action} ${itemType}: ${itemName}${details ? ` - ${details}` : ''}`;
    
    // Create notification object
    const notification = {
      id: `change_${Date.now()}`,
      type: 'change',
      title: `${action} ${itemType}`,
      message,
      timestamp: new Date(),
      read: false,
      priority: false,
      itemType,
      action,
      itemName
    };

    // Add to notifications list
    this.addNotification(notification);

    // Show toast notification with appropriate styling
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      icon: '✨',
      style: {
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        padding: '16px',
        color: '#166534'
      },
    });

    // Play notification sound
    this.playNotificationSound();

    return notification;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Utility to fetch notifications for dashboard analytics
export const fetchNotifications = async () => {
  // Return the current notifications from the singleton
  // If not started, start the service to populate notifications
  if (!notificationService.isRunning) {
    notificationService.start();
  }
  // Wait a short time to allow async fetches to complete
  await new Promise(res => setTimeout(res, 300));
  return notificationService.getNotifications();
};

export default notificationService;
