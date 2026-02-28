import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '📱',
  fashion: '👕',
  'home-living': '🏠',
  beauty: '💄',
  sports: '⚽',
  'toys-kids': '🧸',
  books: '📚',
  'food-grocery': '🛒',
  automotive: '🚗',
  health: '💊',
  pets: '🐾',
  gaming: '🎮',
  travel: '✈️',
};

const CATEGORY_COLORS: Record<string, string> = {
  electronics: 'from-blue-500 to-blue-700',
  fashion: 'from-pink-500 to-rose-600',
  'home-living': 'from-green-500 to-emerald-700',
  beauty: 'from-purple-500 to-violet-700',
  sports: 'from-orange-500 to-red-600',
  'toys-kids': 'from-yellow-400 to-orange-500',
  books: 'from-indigo-500 to-blue-700',
  'food-grocery': 'from-lime-500 to-green-600',
  automotive: 'from-gray-600 to-gray-800',
  health: 'from-teal-500 to-cyan-700',
  pets: 'from-amber-500 to-yellow-600',
  gaming: 'from-violet-500 to-purple-700',
};

const CategoryGridSkeleton = () => (
  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-2xl shimmer-bg"></div>
        <div className="w-12 h-3 rounded shimmer-bg"></div>
      </div>
    ))}
  </div>
);

const CategoryGrid: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || []);
      } catch {
        // Silently fail — categories not critical
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) return <CategoryGridSkeleton />;

  if (!categories.length) return null;

  return (
    <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
      {categories.map((cat, i) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            to={`/category/${cat.slug}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[cat.slug] || 'from-primary-500 to-primary-700'} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200`}
            >
              <span className="text-2xl" role="img" aria-label={cat.name}>
                {CATEGORY_ICONS[cat.slug] || '🛍️'}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center group-hover:text-primary-500 transition-colors leading-tight">
              {cat.name}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default CategoryGrid;
