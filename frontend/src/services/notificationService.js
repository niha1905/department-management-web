import { fetchNotes, getTranscriptions } from './api';
// import socketService from './socket'; // <-- uncomment
import toast from 'react-hot-toast';

// Singleton service for deadline notifications (notes, AI notes)
class NotificationService {
  constructor() {
    this.notifications = [];
    this.checkInterval = null;
    this.listeners = new Set();
    this.isRunning = false;
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

    console.log('Notification service started');
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