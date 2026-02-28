import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import toast from 'react-hot-toast';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'login' | 'register';
}

// Demo Google accounts
const DEMO_ACCOUNTS = [
  {
    sub: 'google_demo_buyer_001',
    name: 'Alex Thompson',
    email: 'alex.thompson@gmail.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=b6e3f4',
  },
  {
    sub: 'google_demo_buyer_002',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=ffdfbf',
  },
  {
    sub: 'google_demo_seller_001',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@gmail.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus&backgroundColor=c0aede',
  },
];

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess, mode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const signInWithAccount = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setIsLoading(true);
    setLoadingId(account.sub);
    try {
      const response = await api.post('/auth/google', {
        token: 'NEXMART_DEMO_TOKEN',
        sub: account.sub,
        email: account.email,
        name: account.name,
        picture: account.picture,
      });
      const { user, accessToken, refreshToken } = response.data.data;

      // Update Redux store
      dispatch({ type: 'auth/googleAuth/fulfilled', payload: { user, accessToken, refreshToken } });

      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      toast.success(mode === 'register' ? `Welcome, ${user.name}! 🎉` : `Welcome back, ${user.name}! 👋`);
      onSuccess();
    } catch {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingId(null);
    }
  };

  const signInWithCustom = async () => {
    if (!customName.trim() || !customEmail.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) {
      toast.error('Please enter a valid email');
      return;
    }
    const sub = `google_custom_${customEmail.replace(/[^a-z0-9]/gi, '_')}`;
    await signInWithAccount({
      sub,
      name: customName.trim(),
      email: customEmail.trim().toLowerCase(),
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customEmail)}&backgroundColor=b6e3f4`,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Google Header */}
            <div className="px-8 pt-8 pb-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-center mb-5">
                <svg viewBox="0 0 74 24" className="h-6">
                  <path fill="#4285F4" d="M 19.152 10.38 h -8.928 v 2.64 h 5.832 c -0.264 1.368 -1.056 2.52 -2.208 3.288 v 2.784 h 3.576 c 2.088 -1.92 3.288 -4.776 3.288 -8.136 c 0 -0.192 0 -0.384 -0.024 -0.576 z"/>
                  <path fill="#34A853" d="M 10.8 21.6 c 2.976 0 5.472 -0.984 7.296 -2.664 l -3.576 -2.784 c -0.984 0.672 -2.256 1.056 -3.72 1.056 c -2.88 0 -5.304 -1.944 -6.168 -4.56 H 0.936 v 2.856 C 2.76 19.224 6.504 21.6 10.8 21.6 z"/>
                  <path fill="#FBBC05" d="M 4.632 12.648 c -0.216 -0.672 -0.336 -1.392 -0.336 -2.112 s 0.12 -1.44 0.336 -2.112 V 6.36 H 0.936 C 0.336 7.608 0 9.024 0 10.536 s 0.336 2.928 0.936 4.176 l 3.696 -2.064 z"/>
                  <path fill="#EA4335" d="M 10.8 4.2 c 1.632 0 3.096 0.552 4.248 1.656 l 3.168 -3.168 C 16.272 0.936 13.776 0 10.8 0 C 6.504 0 2.76 2.376 0.936 6.12 l 3.696 2.064 C 5.496 5.568 7.92 4.2 10.8 4.2 z"/>
                  <text x="27" y="18" fontFamily="Arial, sans-serif" fontSize="16" fill="#5F6368" fontWeight="500">Sign in</text>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                {mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1.5">
                Choose a demo account to continue to NexMart
              </p>
            </div>

            {/* Accounts List */}
            <div className="py-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.sub}
                  onClick={() => signInWithAccount(account)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 text-left"
                >
                  <div className="relative shrink-0">
                    <img
                      src={account.picture}
                      alt={account.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-100 dark:border-gray-700 object-cover bg-gray-100"
                    />
                    {/* Google G badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{account.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
                  </div>
                  {loadingId === account.sub ? (
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 rotate-[-90deg] shrink-0" />
                  )}
                </button>
              ))}

              {/* Add / Use another account */}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
                  <PlusIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Use another account</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enter your own name & email</p>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${showCustom ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Custom account form */}
              <AnimatePresence>
                {showCustom && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 pt-1 space-y-3">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="email"
                        placeholder="your.email@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && signInWithCustom()}
                        className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        onClick={signInWithCustom}
                        disabled={isLoading}
                        className="w-full btn-primary py-2.5 rounded-xl text-sm disabled:opacity-60"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Signing in...
                          </span>
                        ) : 'Continue'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-400">
                Demo mode — no real Google credentials required.{' '}
                <span className="text-primary-500">NexMart Portfolio Project</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GoogleAuthModal;
