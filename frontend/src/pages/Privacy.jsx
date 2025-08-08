
import React from "react";
import { motion } from "framer-motion";
import PageHeader from '../components/PageHeader';
import { ShieldCheckIcon, LockClosedIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function Privacy() {
  return (
    <div className="w-full">
      <PageHeader title="Privacy" subtitle="Your privacy is our top priority" />
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className=""
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100/50 border border-indigo-200/50"
          >
            <ShieldCheckIcon className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-2">Privacy Policy</h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 font-medium">Your privacy is our top priority</p>
        </div>

        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-200/30 transition-all duration-300 p-6 border border-indigo-100/50 animate-fadeIn"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-md shadow-indigo-100/30 border border-indigo-200/30">
                <LockClosedIcon className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">Data Protection</h2>
                <p className="text-indigo-700/80">
                  We implement robust security measures to protect your personal information. All data is encrypted
                  using industry-standard protocols and stored securely on our servers.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Information Collection</h2>
                <p className="text-gray-600">
                  We collect only the information necessary to provide our services. This includes your name, email,
                  and department information. We never share your data with third parties without your consent.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Rights</h2>
                <p className="text-gray-600">
                  You have the right to access, modify, or delete your personal information at any time. Contact our
                  support team if you need assistance with any privacy-related concerns.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          Last updated: {new Date().toLocaleDateString()}
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}