import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signupUser } from "../services/api";
import { cn, buttonVariants, inputStyles } from "../utils/styles";
import { UserPlusIcon, EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signupUser(email, password, "admin", "", name, phone);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gm-dark-section p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[var(--gm-white)] p-8 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-[var(--color-border)]"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--gm-aqua)]/15"
          >
            <ShieldCheckIcon className="w-8 h-8 text-[var(--gm-aqua)]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Signup</h1>
          <p className="text-white/80">Create a new admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              className={cn(inputStyles)}
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-200 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              className={cn(inputStyles)}
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                id="email"
                className={cn(inputStyles, "pl-10")}
                placeholder="Enter admin email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                id="password"
                className={cn(inputStyles, "pl-10")}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 rounded-2xl font-medium transition-all",
              buttonVariants.primary,
              isLoading && "opacity-75 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Create Admin Account
              </div>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/80">
            Already registered?{" "}
            <Link 
              to="/login" 
              className="text-[var(--gm-aqua)] hover:opacity-80 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
