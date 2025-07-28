import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { summarizeTranscription, analyzeTranscript, fetchAllUsers, createNote } from '../services/api';

export default function TranscriptionAutomator() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  // When transcript changes, auto-summarize and extract tasks
  useEffect(() => {
    if (!transcript.trim()) {
      setSummary('');
      setTasks([]);
      return;
    }
    setIsProcessing(true);
    setError(null);
    setSuccess('');
    (async () => {
      try {
        const sum = await summarizeTranscription(transcript);
        setSummary(sum.summary || '');
        const user_email = sessionStorage.getItem('email') || '';
        const user_name = sessionStorage.getItem('name') || '';
        const result = await analyzeTranscript(transcript, {}, user_email, user_name);
        setTasks(result.raw_tasks || []);
      } catch (err) {
        setError('Failed to process transcript');
      } finally {
        setIsProcessing(false);
      }
    })();
  }, [transcript]);

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <SparklesIcon className="w-8 h-8 text-blue-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Transcription Automator</h1>
          <p className="text-gray-600">Paste or type a transcript and everything is automated</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={6}
            className="w-full border rounded p-2 mb-2"
            placeholder="Paste or type your transcript here..."
            disabled={isProcessing}
          />
          {isProcessing && (
            <div className="text-blue-600 mb-2">Processing...</div>
          )}
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
      </motion.div>
    </div>
  );
}
