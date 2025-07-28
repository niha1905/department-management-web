import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mic, MicOff, Save, FileText, ArrowLeft, Loader } from 'lucide-react';
import { analyzeTranscript, createNote } from '../services/api';

export default function TranscriptionSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [meetingContext, setMeetingContext] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const userEmail = sessionStorage.getItem('email');
  const userName = sessionStorage.getItem('name') || userEmail?.split('@')[0] || 'User';

  useEffect(() => {
    // Get meeting context from sessionStorage or URL
    const urlParams = new URLSearchParams(location.search);
    const meetingId = urlParams.get('meeting');
    
    if (meetingId) {
      const storedMeeting = sessionStorage.getItem('currentMeetingContext');
      if (storedMeeting) {
        setMeetingContext(JSON.parse(storedMeeting));
      }
    }

    // Get transcription data from navigation state
    if (location.state && location.state.transcription) {
      setTranscription(location.state.transcription.content || '');
    }
  }, [location]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success('Recording started');
      // In a real implementation, you'd start actual recording here
    } else {
      toast.success('Recording stopped');
      // In a real implementation, you'd stop recording and process the audio
    }
  };

  const saveTranscription = async () => {
    if (!transcription.trim()) {
      toast.error('Please add transcription content before saving');
      return;
    }

    setIsSaving(true);
    try {
      const transcriptionData = {
        id: Date.now(),
        title: meetingContext ? `${meetingContext.title} - Transcription` : 'Meeting Transcription',
        content: transcription,
        type: 'transcription',
        meetingId: meetingContext?.id || null,
        createdAt: new Date().toISOString(),
        createdBy: userName,
        userEmail: userEmail,
        tasks: [],
        keywords: [],
        summary: ''
      };

      // Save to localStorage
      const storedTranscriptions = JSON.parse(localStorage.getItem('meeting_transcriptions') || '[]');
      storedTranscriptions.push(transcriptionData);
      localStorage.setItem('meeting_transcriptions', JSON.stringify(storedTranscriptions));

      // Analyze transcription and create notes
      await analyzeAndCreateNotes(transcriptionData);

      toast.success('Transcription saved successfully!');
      navigate('/meetings');
    } catch (error) {
      console.error('Error saving transcription:', error);
      toast.error('Failed to save transcription');
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeAndCreateNotes = async (transcriptionData) => {
    if (!transcriptionData.content || transcriptionData.content.length < 50) {
      return;
    }

    setIsAnalyzing(true);
    try {
      // Analyze the transcription
      const analysisResult = await analyzeTranscript({
        transcript: transcriptionData.content,
        meeting_title: transcriptionData.title
      });

      if (analysisResult) {
        // Update transcription with analysis
        const updatedTranscription = {
          ...transcriptionData,
          summary: analysisResult.summary || '',
          tasks: analysisResult.tasks || [],
          keywords: analysisResult.keywords || []
        };

        // Update localStorage
        const storedTranscriptions = JSON.parse(localStorage.getItem('meeting_transcriptions') || '[]');
        const updatedTranscriptions = storedTranscriptions.map(item => 
          item.id === transcriptionData.id ? updatedTranscription : item
        );
        localStorage.setItem('meeting_transcriptions', JSON.stringify(updatedTranscriptions));

        // Create notes from tasks
        if (analysisResult.tasks && analysisResult.tasks.length > 0) {
          for (const task of analysisResult.tasks.slice(0, 3)) {
            try {
              await createNote({
                title: `Task: ${typeof task === 'string' ? task.substring(0, 30) + '...' : task.title}`,
                content: typeof task === 'string' ? task : task.title || task.description,
                color: 'blue',
                tags: ['meeting', 'task', 'transcription'],
                is_shared: false,
                shared_with: []
              });
            } catch (noteError) {
              console.error('Error creating task note:', noteError);
            }
          }
        }

        // Create summary note
        if (analysisResult.summary && analysisResult.summary.length > 20) {
          try {
            await createNote({
              title: `Summary: ${transcriptionData.title}`,
              content: analysisResult.summary,
              color: 'green',
              tags: ['meeting', 'summary', 'transcription'],
              is_shared: false,
              shared_with: []
            });
          } catch (noteError) {
            console.error('Error creating summary note:', noteError);
          }
        }

        toast.success('Notes created from transcription!');
      }
    } catch (error) {
      console.error('Error analyzing transcription:', error);
      toast.error('Failed to analyze transcription');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/meetings')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {meetingContext ? meetingContext.title : 'Transcription Session'}
              </h1>
              <p className="text-gray-500">
                {meetingContext ? 
                  `Meeting scheduled for ${new Date(meetingContext.start_time).toLocaleString()}` :
                  'Record and transcribe your meeting'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Recording Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all ${
                isRecording
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff size={20} />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic size={20} />
                  Start Recording
                </>
              )}
            </button>
            {isRecording && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transcription Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Transcription</h2>
            <div className="text-sm text-gray-500">
              {transcription.length} characters
            </div>
          </div>
          
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Transcription will appear here as you record, or you can type/paste manually..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={saveTranscription}
              disabled={isSaving || !transcription.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save & Analyze
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                if (transcription.trim()) {
                  // Create a quick note without full analysis
                  createNote({
                    title: `Quick Note: ${meetingContext?.title || 'Meeting'}`,
                    content: transcription,
                    color: 'yellow',
                    tags: ['transcription', 'quick-note'],
                    is_shared: false,
                    shared_with: []
                  }).then(() => {
                    toast.success('Quick note created!');
                  }).catch(() => {
                    toast.error('Failed to create note');
                  });
                } else {
                  toast.error('Please add transcription content first');
                }
              }}
              disabled={!transcription.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <FileText size={16} />
              Quick Note
            </button>
          </div>
        </motion.div>

        {/* Meeting Details */}
        {meetingContext && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Meeting Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Meeting Name</label>
                <p className="text-gray-900">{meetingContext.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Scheduled Time</label>
                <p className="text-gray-900">{new Date(meetingContext.start_time).toLocaleString()}</p>
              </div>
              {meetingContext.participants && meetingContext.participants.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Participants</label>
                  <p className="text-gray-900">{meetingContext.participants.join(', ')}</p>
                </div>
              )}
              {meetingContext.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{meetingContext.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
