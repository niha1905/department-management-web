(function() {
  // Content script for Chrome extension: records audio in Google Meet, uploads to backend

  // Prevents double-injection
  if (window.hasRunAiSpaceRecorder) {
    console.log("AiSpace recorder already loaded");
    return;
  }
  window.hasRunAiSpaceRecorder = true;
  console.log("AiSpace recorder loaded ONCE");

  // Handles audio recording, uploading, and status display
  let isRecording = false;
  let mediaRecorder;
  let recordedChunks = [];
  let mediaStream; // Add this variable to hold the stream

  function startRecording() {
    console.log('startRecording called');
    if (isRecording) return;
    isRecording = true;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaStream = stream; // Store the stream
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        mediaRecorder.ondataavailable = e => {
          console.log('dataavailable event, data size:', e.data.size);
          if (e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          console.log('Recording stopped, uploading audio blob');
          // Clean up the stream and mediaRecorder
          if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
          }
          mediaRecorder = null;
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', blob, `meeting-recording-${Date.now()}.webm`);
          formData.append('event_id', window.location.pathname.slice(1,));
          
          fetch('http://192.168.1.100:5000/upload_audio', {
            method: 'POST',
            body: formData
          })
            .then(res => res.json())
            .then(data => {
              console.log('Transcription complete:', data);
              showStatus('Transcription complete!');
            })
            .catch(err => {
              console.error('Transcription upload failed:', err);
              showStatus('Transcription upload failed.');
            });
        };
        mediaRecorder.start();
        showStatus("Recording started!");
      })
      .catch(err => {
        showStatus("Microphone access denied.");
        isRecording = false;
      });
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      showStatus("Recording stopped.");
    }
  }

  function showStatus(msg) {
    let statusDiv = document.getElementById("aispace-status");
    if (!statusDiv) {
      statusDiv = document.createElement("div");
      statusDiv.id = "aispace-status";
      statusDiv.style.position = "fixed";
      statusDiv.style.top = "10px";
      statusDiv.style.right = "10px";
      statusDiv.style.zIndex = 99999;
      statusDiv.style.background = "#222";
      statusDiv.style.color = "#fff";
      statusDiv.style.padding = "10px 18px";
      statusDiv.style.borderRadius = "8px";
      statusDiv.style.fontSize = "16px";
      document.body.appendChild(statusDiv);
    }
    statusDiv.innerText = msg;
    setTimeout(() => statusDiv.remove(), 3000);
  }

  // Listens for messages from popup/background to start/stop recording
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "START_RECORDING") startRecording();
    if (msg.action === "STOP_RECORDING") stopRecording();
    if (msg.action === "TOGGLE_AUTO_RECORD") {
      chrome.storage.local.set({ aispace_auto_record: msg.value });
      showStatus(
        msg.value
          ? "Auto-record enabled for future meetings."
          : "Auto-record disabled for future meetings."
      );
    }
  });

})();

