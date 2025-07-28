import React, { useEffect, useRef, useState } from 'react';
import { useTranscription } from '../context/TranscriptionContext';
import { Mic, X, Loader } from 'lucide-react';

export default function TranscriptionDisplay() {
  const { transcribedText, isRecording, isTranscribing, clearTranscription, sendTranscriptionToAI } = useTranscription();
  const prevRecording = useRef(isRecording);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // When recording transitions from true to false and there is transcribedText, send to AI
    if (prevRecording.current && !isRecording && transcribedText) {
      setIsProcessing(true);
      sendTranscriptionToAI().then((result) => {
        setIsProcessing(false);
        if (result && result.success) {
          // Keep the transcription visible for a moment to show success
          setTimeout(() => {
            clearTranscription();
          }, 2000);
        } else {
          clearTranscription();
        }
      }).catch(() => {
        setIsProcessing(false);
        clearTranscription();
      });
    }
    prevRecording.current = isRecording;
  }, [isRecording, transcribedText, sendTranscriptionToAI, clearTranscription]);

  if (!isRecording && !transcribedText) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-md w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="flex items-center space-x-2">
          <Mic size={20} />
          <span className="font-semibold">
            {isRecording ? 'Recording...' : 'Transcription'}
          </span>
        </div>
        <button
          onClick={clearTranscription}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {isTranscribing && !transcribedText && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Listening...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 text-green-600">
            <Loader size={16} className="animate-spin" />
            <span className="text-sm">Creating notes...</span>
          </div>
        )}
        
        {transcribedText && (
          <div className="space-y-2">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {transcribedText}
            </p>
            {isRecording && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Still recording...</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {transcribedText && !isRecording && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{transcribedText.split(' ').length} words</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
} 