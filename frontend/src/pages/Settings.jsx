import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "../services/api";
import { motion } from "framer-motion";
import { UserCircleIcon, BellIcon, ShieldCheckIcon, KeyIcon } from "@heroicons/react/24/outline";
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [section, setSection] = useState("account");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Use sessionStorage for user info
  const name = sessionStorage.getItem("name") || "-";
  const email = sessionStorage.getItem("email") || "-";
  const phone = sessionStorage.getItem("phone") || "-";

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }
    try {
      await updatePassword({
        email,
        old_password: oldPass,
        new_password: newPass,
      });
      setSuccess("Password updated! Please log in again.");
      setTimeout(() => {
        sessionStorage.clear();
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mt-6"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100/50 border border-indigo-200/50"
          >
            <UserCircleIcon className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-2">Settings</h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 font-medium">Manage your account preferences</p>
        </div>

        <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-100/50 p-6 animate-fadeIn hover:shadow-lg hover:shadow-indigo-200/30 transition-all duration-300">
          <div className="flex space-x-4 mb-8 border-b border-indigo-100/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-all duration-300 ${
                section === "account" 
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 border-b-2 border-indigo-500 shadow-sm" 
                  : "text-gray-600 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:text-indigo-600"
              }`}
              onClick={() => setSection("account")}
            >
              <UserCircleIcon className={`w-5 h-5 mr-2 ${section === "account" ? "text-indigo-500" : "text-gray-500"}`} />
              Account
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-colors ${
                section === "notifications" 
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setSection("notifications")}
            >
              <BellIcon className="w-5 h-5 mr-2" />
              Notifications
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-colors ${
                section === "privacy" 
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setSection("privacy")}
            >
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Privacy
            </motion.button>
          </div>
          {section === "account" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                  <p className="text-lg font-semibold text-gray-800">{name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-lg font-semibold text-gray-800">{email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                  <p className="text-lg font-semibold text-gray-800">{phone}</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setShowChangePassword(true)}
              >
                <KeyIcon className="w-5 h-5 mr-2" />
                Change Password
              </motion.button>

              {showChangePassword && (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handlePasswordChange}
                  className="space-y-4 bg-gray-50 p-6 rounded-lg"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={oldPass}
                      onChange={e => setOldPass(e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm"
                    >
                      {error}
                    </motion.p>
                  )}
                  {success && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-green-600 text-sm"
                    >
                      {success}
                    </motion.p>
                  )}
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowChangePassword(false)}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </motion.div>
          )}

          {section === "notifications" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Push Notifications</h4>
                      <p className="text-sm text-gray-600">Receive real-time updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {section === "privacy" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Profile Visibility</h4>
                      <p className="text-sm text-gray-600">Control who can see your profile</p>
                    </div>
                    <select className="rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Public</option>
                      <option>Private</option>
                      <option>Friends Only</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Activity Status</h4>
                      <p className="text-sm text-gray-600">Show when you're active</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
