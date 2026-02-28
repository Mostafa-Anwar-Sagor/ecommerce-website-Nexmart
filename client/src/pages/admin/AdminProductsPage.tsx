import { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback((page = 1, q = search) => {
    setLoading(true);
    api.get(`/admin/products?page=${page}&limit=20${q ? `&search=${encodeURIComponent(q)}` : ''}`)
      .then(r => {
        setProducts(r.data.data.products);
        setPagination(r.data.data.pagination);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchProducts(1, search); }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const toggleProduct = async (id: string) => {
    setTogglingId(id);
    try {
      const r = await api.patch(`/admin/products/${id}/toggle`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: r.data.data.isActive } : p));
      toast.success('Product updated');
    } catch {
      toast.error('Failed to update product');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} total products</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Product</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Shop</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Category</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Price</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Stock</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Rating</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Sold</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Status</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td colSpan={9} className="px-5 py-3.5">
                      <div className="h-8 bg-gray-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-16">No products found</td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-800 shrink-0" />
                      )}
                      <p className="text-white font-medium truncate max-w-[160px]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-300 text-xs">{p.shop?.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">{p.category?.name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-white font-medium">${p.price?.toFixed(2)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-medium ${p.stock === 0 ? 'text-red-400' : p.stock < 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      {(p.rating ?? 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{p.soldCount ?? 0}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleProduct(p.id)}
                        disabled={togglingId === p.id}
                        title={p.isActive ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-gray-800 transition-colors disabled:opacity-40"
                      >
                        {p.isActive
                          ? <ToggleRight className="w-4.5 h-4.5 w-5 h-5 text-green-400" />
                          : <ToggleLeft className="w-5 h-5 text-gray-500" />
                        }
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id, p.name)}
                        disabled={deletingId === p.id}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
