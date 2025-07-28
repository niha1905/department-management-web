import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import axios from 'axios';

const VoiceRecorder = ({ onTasksGenerated, setLoading, setError }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [realtimeTranscript, setRealtimeTranscript] = useState('');
    const [isRealtime] = useState(true); // Toggle for real-time mode
    const chunkIdRef = useRef(0);

    // Real-time transcription: send audio chunks as they arrive
    useEffect(() => {
        if (!isRealtime || !isRecording) return;
        // No extra setup needed, handled in ondataavailable
    }, [isRealtime, isRecording]);

    // Helper to send audio chunk for real-time transcription
    const sendAudioChunkRealtime = async (audioBlob, chunkId) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, `chunk_${chunkId}.webm`);
            formData.append('chunk_id', chunkId);
            // You may need to adjust the endpoint to match your backend
            const res = await axios.post('/api/voicechat/realtime', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data && res.data.partial) {
                setRealtimeTranscript(prev => prev + res.data.partial);
            }
        } catch {
            // Optionally handle errors
        }
    };

    // Start recording function (add real-time logic)
    const startRecording = async () => {
        try {
            // Clear any previous errors and transcription
            if (setError) setError(null);
            setTranscribedText('');
            setRealtimeTranscript('');
            chunkIdRef.current = 0;
            
            // Check if the browser supports SpeechRecognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition is not supported in this browser');
            }
            
            // Create and configure the recognition object
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event) => {
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    }
                }
                
                setTranscribedText(finalTranscript);
            };
            
            // Start the recognition
            recognition.start();
            recognitionRef.current = recognition;
            
            // Start recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    if (isRealtime) {
                        sendAudioChunkRealtime(event.data, chunkIdRef.current++);
                    }
                }
            };
            
            mediaRecorder.start(1000); // Capture in 1-second chunks
            setIsRecording(true);
            
            // Start timer
            let seconds = 0;
            timerRef.current = setInterval(() => {
                seconds++;
                setRecordingTime(seconds);
            }, 1000);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            if (setError) setError('Error accessing microphone. Please make sure you have granted permission.');
        }
    };

    // Stop recording function (real-time only, do not save transcript)
    const stopRecording = async () => {
        if (!isRecording) return;
        try {
            setIsRecording(false);
            clearInterval(timerRef.current);
            setRecordingTime(0);
            return new Promise((resolve) => {
                mediaRecorderRef.current.onstop = async () => {
                    // Get the final transcript
                    const finalText = isRealtime ? realtimeTranscript : transcribedText;
                    if (finalText && finalText.trim().length > 0) {
                        try {
                            setLoading && setLoading(true);
                            // Get user info from sessionStorage
                            const user_email = sessionStorage.getItem('email') || '';
                            const user_name = sessionStorage.getItem('name') || user_email?.split('@')[0] || 'User';
                            const res = await axios.post('/api/notes/ai', {
                                text: finalText,
                                user_email,
                                user_name
                            });
                            if (onTasksGenerated) onTasksGenerated(res.data);
                        } catch {
                            setError && setError("Failed to generate notes from AI.");
                        } finally {
                            setLoading && setLoading(false);
                        }
                    }
                    setTranscribedText('');
                    setRealtimeTranscript('');
                    resolve();
                };
                mediaRecorderRef.current.stop();
                if (mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            });
        } catch (error) {
            console.error('Error stopping recording:', error);
            setError && setError('Error stopping recording. Please try again.');
            setLoading && setLoading(false);
        }
    };

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-lg font-medium mb-3">Voice Chat (Realtime Only)</div>
            <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={isRealtime} readOnly />
                    Real-time Transcription
                </label>
            </div>
            <div className="flex items-center gap-3">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Mic size={18} />
                        Start Recording
                    </button>
                ) : (
                    <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                            <span className="font-medium">{formatTime(recordingTime)}</span>
                        </div>
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                        >
                            <Square size={16} />
                            Stop
                        </button>
                    </div>
                )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
                {isRecording ? 'Recording in progress...' : 'Press to start real-time voice chat'}
            </div>
            {realtimeTranscript && isRealtime && (
                <div className="mt-4 w-full">
                    <details className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                        <summary className="font-medium cursor-pointer">Live Transcript</summary>
                        <div className="mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {realtimeTranscript}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;
