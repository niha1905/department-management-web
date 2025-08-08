import React, { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserListItem({ user }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useEffect(() => {
    // Subscribe to notification updates
    const update = () => {
      const count = notificationService.getUnreadCountForUser(user.email);
      if (count > unreadCount) {
        setHasNewMessage(true);
        // Reset the animation after 2 seconds
        setTimeout(() => setHasNewMessage(false), 2000);
      }
      setUnreadCount(count);
    };
    notificationService.addListener(update);
    update(); // Initial
    return () => notificationService.removeListener(update);
  }, [user.email, unreadCount]);

  return (
    <div className="relative flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        
        {/* WhatsApp-like notification bubble */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div 
              initial={{ scale: hasNewMessage ? 0.5 : 1, opacity: hasNewMessage ? 0 : 1 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                y: hasNewMessage ? [0, -5, 0] : 0
              }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                duration: 0.3
              }}
              className="absolute -top-1 -right-1 flex items-center justify-center">
              <span className="flex items-center justify-center bg-green-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1">
                {unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="ml-2 flex-1">
        <div className="font-medium flex items-center justify-between">
          <span>{user.name}</span>
          {hasNewMessage && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-green-500 mr-2">
              New message
            </motion.span>
          )}
        </div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </div>
    </div>
  );
}
