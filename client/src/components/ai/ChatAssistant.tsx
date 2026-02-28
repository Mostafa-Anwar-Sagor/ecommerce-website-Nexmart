import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { toggleAIChat } from '../../store/slices/uiSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { aiService } from '../../services/aiService';
import { AIChatMessage, Product } from '../../types';
import toast from 'react-hot-toast';

const INITIAL_MESSAGE: AIChatMessage = {
  id: 'init',
  role: 'assistant',
  content: `👋 Hi! I'm **NexBot**, your AI shopping assistant powered by GPT-4!

I can help you with:
🔍 **Find products** - "Show me wireless earbuds under $50"
💡 **Get recommendations** - "What's the best laptop for coding?"
📊 **Compare products** - "Compare iPhone 15 vs Samsung S24"
💰 **Price alerts** - "Tell me when this drops in price"
📦 **Track orders** - "Where is my order?"
🎁 **Gift ideas** - "Gift ideas for a 10-year-old"

What can I help you with today?`,
  createdAt: new Date().toISOString(),
};

const QUICK_PROMPTS = [
  '🎧 Best earbuds under $50',
  '💻 Top laptops for students',
  '🎁 Gift ideas for her',
  '📱 Latest smartphones',
  '🏋️ Home workout equipment',
];

const AIChat: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAIChatOpen } = useSelector((state: RootState) => state.ui);
  const [messages, setMessages] = useState<AIChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAIChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isAIChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(messages, messageText);
      setMessages((prev) => [...prev, response]);
    } catch {
      const errorMsg: AIChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again! 🔄",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAddProductToCart = (product: Product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart! 🛒`);
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
  };

  // Render markdown-like content
  const renderContent = (content: string) => {
    const parts = content.split('\n');
    return parts.map((line, i) => {
      // Bold text **text**
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < parts.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <AnimatePresence>
      {isAIChatOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => dispatch(toggleAIChat())}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-4 right-4 w-full max-w-sm md:max-w-md h-[600px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="nexmart-gradient px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">NexBot AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white/80 text-xs">Powered by GPT-4</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Reset conversation"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => dispatch(toggleAIChat())}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 nexmart-gradient rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <SparklesIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-last' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'nexmart-gradient text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                      }`}
                    >
                      {renderContent(msg.content)}
                    </div>

                    {/* Product Cards from AI */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.products.slice(0, 3).map((product) => (
                          <div
                            key={product.id}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 flex gap-3 shadow-sm"
                          >
                            <Link to={`/product/${product.slug}`} onClick={() => dispatch(toggleAIChat())}>
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-14 h-14 object-cover rounded-lg"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/product/${product.slug}`} onClick={() => dispatch(toggleAIChat())}>
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 line-clamp-2 hover:text-primary-500">
                                  {product.name}
                                </p>
                              </Link>
                              <p className="text-sm font-bold text-primary-500 mt-0.5">${product.price.toFixed(2)}</p>
                              <button
                                onClick={() => handleAddProductToCart(product)}
                                className="mt-1 flex items-center gap-1 text-[11px] text-primary-500 hover:text-primary-600 font-medium"
                              >
                                <ShoppingCartIcon className="w-3 h-3" /> Add to cart
                              </button>
                            </div>
                          </div>
                        ))}
                        {msg.products.length > 3 && (
                          <p className="text-xs text-gray-400 text-center">
                            + {msg.products.length - 3} more products
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="w-7 h-7 nexmart-gradient rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-white animate-spin-slow" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-xs whitespace-nowrap bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-200 hover:text-primary-600 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-primary-400 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask NexBot anything..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none resize-none max-h-28 leading-relaxed py-0.5"
                  style={{ minHeight: '24px' }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-lg transition-all ${
                    input.trim() && !isLoading
                      ? 'nexmart-gradient text-white shadow-md hover:opacity-90'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                AI may make mistakes. Verify important info.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChat;
