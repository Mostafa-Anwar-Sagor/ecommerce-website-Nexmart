import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { StarsDisplay } from '../../components/product/ProductCard';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    axios.get('/api/user/wishlist').then(r => setItems(r.data.data?.items || [])).finally(() => setLoading(false));
  }, []);

  const remove = async (productId: string) => {
    await axios.delete(`/api/user/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.product?.id !== productId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Heart className="w-6 h-6 text-red-500 fill-current" /> My Wishlist</h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="shimmer-bg h-64 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-600">Your wishlist is empty</h3>
            <p className="text-gray-400 text-sm mt-1">Save products you love here</p>
            <Link to="/" className="btn-primary mt-4 inline-block">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item: any) => {
              const p = item.product;
              if (!p) return null;
              return (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative">
                    <Link to={`/product/${p.slug}`}>
                      <img src={p.images?.[0]} alt={p.name} className="w-full h-44 object-cover" />
                    </Link>
                    <button onClick={() => remove(p.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 rounded-full shadow text-red-500 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <Link to={`/product/${p.slug}`}>
                      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 hover:text-primary">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 my-1"><StarsDisplay rating={p.avgRating || 0} size="sm" /></div>
                    <p className="text-primary font-bold">${p.salePrice?.toFixed(2) || p.price?.toFixed(2)}</p>
                    <button onClick={() => handleAddToCart(p)} className="mt-2 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary hover:text-white text-primary text-sm py-1.5 rounded-lg transition-colors">
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
