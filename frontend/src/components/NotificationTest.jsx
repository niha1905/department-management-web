import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService.jsx';
import { createNote } from '../services/api';

const NotificationTest = () => {
  const [testNote, setTestNote] = useState(null);

  // Function to create a test note with deadline in 2 minutes
  const createTestNote = async () => {
    try {
      const now = new Date();
      const deadlineTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now

      const noteData = {
        title: 'Test Deadline Note',
        description: 'This is a test note to verify deadline notifications work.',
        tags: ['Test', 'Notification'],
        color: 'red',
        deadline: deadlineTime.toISOString(),
        priority: true
      };

      const response = await createNote(noteData);
      setTestNote(response.note || response);
      
      alert(`Test note created with deadline at ${deadlineTime.toLocaleTimeString()}. You should receive a notification in about 2 minutes.`);
    } catch (error) {
      console.error('Failed to create test note:', error);
      alert('Failed to create test note');
    }
  };

  // Function to create a test note with deadline in 30 seconds (for quick testing)
  const createQuickTestNote = async () => {
    try {
      const now = new Date();
      const deadlineTime = new Date(now.getTime() + 30 * 1000); // 30 seconds from now

      const noteData = {
        title: 'Quick Test Deadline Note',
        description: 'This is a quick test note to verify deadline notifications work in 30 seconds.',
        tags: ['Test', 'Quick', 'Notification'],
        color: 'amber',
        deadline: deadlineTime.toISOString(),
        priority: true
      };

      const response = await createNote(noteData);
      setTestNote(response.note || response);
      
      alert(`Quick test note created with deadline at ${deadlineTime.toLocaleTimeString()}. You should receive a notification in about 30 seconds.`);
    } catch (error) {
      console.error('Failed to create quick test note:', error);
      alert('Failed to create quick test note');
    }
  };

  // Function to manually trigger notification check
  const checkNotifications = () => {
    notificationService.checkDeadlines();
    alert('Manual notification check triggered. Check console for logs.');
  };

  // Function to request browser notification permission
  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    alert(granted ? 'Browser notifications enabled!' : 'Browser notifications not granted.');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Notification System Test</h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Enable Browser Notifications
          </button>
          
          <button
            onClick={checkNotifications}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Check Notifications Now
          </button>
          
          <button
            onClick={createQuickTestNote}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Create Quick Test Note (30s)
          </button>
          
          <button
            onClick={createTestNote}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Create Test Note (2min)
          </button>
        </div>
        
        {testNote && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm">
              <strong>Test note created:</strong> {testNote.title}
              <br />
              <strong>Deadline:</strong> {new Date(testNote.deadline).toLocaleString()}
            </p>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>First, click "Enable Browser Notifications" to allow browser notifications</li>
            <li>Click "Create Quick Test Note (30s)" to create a note with a 30-second deadline</li>
            <li>Wait 30 seconds and you should see both a toast notification and browser notification</li>
            <li>Check the notification bell icon in the navbar for the notification count</li>
            <li>Click the bell to see the notification modal</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
