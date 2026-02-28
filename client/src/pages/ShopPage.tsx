import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Package, MessageCircle, Shield } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/product/ProductCard';

export default function ShopPage() {
  const { id } = useParams<{ id: string }>();
  const [shopData, setShopData] = useState<{ shop: any; products: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`/api/search/shop/${id}`).then(r => setShopData(r.data.data)).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="shimmer-bg h-40 rounded-2xl mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer-bg h-64 rounded-xl" />)}
      </div>
    </div>
  );

  if (!shopData) return <div className="text-center py-20 text-gray-500">Shop not found</div>;

  const { shop, products } = shopData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Shop Banner */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-primary/20 to-orange-100 dark:from-primary/10 dark:to-orange-950/30"
          style={shop.coverImage ? { backgroundImage: `url(${shop.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="container mx-auto px-4">
          <div className="relative -top-10 flex items-end gap-4">
            <img src={shop.logo || `https://ui-avatars.com/api/?name=${shop.name}&size=80`} alt={shop.name}
              className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg object-cover" />
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{shop.name}</h1>
                {shop.isVerified && <Shield className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{shop.rating}</span>
                <span className="flex items-center gap-1"><Package className="w-4 h-4" />{shop._count?.products || 0} products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {shop.description && <p className="text-gray-600 dark:text-gray-400 mb-6">{shop.description}</p>}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Products ({products.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
