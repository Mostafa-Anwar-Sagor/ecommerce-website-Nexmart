import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/product/ProductCard';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products?category=${slug}&page=${page}&limit=20`)
      .then(r => {
        setProducts(r.data.data?.products || []);
        setTotal(r.data.data?.pagination?.total || 0);
        const cats = r.data.data?.products?.[0]?.category;
        if (cats) setCategory(cats);
      })
      .finally(() => setLoading(false));
  }, [slug, page]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300 capitalize">{category?.name || slug}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{category?.name || slug}</h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} products</p>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => <div key={i} className="shimmer-bg h-64 rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary hover:text-primary disabled:opacity-50">
                  Previous
                </button>
                <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary hover:text-primary disabled:opacity-50">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
