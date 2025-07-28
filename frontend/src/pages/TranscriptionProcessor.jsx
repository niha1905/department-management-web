import React, { useState } from 'react';
import { summarizeTranscription, analyzeTranscript, fetchAllUsers, createNote } from '../services/api';

export default function TranscriptionProcessor() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    fetchAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const handleSummarize = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess('');
    try {
      const result = await summarizeTranscription(transcript);
      setSummary(result.summary || '');
    } catch (err) {
      setError('Failed to summarize transcript');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess('');
    try {
      const user_email = sessionStorage.getItem('email') || '';
      const user_name = sessionStorage.getItem('name') || '';
      const result = await analyzeTranscript(transcript, {}, user_email, user_name);
      setTasks(result.raw_tasks || []);
    } catch (err) {
      setError('Failed to extract tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignmentChange = (taskIdx, userEmail) => {
    setSelectedAssignments(prev => ({ ...prev, [taskIdx]: userEmail }));
  };

  const handleSaveTasksAsNotes = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess('');
    try {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        await createNote({
          title: task.title || 'Untitled',
          description: task.description || '',
          assigned_to: selectedAssignments[i] || '',
          tags: task.tags || [],
          color: task.color || 'blue',
          priority: !!task.priority,
          deadline: task.deadline || '',
        });
      }
      setSuccess('All tasks saved as notes!');
    } catch (e) {
      setError('Failed to save tasks as notes.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Transcription Processor</h1>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          rows={6}
          className="w-full border rounded p-2 mb-2"
          placeholder="Paste or type your transcript here..."
          disabled={isProcessing}
        />
        <div className="flex gap-2 mb-4">
          <button onClick={handleSummarize} disabled={isProcessing || !transcript} className="bg-blue-600 text-white px-4 py-2 rounded">Summarize</button>
          <button onClick={handleAnalyze} disabled={isProcessing || !transcript} className="bg-green-600 text-white px-4 py-2 rounded">Extract Tasks</button>
        </div>
        {summary && (
          <div className="bg-blue-50 p-3 rounded mb-2">
            <h3 className="font-semibold mb-1">Summary</h3>
            <ul className="list-disc pl-5">
              {summary.split('\n').map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        {tasks.length > 0 && (
          <div className="bg-green-50 p-3 rounded mb-2">
            <h3 className="font-semibold mb-1">Tasks</h3>
            <ul>
              {tasks.map((task, idx) => (
                <li key={idx} className="mb-2 flex items-center gap-2">
                  <span className="flex-1">{task.title || task.text || JSON.stringify(task)}</span>
                  <select
                    value={selectedAssignments[idx] || ''}
                    onChange={e => handleAssignmentChange(idx, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.email || user._id} value={user.email}>{user.name || user.email}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <button onClick={handleSaveTasksAsNotes} className="mt-2 bg-blue-700 text-white px-4 py-2 rounded">Save All as Notes</button>
          </div>
        )}
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </div>
    </div>
  );
}
