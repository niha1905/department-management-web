import React, { useState, useEffect } from "react";
import { createUser, fetchUsers, deleteUser } from "../services/api";

// Fallback: define isAdmin here if not exported from api.js
function isAdmin() {
  return sessionStorage.getItem('role') === 'admin';
}
import { motion } from "framer-motion";
import { UserPlusIcon, UserGroupIcon, TrashIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

const DEPARTMENTS = ["Finance", "CAD", "Audit"];

// Main component for admin user management (create, list, delete users)
export default function ManageUsers() {
  // State for form, users, loading, error, success
  const [tab, setTab] = useState("create");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: DEPARTMENTS[0],
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Use sessionStorage for admin email
  const adminEmail = sessionStorage.getItem('email') || "";

  // Restrict this page to admin only
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (tab === "manage") {
      setIsLoading(true);
      fetchUsers()
        .then(data => setUsers(data.users || []))
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [tab]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    setIsLoading(true);
    try {
      // Use adminEmail from sessionStorage
      if (!adminEmail) {
        setError("Admin email not found. Please log in again.");
        setIsLoading(false);
        return;
      }
      await createUser({
        ...formData,
        admin_email: adminEmail,
        // The password is set directly from the form, no email is sent
      });
      setSuccess("User created in database with chosen password! Let me know if you need backend adjustments for this as well!");
      setFormData({ name: "", email: "", password: "", phone: "", department: DEPARTMENTS[0] });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError("You are not authorized to create users.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async userId => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Only users with role 'admin' are admins
  const admins = users.filter(u => u.role === "admin");
  // Only users with role 'users' are members
  const members = users.filter(u => u.role === "member");

  // Renders UI for creating users and managing (listing/deleting) users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Create and manage user accounts</p>
          {adminEmail && (
            <div className="mt-2 text-xs text-blue-500">
              <span>Logged in as: <b>{adminEmail}</b></span>
            </div>
          )}
        </div>

        <div className="flex space-x-4 mb-8 border-b">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-colors ${
              tab === "create" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setTab("create")}
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Create User
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center px-6 py-3 font-medium rounded-t-lg transition-colors ${
              tab === "manage" 
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setTab("manage")}
          >
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Manage Users
          </motion.button>
        </div>

        {tab === "create" && (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleCreate}
            className="space-y-6"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlusIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter user's name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-3"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-3"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter user's phone"
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating User...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlusIcon className="w-5 h-5 mr-2" />
                  Create User
                </div>
              )}
            </motion.button>
          </motion.form>
        )}

        {tab === "manage" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <UserGroupIcon className="w-6 h-6 mr-2 text-blue-600" />
                Administrators
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No administrators found
                          </td>
                        </tr>
                      ) : (
                        admins.map(u => (
                          <tr key={u._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(u._id)}
                                className="text-red-600 hover:text-red-900 flex items-center justify-end"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </motion.button>
                            </td>
                          </tr>
                        )))
                    }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <UserGroupIcon className="w-6 h-6 mr-2 text-purple-600" />
                Members
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No members found
                          </td>
                        </tr>
                      ) : (
                        members.map(u => (
                          <tr key={u._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(u._id)}
                                className="text-red-600 hover:text-red-900 flex items-center justify-end"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </motion.button>
                            </td>
                          </tr>
                        )))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}