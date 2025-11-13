# Department Management Web

## Overview

**Department Management Web** is a comprehensive full-stack team collaboration and project management platform with real-time features, AI-powered transcription, and interactive visualization tools. Built for departments and teams to streamline communication, task management, and knowledge sharing.

## 🚀 Key Features

### 📝 Smart Notes Management
- **Full CRUD Operations** - Create, read, update, delete notes with rich metadata
- **Tags & Categories** - Organize notes by type (daily tasks, routine tasks, meetings)
- **Deadlines & Reminders** - Set deadlines with automatic notifications
- **Version Control** - Track note history and rollback to previous versions
- **Comments System** - Collaborative note discussions
- **Trash & Recovery** - Soft delete with restore functionality

### 💬 Real-time Team Chat
- **Multiple Chat Rooms** - Create project/team-specific chat spaces
- **File Sharing** - Upload and download files in conversations
- **Message Management** - Edit, delete messages with real-time updates
- **Unread Tracking** - Monitor unread message counts
- **WebSocket Integration** - Instant message delivery via SocketIO

### 🎙️ AI-Powered Transcription
- **Audio-to-Text** - Automatic transcription using OpenAI Whisper
- **Meeting Notes** - Convert recordings into structured notes
- **Smart Task Extraction** - AI automatically generates actionable tasks from transcripts
- **Transcription Library** - Save, search, and manage all transcriptions

### 📊 Project Management
- **Project Tracking** - Create and manage multiple projects
- **Team Assignment** - Assign users to projects
- **Project Notes** - Link notes to specific projects
- **Project Detection** - AI identifies project mentions in text

### 🧠 Interactive Mindmaps
- **Hierarchical Visualization** - Visual project and people relationships
- **Real-time Collaboration** - Multiple users edit mindmaps simultaneously
- **Node Management** - Add, update, delete nodes with live sync
- **Project & People Maps** - Separate mindmap views for different contexts

### 👥 People & User Management
- **Team Directory** - Track all team members
- **Role-Based Access** - Admin and user roles with different permissions
- **User Analytics** - Admin dashboard with activity metrics
- **Authentication** - Secure login system with JWT tokens

### 🔔 Smart Notifications
- **Deadline Alerts** - Automatic reminders 5 minutes before deadlines
- **Real-time Updates** - Instant notifications for chat messages
- **Activity Tracking** - Monitor user engagement and task completion

## 🏗️ Tech Stack

### Backend
- **Framework**: Python Flask
- **Database**: MongoDB
- **Real-time**: Flask-SocketIO (WebSocket support)
- **AI/ML**: OpenAI Whisper (audio transcription)
- **Authentication**: JWT tokens, role-based access control
- **APIs**: RESTful API architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: CSS with modern UI components
- **Real-time**: Socket.IO client
- **State Management**: React hooks and context

### Browser Extension
- **Platform**: Chrome Extension API
- **Integration**: Seamless connection with web app
- **Features**: Quick note capture, context menu actions

### Database Schema
- **Collections**: 
  - `notes` - Task and note storage
  - `users` - User accounts and authentication
  - `chat_rooms` - Chat room metadata
  - `messages` - Chat messages
  - `transcripts` - Audio transcription records
  - `projects` - Project information
  - `people` - Team member directory
  - `mindmap_nodes` - Mindmap data structures

## 📦 Project Structure

```
department-management-web/
├── backend/
│   ├── controllers/
│   │   ├── Notes.py                    # Notes CRUD operations
│   │   ├── ChatController.py           # Chat functionality
│   │   ├── TranscriptionController.py  # Audio transcription
│   │   ├── ProjectController.py        # Project management
│   │   ├── MindmapController.py        # Mindmap features
│   │   └── HierarchicalMindmapController.py
│   ├── main.py                         # Flask app entry point
│   ├── auth.py                         # Authentication logic
│   ├── requirements.txt                # Python dependencies
│   └── .env.example                    # Environment variables template
├── frontend/
│   ├── src/                            # React source code
│   ├── public/                         # Static assets
│   └── package.json                    # Frontend dependencies
├── chrome-extension/
│   ├── manifest.json                   # Extension configuration
│   └── [extension files]
└── README.md

```

