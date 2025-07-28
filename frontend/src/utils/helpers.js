// Format relative date similar to WhatsApp (Today, Yesterday, etc.)
export const formatRelativeDate = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  
  // Same day
  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // Within the same week
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 6);
  if (date >= oneWeekAgo) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  // This month
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  
  // Default format
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Get language name from language code
export const getLanguageName = (code) => {
  const languages = {
    'en-US': 'English (US)',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'ja-JP': 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
    'ru-RU': 'Russian',
    'hi-IN': 'Hindi',
    'ar-SA': 'Arabic'
  };
  
  return languages[code] || code;
};

// Group transcriptions by date
export const groupTranscriptionsByDate = (transcriptions) => {
  const groups = {};
  
  transcriptions.forEach(transcription => {
    const date = transcription.created_at;
    const groupKey = formatRelativeDate(date);
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(transcription);
  });
  
  return groups;
};
