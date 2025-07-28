import { useState, useEffect, useRef } from 'react';

// Hook for live speech recognition (WebkitSpeechRecognition/SpeechRecognition)
export function useLiveTranscription({ language = 'en-US', onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Enable continuous mode for multi-line
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(prev => prev + finalTranscript);
      if (onResult) onResult(finalTranscript);
    };

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
  }, [language, onResult]);

  const startListening = () => {
    setError('');
    setTranscript('');
    setIsListening(true);
    recognitionRef.current && recognitionRef.current.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current && recognitionRef.current.stop();
  };

  return { transcript, isListening, error, startListening, stopListening };
}
