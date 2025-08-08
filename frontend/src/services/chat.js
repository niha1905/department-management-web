import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getUnreadChats = async (userEmail) => {
  const res = await axios.get(`${API_URL}/api/chat/unread?user_email=${encodeURIComponent(userEmail)}`);
  return res.data;
};

export const markChatAsRead = async (chatId, userEmail) => {
  const res = await axios.patch(`${API_URL}/api/chat/rooms/${chatId}/read`, { user_email: userEmail });
  return res.data;
};