## 🛠️ Installation & Setup

### Prerequisites
- **Python** 3.8 or higher
- **Node.js** v14 or higher
- **MongoDB** 4.4 or higher (local or Atlas)
- **npm** or **yarn**

### Step 1: Clone Repository
```bash
git clone https://github.com/niha1905/department-management-web.git
cd department-management-web
```

### Step 2: Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and add your MongoDB URI
# MONGO_URI=mongodb://localhost:27017/
# MONGO_DB_NAME=department_management

# Start backend server
python main.py
```

Backend will run on `http://localhost:5000`

### Step 3: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:5173`

### Step 4: MongoDB Setup
```bash
# Start MongoDB locally
mongod

# Or use MongoDB Atlas cloud database
# Update MONGO_URI in backend/.env with your Atlas connection string
```

### Step 5: Chrome Extension (Optional)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

## 📋 API Endpoints

### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - Get all notes
- `GET /api/notes/<id>` - Get specific note
- `PUT /api/notes/<id>` - Update note
- `DELETE /api/notes/<id>` - Delete note
- `POST /api/notes/<id>/comments` - Add comment
- `PATCH /api/notes/<id>/complete` - Toggle completion

### Chat
- `POST /api/chat/rooms` - Create chat room
- `GET /api/chat/rooms` - Get all rooms
- `POST /api/chat/messages` - Send message
- `GET /api/chat/rooms/<id>/messages` - Get messages
- `PUT /api/chat/messages/<id>` - Edit message
- `DELETE /api/chat/messages/<id>` - Delete message

### Transcription
- `POST /api/transcriptions` - Save transcription
- `GET /api/transcriptions` - Get all transcriptions
- `POST /upload_audio` - Upload and transcribe audio
- `DELETE /api/transcriptions/<id>` - Delete transcription

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/<id>` - Get project details
- `PUT /api/projects/<id>` - Update project
- `DELETE /api/projects/<id>` - Delete project

### People & Users
- `GET /api/people` - Get team members
- `POST /api/people` - Add person
- `GET /users` - Get all users (admin only)
- `GET /api/analytics/users` - User analytics (admin only)

### Mindmap
- `POST /api/mindmap` - Save mindmap node
- `GET /api/mindmap` - Get mindmap nodes
- `GET /api/mindmap/hierarchical/projects` - Project mindmap
- `GET /api/mindmap/hierarchical/people` - People mindmap

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=department_management

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# CORS Settings (optional)
CORS_ORIGINS=http://localhost:5173

# JWT Secret (for authentication)
JWT_SECRET_KEY=your-secret-key-here
```

## 🎯 Usage

### Creating Notes
1. Navigate to Notes section
2. Click "Create Note"
3. Add title, description, tags, and deadline
4. Choose note type (daily task, routine task, etc.)
5. Assign to project or person (optional)

### Audio Transcription
1. Go to Transcription section
2. Upload audio file (.webm, .mp3, .wav)
3. Wait for Whisper AI to process
4. Review auto-generated tasks
5. Edit and save to your notes

### Team Chat
1. Create or join a chat room
2. Send messages in real-time
3. Upload files for sharing
4. Edit/delete your own messages
5. Mark messages as read

### Project Management
1. Create a new project
2. Assign team members
3. Link relevant notes
4. Track progress via mindmap
5. Use project-specific chat rooms

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 👤 Author

**Nihaarika S**  
Department of Computer Science and Engineering  
SRM Institute of Science and Technology, Chennai, India  
📧 ns1490@srmist.edu.in  
🌐 [LinkedIn](https://www.linkedin.com/in/nihaarika-s-23033a259/)

## 🙏 Acknowledgments

- **OpenAI Whisper** - Audio transcription AI
- **Flask & Flask-SocketIO** - Backend framework
- **MongoDB** - Database
- **React** - Frontend framework
- **Chrome Extension APIs** - Browser integration

---

**Note**: This is an active development project. Some features may be in beta or under construction.
