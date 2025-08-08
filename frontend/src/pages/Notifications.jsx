import React, { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from '../components/PageHeader';
import { BellIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

// Main notifications page (currently static demo, can be connected to notificationService)
export default function Notifications() {
  // State for active tab, sample notifications
  const [activeTab, setActiveTab] = useState("all");

  const notifications = [
    {
      id: 1,
      type: "message",
      title: "New Message",
      content: "John sent you a message about the project update",
      time: "5 minutes ago",
      icon: ChatBubbleLeftRightIcon,
      color: "blue"
    },
    {
      id: 2,
      type: "email",
      title: "Email Notification",
      content: "Your weekly report is ready to view",
      time: "1 hour ago",
      icon: EnvelopeIcon,
      color: "green"
    },
    {
      id: 3,
      type: "system",
      title: "System Update",
      content: "New features have been added to the dashboard",
      time: "2 hours ago",
      icon: BellIcon,
      color: "purple"
    }
  ];

  // Renders UI for notifications list, tabs, empty state
  return (
    <div className="w-full">
      <PageHeader title="Notifications" subtitle="Stay updated with your latest activities" />
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className=""
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--gm-aqua)]/15"
          >
            <BellIcon className="w-8 h-8 text-[var(--gm-aqua)]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your latest activities</p>
        </div>

        <div className="flex space-x-4 mb-6 border-b border-[var(--color-border)]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === "all" 
                ? "bg-[rgba(63,255,224,0.12)] text-[var(--gm-aqua)] border-b-2 border-[var(--gm-aqua)]" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("all")}
          >
            <BellIcon className="w-5 h-5 mr-2" />
            All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === "unread" 
                ? "bg-[rgba(63,255,224,0.12)] text-[var(--gm-aqua)] border-b-2 border-[var(--gm-aqua)]" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("unread")}
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" />
            Unread
          </motion.button>
        </div>

        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-[var(--gm-white)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-shadow p-6 border border-[var(--color-border)]"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${notification.color === 'blue' ? 'bg-[var(--gm-aqua)]/15 text-[var(--gm-aqua)]' : notification.color === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <notification.icon className={`w-6 h-6`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">{notification.title}</h2>
                    <span className="text-sm text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </motion.div>
        )}
      </motion.div>
      </div>
    </div>
  );
}