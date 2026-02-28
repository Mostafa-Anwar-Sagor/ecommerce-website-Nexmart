import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCartIcon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CameraIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { ShoppingCartIcon as CartSolid } from '@heroicons/react/24/solid';
import { RootState } from '../../store';
import { toggleTheme, setSearchQuery, toggleAIChat } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { openCart } from '../../store/slices/cartSlice';
import { markAllAsRead } from '../../store/slices/notificationSlice';
import { AppDispatch } from '../../store';
import { aiService } from '../../services/aiService';
import toast from 'react-hot-toast';

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '📱' },
  { name: 'Fashion', slug: 'fashion', icon: '👕' },
  { name: 'Home & Living', slug: 'home', icon: '🏠' },
  { name: 'Health & Beauty', slug: 'beauty', icon: '💄' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'Toys', slug: 'toys', icon: '🧸' },
  { name: 'Books', slug: 'books', icon: '📚' },
  { name: 'Automotive', slug: 'automotive', icon: '🚗' },
];

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { totalItems } = useSelector((state: RootState) => state.cart);
  const { theme, searchQuery } = useSelector((state: RootState) => state.ui);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const suggestionsTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track scroll for sticky nav styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // AI Search suggestions debounced
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const result = await aiService.getSearchSuggestions(q);
      setSuggestions(result.suggestions.slice(0, 8));
      setTrending(result.trending.slice(0, 5));
    } catch {
      // silent fail
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setLocalQuery(q);
    clearTimeout(suggestionsTimer.current);
    suggestionsTimer.current = setTimeout(() => fetchSuggestions(q), 300);
  };

  const handleSearch = (query?: string) => {
    const q = query || localQuery;
    if (!q.trim()) return;
    dispatch(setSearchQuery(q));
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice search not supported in your browser');
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLocalQuery(transcript);
      handleSearch(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice search failed');
    };
    recognition.start();
  };

  const handleImageSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const loadingToast = toast.loading('Analyzing image with AI...');
      try {
        const result = await aiService.imageSearch(file);
        toast.dismiss(loadingToast);
        if (result.products.length > 0) {
          toast.success(`Found ${result.products.length} similar products!`);
          navigate('/search?imageSearch=true', { state: { imageResults: result } });
        } else {
          toast.error('No similar products found');
        }
      } catch {
        toast.dismiss(loadingToast);
        toast.error('Image search failed');
      }
    };
    input.click();
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowUserMenu(false);
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-primary-600 dark:bg-primary-800 text-white text-xs py-1 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <span>🚀 NexMart - Shop Smarter with AI</span>
            <span className="opacity-70">|</span>
            <Link to="/flash-sale" className="hover:underline font-semibold animate-flash">
              ⚡ Flash Sale Live Now!
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            {!isAuthenticated && (
              <>
                <Link to="/auth/register" className="hover:underline">Sign Up</Link>
                <span>|</span>
                <Link to="/auth/login" className="hover:underline">Log In</Link>
              </>
            )}
            <span>Ship to 🌍 Bangladesh</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-nav'
          : 'bg-white dark:bg-gray-950 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 nexmart-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-lg">N</span>
              </div>
              <span className="font-extrabold text-xl text-primary-500 hidden sm:block tracking-tight">
                Nex<span className="text-gray-900 dark:text-white">Mart</span>
              </span>
            </Link>

            {/* Search Bar */}
            <div ref={searchRef} className="flex-1 relative max-w-2xl">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search products, brands... (AI-powered)"
                    className="w-full pl-4 pr-20 py-2.5 border-2 border-primary-400 rounded-l-full text-sm focus:outline-none focus:border-primary-500 bg-white dark:bg-gray-800 dark:text-white"
                  />
                  {/* Voice + Image search icons */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={handleImageSearch}
                      className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                      title="Search by image"
                    >
                      <CameraIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleVoiceSearch}
                      className={`p-1 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-primary-500'}`}
                      title="Voice search"
                    >
                      <MicrophoneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleSearch()}
                  className="px-5 py-2.5 nexmart-gradient text-white rounded-r-full hover:opacity-90 transition-opacity shrink-0"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>

              {/* AI Search Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (suggestions.length > 0 || trending.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {suggestions.length > 0 && (
                      <div className="p-2">
                        <p className="text-xs text-gray-400 px-3 py-1 flex items-center gap-1">
                          <SparklesIcon className="w-3 h-3" /> AI Suggestions
                        </p>
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2"
                            onClick={() => { setLocalQuery(s); handleSearch(s); }}
                          >
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {trending.length > 0 && (
                      <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 px-3 py-1">🔥 Trending</p>
                        <div className="flex flex-wrap gap-2 px-3 pb-2">
                          {trending.map((t, i) => (
                            <button
                              key={i}
                              onClick={() => { setLocalQuery(t); handleSearch(t); }}
                              className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full transition-colors"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* AI Assistant */}
              <button
                onClick={() => dispatch(toggleAIChat())}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                title="AI Shopping Assistant"
              >
                <SparklesIcon className="w-6 h-6 text-primary-500" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => dispatch(toggleTheme())}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle theme"
              >
                {theme === 'light'
                  ? <MoonIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  : <SunIcon className="w-6 h-6 text-yellow-400" />
                }
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link to="/wishlist" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:block">
                  <HeartIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </Link>
              )}

              {/* Chat */}
              {isAuthenticated && (
                <Link to="/chat" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:block">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </Link>
              )}

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (unreadCount > 0) dispatch(markAllAsRead());
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Cart */}
              <button
                onClick={() => dispatch(openCart())}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              >
                {totalItems > 0
                  ? <CartSolid className="w-6 h-6 text-primary-500" />
                  : <ShoppingCartIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                }
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {user?.avatar
                      ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-primary-300" />
                      : <UserCircleIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                    }
                  </button>
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          {user?.role === 'SELLER' && (
                            <span className="inline-block mt-1 bg-primary-100 dark:bg-primary-900 text-primary-600 text-xs px-2 py-0.5 rounded-full">Seller</span>
                          )}
                        </div>
                        <div className="py-1">
                          {[
                            { label: '👤 My Profile', to: '/profile' },
                            { label: '📦 My Orders', to: '/orders' },
                            { label: '❤️ Wishlist', to: '/wishlist' },
                            { label: '🎫 My Vouchers', to: '/vouchers' },
                            ...(user?.role === 'SELLER'
                              ? [{ label: '🏪 Seller Dashboard', to: '/seller/dashboard' }]
                              : [{ label: '🏪 Become a Seller', to: '/seller/register' }]),
                            ...(user?.role === 'ADMIN'
                              ? [{ label: '⚙️ Admin Panel', to: '/admin' }]
                              : []),
                          ].map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                          <hr className="my-1 border-gray-100 dark:border-gray-700" />
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            🚪 Log Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/auth/login" className="btn-secondary py-1.5 px-4 text-sm">
                    Login
                  </Link>
                  <Link to="/auth/register" className="btn-primary py-1.5 px-4 text-sm">
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              >
                {isMobileMenuOpen
                  ? <XMarkIcon className="w-6 h-6" />
                  : <Bars3Icon className="w-6 h-6" />
                }
              </button>
            </div>
          </div>

          {/* Category Navigation Bar */}
          <div className="hidden md:flex items-center gap-6 pb-2.5 text-sm overflow-x-auto scrollbar-hide">
            <button
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
              className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200 hover:text-primary-500 dark:hover:text-primary-400 whitespace-nowrap"
            >
              <Bars3Icon className="w-5 h-5" /> All Categories
            </button>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`flex items-center gap-1 whitespace-nowrap transition-colors hover:text-primary-500 dark:hover:text-primary-400 ${
                  location.pathname === `/category/${cat.slug}`
                    ? 'text-primary-500 font-semibold'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </Link>
            ))}
            <Link to="/flash-sale" className="flex items-center gap-1 font-semibold text-yellow-500 animate-pulse whitespace-nowrap">
              ⚡ Flash Sale
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
            >
              <div className="px-4 py-3 grid grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/category/${cat.slug}`}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-300">{cat.name}</span>
                  </Link>
                ))}
              </div>
              {!isAuthenticated && (
                <div className="px-4 pb-4 flex gap-3">
                  <Link to="/auth/login" className="flex-1 btn-secondary text-center text-sm py-2" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                  <Link to="/auth/register" className="flex-1 btn-primary text-center text-sm py-2" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
