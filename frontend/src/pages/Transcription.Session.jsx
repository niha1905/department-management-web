import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function TranscriptionSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState(null);

  useEffect(() => {
    // Get transcription data from navigation state
    if (location.state && location.state.transcription) {
      setTranscription(location.state.transcription);
    } else {
      toast.error('No transcription data found.');
      navigate('/');
    }
  }, [location, navigate]);

  if (!transcription) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Transcription Session</h1>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Transcription</h2>
          <div className="p-4 bg-gray-100 rounded text-gray-800 whitespace-pre-wrap">
            {transcription.content}
          </div>
        </div>
        {/* Add summarize and note management UI here */}
        <div className="flex gap-2 mt-6">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded" onClick={() => toast('Summarize feature coming soon!')}>Summarize</button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={() => toast('Save to Notes feature coming soon!')}>Save to Notes</button>
        </div>
      </div>
    </div>
  );
}
