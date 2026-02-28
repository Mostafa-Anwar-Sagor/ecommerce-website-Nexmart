import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, SlidersHorizontal, Grid3X3, List, Search, X, ChevronDown } from 'lucide-react';
import { productService } from '../services/productService';
import ProductCard from '../components/product/ProductCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [filters, setFilters] = useState({ minPrice, maxPrice, rating: '', freeShipping: false });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts({
        query,
        page,
        limit: 20,
        categoryId: category || undefined,
        sortBy: (sortBy as 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'sold') || 'relevance',
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        rating: filters.rating ? Number(filters.rating) : undefined,
        freeShipping: filters.freeShipping || undefined,
      });
      setProducts(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [query, page, category, sortBy, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'sold', label: 'Most Popular' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rating' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {query ? <>Search results for "<span className="text-primary">{query}</span>"</> : 'All Products'}
          </h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} products found</p>}
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-60 flex-shrink-0`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm sticky top-20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>

              {/* Price Range */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</h4>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.minPrice}
                    onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                    className="input-field text-sm py-1.5 w-full" />
                  <input type="number" placeholder="Max" value={filters.maxPrice}
                    onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    className="input-field text-sm py-1.5 w-full" />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Rating</h4>
                {[4, 3, 2, 1].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer mb-1">
                    <input type="radio" name="rating" value={r} checked={filters.rating === String(r)} onChange={() => setFilters(f => ({ ...f, rating: String(r) }))} className="accent-primary" />
                    <span className="text-sm text-yellow-500">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
                    <span className="text-xs text-gray-500">& up</span>
                  </label>
                ))}
                {filters.rating && <button onClick={() => setFilters(f => ({ ...f, rating: '' }))} className="text-xs text-primary mt-1">Clear</button>}
              </div>

              {/* Free Shipping */}
              <label className="flex items-center gap-2 cursor-pointer mb-5">
                <input type="checkbox" checked={filters.freeShipping} onChange={(e) => setFilters(f => ({ ...f, freeShipping: e.target.checked }))} className="accent-primary" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Free Shipping Only</span>
              </label>

              <button onClick={fetchProducts} className="btn-primary w-full text-sm py-2">Apply Filters</button>
              <button onClick={() => { setFilters({ minPrice: '', maxPrice: '', rating: '', freeShipping: false }); setPage(1); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2 py-1">Clear All</button>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <div className="flex items-center gap-3 ml-auto">
                <select value={sortBy} onChange={(e) => updateParam('sortBy', e.target.value)}
                  className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-transparent dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-1">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="shimmer-bg h-64 rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No products found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
                <Link to="/" className="btn-primary mt-6 inline-block">Back to Home</Link>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'}`}>
                  {products.map((product, i) => (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <ProductCard product={product} view={viewMode} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {total > 20 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                      className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary hover:text-primary disabled:opacity-50 transition-colors">
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 text-sm rounded-lg transition-colors ${p === page ? 'bg-primary text-white' : 'border border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)}
                      className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary hover:text-primary disabled:opacity-50 transition-colors">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
