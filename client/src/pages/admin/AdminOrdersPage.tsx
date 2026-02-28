import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const paymentColors: Record<string, string> = {
  PAID: 'bg-green-500/10 text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  FAILED: 'bg-red-500/10 text-red-400',
  REFUNDED: 'bg-gray-500/10 text-gray-400',
  PARTIALLY_REFUNDED: 'bg-orange-500/10 text-orange-400',
};

const allStatuses = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const nextStatuses: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback((page = 1, status = statusFilter) => {
    setLoading(true);
    api.get(`/admin/orders?page=${page}&limit=20${status ? `&status=${status}` : ''}`)
      .then(r => {
        setOrders(r.data.data.orders);
        setPagination(r.data.data.pagination);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchOrders(1, statusFilter); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} total orders</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {allStatuses.map(s => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3.5 w-6"></th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Order</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Customer</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Items</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Total</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Payment</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Status</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Date</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3.5">Update</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-16">No orders found</td>
                </tr>
              ) : orders.map(o => (
                <>
                  <tr
                    key={o.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                  >
                    <td className="px-5 py-3.5">
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedId === o.id ? 'rotate-180' : ''}`} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white font-mono text-xs">#{o.orderNumber?.slice(-8)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-white font-medium truncate max-w-[140px]">{o.user?.name}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[140px]">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">{o.items?.length ?? 0} items</td>
                    <td className="px-4 py-3.5 text-white font-bold">${o.total?.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentColors[o.paymentStatus] ?? paymentColors.PENDING}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      {nextStatuses[o.status]?.length > 0 ? (
                        <select
                          value=""
                          disabled={updatingId === o.id}
                          onChange={e => { if (e.target.value) updateStatus(o.id, e.target.value); }}
                          className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Move to...</option>
                          {nextStatuses[o.status].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                  {/* Expanded items */}
                  {expandedId === o.id && (
                    <tr key={`${o.id}-expand`} className="border-b border-gray-800 bg-gray-800/30">
                      <td colSpan={9} className="px-10 py-4">
                        <div className="space-y-2">
                          {o.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3">
                              {item.product?.images?.[0] && (
                                <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-700" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{item.product?.name ?? item.productId}</p>
                                <p className="text-gray-500 text-xs">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                              </div>
                              <p className="text-white text-sm font-medium shrink-0">${(item.quantity * item.price)?.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
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
