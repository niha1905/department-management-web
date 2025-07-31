import { io } from 'socket.io-client';

// Singleton service for managing Socket.IO connection and events
class SocketService {
  constructor() {
    this.socket = null;
    this.eventHandlers = new Map();
    this.connectionError = false;
  }
  // Connects to backend Socket.IO server, registers event handlers
  connect() {
    if (!this.socket || !this.socket.connected) {
      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('Connected to live updates');
        this.connectionError = false;
        this.socket.emit('join_room', { room: 'general' });
        // Re-register all event handlers on connect
        this.eventHandlers.forEach((handler, event) => {
          this.socket.off(event); // Remove any previous handler to avoid duplicates
          this.socket.on(event, handler);
        });
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from live updates');
      });

      this.socket.on('reconnect', () => {
        console.log('Reconnected to live updates');
        this.socket.emit('join_room', { room: 'general' });
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.connectionError = true;
        if (error && error.message) {
          console.error('Socket.IO connect_error:', error.message);
        }
      });
    }
    return this.socket;
  }

  // Disconnects and cleans up event handlers
  disconnect() {
    if (this.socket) {
      // Remove all event handlers to avoid leaks
      this.eventHandlers.forEach((handler, event) => {
        this.socket.off(event, handler);
      });
      this.socket.disconnect();
      this.socket = null;
      this.connectionError = false;
    }
  }

  // Registers/unregisters event handlers for socket events
  on(event, handler) {
    // Remove previous handler if exists to avoid duplicates
    if (this.eventHandlers.has(event) && this.socket) {
      this.socket.off(event, this.eventHandlers.get(event));
    }
    this.eventHandlers.set(event, handler);
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event) {
    if (this.eventHandlers.has(event) && this.socket) {
      this.socket.off(event, this.eventHandlers.get(event));
    }
    this.eventHandlers.delete(event);
  }

  // Emits events to backend
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  // Optional: one-time event listener
  once(event, handler) {
    if (this.socket) {
      this.socket.once(event, handler);
    }
  }
}

// Singleton instance exported for use in frontend
const socketService = new SocketService();
export default socketService;