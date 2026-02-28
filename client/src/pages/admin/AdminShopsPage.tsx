import { useEffect, useState, useCallback } from 'react';
import { Store, ChevronLeft, ChevronRight, CheckCircle, ShieldCheck, ShieldX, Clock, Eye, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  SUSPENDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  BANNED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusIcons: Record<string, string> = {
  ACTIVE: '✅',
  PENDING: '⏳',
  SUSPENDED: '⚠️',
  BANNED: '🚫',
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [detailShop, setDetailShop] = useState<any | null>(null);

  const pendingCount = shops.filter(s => s.status === 'PENDING').length;

  const fetchShops = useCallback((page = 1) => {
    setLoading(true);
    api.get(`/admin/shops?page=${page}&limit=50`)
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
      toast.success(
        status === 'ACTIVE' ? '✅ Shop approved! Seller role granted.' :
        status === 'BANNED' ? '🚫 Shop banned. Seller role revoked.' :
        status === 'SUSPENDED' ? '⚠️ Shop suspended. Seller role revoked.' :
        'Shop status updated'
      );
      if (detailShop?.id === id) setDetailShop((p: any) => p ? { ...p, status } : null);
    } catch {
      toast.error('Failed to update shop');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredShops = filter === 'ALL' ? shops : shops.filter(s => s.status === filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shops Management</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} total shops</p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => setFilter(f => f === 'PENDING' ? 'ALL' : 'PENDING')}
            className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-500/20 transition-colors"
          >
            <Clock className="w-4 h-4" />
            {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab === 'ALL' ? `All (${shops.length})` : `${statusIcons[tab]} ${tab} (${shops.filter(s => s.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Pending Approvals Banner */}
      {filter === 'PENDING' && filteredShops.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
          <h2 className="text-yellow-400 font-semibold text-lg mb-1">⏳ Pending Shop Applications</h2>
          <p className="text-gray-400 text-sm mb-4">These shops are awaiting your approval. Approving will grant the user a Seller role.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {s.logo ? (
                    <img src={s.logo} alt={s.name} className="w-12 h-12 rounded-xl object-cover bg-gray-800 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{s.name}</p>
                    <p className="text-gray-500 text-xs">by {s.seller?.name}</p>
                    {s.shopType && <span className="inline-block mt-1 bg-primary-500/10 text-primary-400 text-xs px-2 py-0.5 rounded-full">{s.shopType}</span>}
                  </div>
                </div>
                {s.description && <p className="text-gray-400 text-xs line-clamp-2">{s.description}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={updatingId === s.id}
                    onClick={() => updateStatus(s.id, 'ACTIVE')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    disabled={updatingId === s.id}
                    onClick={() => updateStatus(s.id, 'BANNED')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <ShieldX className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => setDetailShop(s)}
                    className="flex items-center justify-center bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table View (non-pending or ALL filter) */}
      {filter !== 'PENDING' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 font-medium px-5 py-3.5">Shop</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Seller</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Type</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Products</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Revenue</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Rating</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Verified</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3.5">Status</th>
                  <th className="text-right text-gray-400 font-medium px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td colSpan={9} className="px-5 py-3.5">
                        <div className="h-8 bg-gray-800 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-500 py-16">No shops found</td>
                  </tr>
                ) : filteredShops.map(s => (
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
                    <td className="px-4 py-3.5">
                      {s.shopType ? (
                        <span className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full">{s.shopType}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
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
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'PENDING' && (
                          <>
                            <button
                              disabled={updatingId === s.id}
                              onClick={() => updateStatus(s.id, 'ACTIVE')}
                              className="bg-green-500/10 border border-green-500/30 text-green-400 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={updatingId === s.id}
                              onClick={() => updateStatus(s.id, 'BANNED')}
                              className="bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
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
                      </div>
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
      )}

      {/* Shop Detail Modal */}
      {detailShop && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetailShop(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailShop.coverImage && (
              <div className="h-40 rounded-t-2xl overflow-hidden">
                <img src={detailShop.coverImage} alt="cover" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {detailShop.logo ? (
                    <img src={detailShop.logo} alt={detailShop.name} className="w-14 h-14 rounded-xl object-cover bg-gray-800 border-2 border-gray-700" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-lg">{detailShop.name}</h3>
                    <p className="text-gray-500 text-sm">@{detailShop.slug}</p>
                  </div>
                </div>
                <button onClick={() => setDetailShop(null)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[detailShop.status]}`}>{detailShop.status}</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Shop Type</p>
                  <p className="text-white font-medium">{detailShop.shopType || '—'}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Seller</p>
                  <p className="text-white font-medium">{detailShop.seller?.name}</p>
                  <p className="text-gray-500 text-xs">{detailShop.seller?.email}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Contact</p>
                  <p className="text-white font-medium">{detailShop.phone || '—'}</p>
                  <p className="text-gray-500 text-xs">{detailShop.email || '—'}</p>
                </div>
              </div>

              {detailShop.description && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Description</p>
                  <p className="text-gray-300 text-sm">{detailShop.description}</p>
                </div>
              )}

              {detailShop.address && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Address</p>
                  <p className="text-gray-300 text-sm">{detailShop.address}</p>
                </div>
              )}

              {detailShop.status === 'PENDING' && (
                <div className="flex gap-3 pt-2">
                  <button
                    disabled={updatingId === detailShop.id}
                    onClick={() => updateStatus(detailShop.id, 'ACTIVE')}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" /> Approve Shop
                  </button>
                  <button
                    disabled={updatingId === detailShop.id}
                    onClick={() => updateStatus(detailShop.id, 'BANNED')}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <ShieldX className="w-4 h-4" /> Reject Shop
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
