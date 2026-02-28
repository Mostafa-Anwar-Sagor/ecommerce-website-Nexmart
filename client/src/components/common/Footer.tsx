import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  const links = {
    Company: [
      { label: 'About NexMart', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
      { label: 'Blog', to: '/blog' },
    ],
    'Help & Support': [
      { label: 'Help Center', to: '/help' },
      { label: 'How to Buy', to: '/how-to-buy' },
      { label: 'Returns & Refunds', to: '/returns' },
      { label: 'Contact Us', to: '/contact' },
    ],
    Sellers: [
      { label: 'Sell on NexMart', to: '/seller/register' },
      { label: 'Seller Dashboard', to: '/seller/dashboard' },
      { label: 'Seller Education', to: '/seller/edu' },
      { label: 'Seller Policies', to: '/seller/policies' },
    ],
    Policies: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Accessibility', to: '/accessibility' },
    ],
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-8 border-b border-gray-700">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 nexmart-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-lg">N</span>
              </div>
              <span className="font-extrabold text-xl text-white">NexMart</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              AI-powered e-commerce platform. Shop smarter, sell better.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-primary-400 font-medium">Powered by GPT-4 AI</span>
            </div>
            {/* Social Links */}
            <div className="flex gap-3">
              {['🐦', '📘', '📸', '💼', '▶️'].map((icon, i) => (
                <button
                  key={i}
                  className="w-8 h-8 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors text-sm"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-3">{heading}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods & Trust Badges */}
        <div className="py-6 border-b border-gray-700">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <span className="text-xs text-gray-500 mr-2">Secure Payments:</span>
            {['💳 Visa', '💳 Mastercard', '💰 PayPal', '📱 Stripe', '🏦 Bank Transfer'].map((p) => (
              <span key={p} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-lg">{p}</span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {year} NexMart Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>All systems operational</span>
          </div>
          <p className="flex items-center gap-1">
            Built with <SparklesIcon className="w-3 h-3 text-primary-400" /> AI + ❤️ for great shopping
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
