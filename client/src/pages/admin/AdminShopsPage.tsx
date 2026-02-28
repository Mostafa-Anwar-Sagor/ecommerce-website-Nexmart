import { useEffect, useState, useCallback } from 'react';
import { Store, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  SUSPENDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  BANNED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchShops = useCallback((page = 1) => {
    setLoading(true);
    api.get(`/admin/shops?page=${page}&limit=20`)
      .then(r => {
        setShops(r.data.data.shops);
        setPagination(r.data.data.pagination);
      })
      .catch(() => toast.error('Failed to load shops'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchShops(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/shops/${id}/status`, { status });
      setShops(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast.success('Shop status updated');
    } catch {
      toast.error('Failed to update shop');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Shops</h1>
        <p className="text-gray-400 text-sm mt-1">{pagination.total} total shops</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3.5">Shop</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Seller</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Products</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Revenue</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Rating</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Verified</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Status</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3.5">Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td colSpan={8} className="px-5 py-3.5">
                      <div className="h-8 bg-gray-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-16">No shops found</td>
                </tr>
              ) : shops.map(s => (
                <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {s.logo ? (
                        <img src={s.logo} alt={s.name} className="w-9 h-9 rounded-xl object-cover bg-gray-800" />
                      ) : (
                        <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                          <Store className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{s.name}</p>
                        <p className="text-gray-500 text-xs">@{s.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-white text-sm">{s.seller?.name}</p>
                    <p className="text-gray-500 text-xs truncate max-w-[150px]">{s.seller?.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-white">{s._count?.products ?? 0}</td>
                  <td className="px-4 py-3.5 text-white font-medium">${(s.totalRevenue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-yellow-400 text-sm">
                    {s.rating > 0 ? `★ ${s.rating.toFixed(1)}` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    {s.isVerified
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <span className="text-gray-600 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <select
                      value={s.status}
                      disabled={updatingId === s.id}
                      onChange={e => updateStatus(s.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="BANNED">BANNED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchShops(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchShops(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"
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
