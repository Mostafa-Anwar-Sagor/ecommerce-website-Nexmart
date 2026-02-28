import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { ChevronRightIcon, FireIcon, BoltIcon } from '@heroicons/react/24/solid';
import { SparklesIcon, TruckIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/product/ProductCard';
import FlashSaleTimer from '../components/home/FlashSaleTimer';
import CategoryGrid from '../components/home/CategoryGrid';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import { Product, FlashSale } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Static hero banners (UI decoration – not real data)
const HERO_BANNERS = [
  {
    id: 1,
    title: 'Shop Smarter with AI',
    subtitle: 'NexBot finds the perfect products just for you',
    cta: 'Discover Now',
    link: '/search',
    bg: 'from-primary-500 to-primary-700',
    badge: '🤖 AI-Powered',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
  },
  {
    id: 2,
    title: '⚡ Flash Sale is LIVE!',
    subtitle: 'Up to 80% off on selected items',
    cta: 'Shop Flash Sale',
    link: '/flash-sale',
    bg: 'from-yellow-500 to-orange-600',
    badge: '⏰ Limited Time',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80',
  },
  {
    id: 3,
    title: 'New Arrivals 2026',
    subtitle: 'Latest tech, fashion & more',
    cta: 'Browse New',
    link: '/search?sortBy=newest',
    bg: 'from-blue-500 to-indigo-700',
    badge: '✨ Just Arrived',
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&q=80',
  },
];

const TRUST_BADGES = [
  { icon: TruckIcon, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheckIcon, title: 'Secure Payment', desc: '100% encrypted checkout' },
  { icon: ArrowPathIcon, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: SparklesIcon, title: 'AI Shopping', desc: 'Smart recommendations' },
];

// Skeleton component
const ProductSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="shimmer-bg aspect-square"></div>
    <div className="p-3 space-y-2">
      <div className="shimmer-bg h-3 rounded w-3/4"></div>
      <div className="shimmer-bg h-3 rounded w-1/2"></div>
      <div className="shimmer-bg h-4 rounded w-1/3"></div>
    </div>
  </div>
);

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flashSaleEndTime] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 6);
    return end.toISOString();
  });

  const fetchHomeData = useCallback(async () => {
    try {
      const [featured, flash, arrivals] = await Promise.all([
        productService.getFeaturedProducts(),
        productService.getFlashSaleProducts(),
        productService.getProducts({ sortBy: 'newest', limit: 8 }).then((r) => r.data),
      ]);
      setFeaturedProducts(featured);
      setFlashSaleProducts(flash);
      setNewArrivals(arrivals);

      // Fetch AI recommendations if authenticated
      if (isAuthenticated && user?.id) {
        try {
          const rec = await aiService.getRecommendations({ userId: user.id, limit: 8 });
          setRecommendations(rec.products);
        } catch {
          // silent fail for recommendations
        }
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  return (
    <div className="min-h-screen">
      {/* Hero Banner Slider */}
      <section className="relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          loop
          className="w-full"
        >
          {HERO_BANNERS.map((banner) => (
            <SwiperSlide key={banner.id}>
              <div className={`bg-gradient-to-r ${banner.bg} relative h-64 md:h-80 lg:h-96 overflow-hidden`}>
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${banner.image})` }}
                />
                <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-white max-w-lg"
                  >
                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      {banner.badge}
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight">
                      {banner.title}
                    </h1>
                    <p className="text-white/80 text-base md:text-lg mb-6">{banner.subtitle}</p>
                    <Link
                      to={banner.link}
                      className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all hover:scale-105"
                    >
                      {banner.cta} <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-10 py-8">
        {/* Category Grid */}
        <section>
          <CategoryGrid />
        </section>

        {/* Trust Badges */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center shrink-0">
                <badge.icon className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{badge.title}</p>
                <p className="text-xs text-gray-500">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ⚡ Flash Sale Section */}
        <section className="card overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BoltIcon className="w-6 h-6 text-white" />
              <h2 className="text-white font-extrabold text-xl tracking-wide">FLASH SALE</h2>
              <FlashSaleTimer endTime={flashSaleEndTime} />
            </div>
            <Link to="/flash-sale" className="flex items-center gap-1 bg-white text-orange-600 font-bold text-sm px-4 py-1.5 rounded-full hover:shadow-md transition-all">
              See All <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : flashSaleProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {flashSaleProducts.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">No flash sale items right now. Check back soon!</p>
            )}
          </div>
        </section>

        {/* 🤖 AI Recommendations (if logged in) */}
        {isAuthenticated && recommendations.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Picks for You
                </h2>
                <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  Personalized
                </span>
              </div>
              <Link to="/search?ai=true" className="text-primary-500 text-sm hover:underline flex items-center gap-1">
                More <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {recommendations.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 🔥 Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Products</h2>
            </div>
            <Link to="/search?sortBy=sold" className="text-primary-500 text-sm hover:underline flex items-center gap-1">
              View All <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(10).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredProducts.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Promo Banner */}
        <section className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Electronics Sale', subtitle: 'Up to 50% off', emoji: '📱', color: 'from-blue-500 to-indigo-600', link: '/category/electronics' },
            { title: 'Fashion Week', subtitle: 'New styles every day', emoji: '👗', color: 'from-pink-500 to-rose-600', link: '/category/fashion' },
            { title: 'Home Makeover', subtitle: 'Transform your space', emoji: '🏠', color: 'from-green-500 to-emerald-600', link: '/category/home' },
          ].map((promo, i) => (
            <Link key={i} to={promo.link}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-r ${promo.color} rounded-2xl p-6 text-white flex items-center justify-between cursor-pointer`}
              >
                <div>
                  <h3 className="font-extrabold text-lg">{promo.title}</h3>
                  <p className="text-white/80 text-sm mt-0.5">{promo.subtitle}</p>
                  <span className="inline-block mt-3 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Shop Now →
                  </span>
                </div>
                <span className="text-5xl">{promo.emoji}</span>
              </motion.div>
            </Link>
          ))}
        </section>

        {/* New Arrivals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ✨ New Arrivals
            </h2>
            <Link to="/search?sortBy=newest" className="text-primary-500 text-sm hover:underline flex items-center gap-1">
              View All <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {newArrivals.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* AI Feature Banner */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-700 rounded-2xl p-8 text-white text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-8 text-6xl">🤖</div>
              <div className="absolute top-4 right-8 text-6xl">✨</div>
              <div className="absolute bottom-4 left-1/3 text-4xl">🛍️</div>
            </div>
            <div className="relative z-10">
              <SparklesIcon className="w-10 h-10 mx-auto mb-3 text-yellow-300" />
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Meet NexBot – Your AI Shopping Assistant</h2>
              <p className="text-white/80 max-w-xl mx-auto mb-5">
                Ask anything, find anything. Our GPT-4 powered assistant helps you discover products,
                compare prices, detect fake reviews, and shop smarter.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-5">
                {['Visual Search', 'Price Predictions', 'Review Summary', 'Size Guide', 'Smart Compare'].map((f) => (
                  <span key={f} className="bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    ✓ {f}
                  </span>
                ))}
              </div>
              <button className="bg-white text-primary-600 font-extrabold px-8 py-3 rounded-xl hover:shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Try NexBot Free
              </button>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-12 px-4 text-center">
        <h3 className="text-2xl font-bold mb-2">Download the NexMart App</h3>
        <p className="text-gray-400 mb-6">Shop on the go with exclusive app-only deals!</p>
        <div className="flex justify-center gap-4">
          <button className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            🍎 App Store
          </button>
          <button className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            🤖 Google Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
