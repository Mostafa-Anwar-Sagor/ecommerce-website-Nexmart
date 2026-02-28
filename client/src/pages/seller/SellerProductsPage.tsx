import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, Package } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    api.get('/products/seller/my-products')
      .then(r => setProducts(r.data.data?.products || []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleActive = async (id: string, currentState: boolean) => {
    setTogglingId(id);
    try {
      await api.patch(`/products/${id}`, { isActive: !currentState });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentState } : p));
      toast.success(currentState ? 'Product deactivated' : 'Product activated');
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
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-500" /> My Products
            </h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} products total</p>
          </div>
          <Link to="/seller/add-product" className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-px">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No products yet</p>
              <p className="text-gray-400 text-sm mt-1 mb-5">Start selling by adding your first product</p>
              <Link to="/seller/add-product" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Sold', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 shrink-0 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/product/${p.slug}`}
                              className="text-gray-900 dark:text-white font-medium hover:text-primary-600 truncate block max-w-[200px]"
                            >
                              {p.name}
                            </Link>
                            {p.sku && <p className="text-gray-400 text-xs">SKU: {p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                          {p.category?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-900 dark:text-white font-medium">${p.price?.toFixed(2)}</p>
                        {p.discountPrice && (
                          <p className="text-gray-400 line-through text-xs">${p.discountPrice.toFixed(2)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-medium text-sm ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-yellow-500 text-sm">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {(p.rating ?? 0).toFixed(1)}
                          <span className="text-gray-400 text-xs">({p.reviewCount ?? 0})</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{p.soldCount ?? 0}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/seller/edit-product/${p.id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleActive(p.id, p.isActive)}
                            disabled={togglingId === p.id}
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-40"
                          >
                            {p.isActive
                              ? <ToggleRight className="w-5 h-5 text-green-600" />
                              : <ToggleLeft className="w-5 h-5 text-gray-400" />
                            }
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id, p.name)}
                            disabled={deletingId === p.id}
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
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
          )}
        </div>
      </div>
    </div>
  );
}
