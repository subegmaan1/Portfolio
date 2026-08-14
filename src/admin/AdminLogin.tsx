import React, { useState } from 'react';
import { adminLogin } from '../lib/api';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminLogin(password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Invalid password');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-800 text-neutral-100 rounded">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-lg text-neutral-100">
                ADMIN AUTHENTICATION
              </h2>
              <p className="font-mono text-[10px] text-neutral-400 uppercase">
                SUBEG SINGH Portfolio Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="font-mono text-xs text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-mono text-xs text-neutral-400 uppercase">
                Admin Password
              </label>
              <button
                type="button"
                onClick={() => setPassword('subeg2026')}
                className="font-mono text-[10px] text-teal-400/80 hover:text-teal-300 transition-colors cursor-pointer"
                title="Autofill default password"
              >
                (Default: subeg2026)
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password (subeg2026)..."
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-teal-500 font-mono text-sm"
              autoFocus
              required
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="font-mono text-[10px] text-neutral-500">
              Press Enter or click Login
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md"
              id="admin-login-submit-btn"
            >
              <span>{loading ? 'Authenticating...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
