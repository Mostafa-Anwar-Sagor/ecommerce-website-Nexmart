import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import FlashSaleTimer from '../components/home/FlashSaleTimer';
import ProductCard from '../components/product/ProductCard';
import axios from 'axios';

export default function FlashSalePage() {
  const [flashSale, setFlashSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/products/flash-sale').then(r => setFlashSale(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="shimmer-bg h-32 rounded-2xl mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="shimmer-bg h-64 rounded-xl" />)}
      </div>
    </div>
  );

  if (!flashSale) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Zap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-600">No active flash sale right now</h2>
      <p className="text-gray-400 mt-2">Check back later for amazing deals!</p>
      <Link to="/" className="btn-primary mt-6 inline-block">Browse All Products</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="nexmart-gradient py-8 px-4 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="w-8 h-8 fill-white" />
            <h1 className="text-3xl font-black">{flashSale.title}</h1>
            <Zap className="w-8 h-8 fill-white" />
          </div>
          <p className="mb-4 opacity-90">Grab these deals before they're gone!</p>
          <div className="flex justify-center">
            <FlashSaleTimer endTime={flashSale.endTime} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {flashSale.products?.map((fp: any, i: number) => (
            <motion.div key={fp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProductCard product={{ ...fp.product, flashSaleProducts: [fp] }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
