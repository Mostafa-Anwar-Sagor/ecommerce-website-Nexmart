import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronDown, Truck, MapPin, Package, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const statusColors: Record<string, string> = {
  PENDING:    'text-yellow-700 bg-yellow-50 border-yellow-200',
  PROCESSING: 'text-blue-700 bg-blue-50 border-blue-200',
  SHIPPED:    'text-indigo-700 bg-indigo-50 border-indigo-200',
  DELIVERED:  'text-green-700 bg-green-50 border-green-200',
  CANCELLED:  'text-red-700 bg-red-50 border-red-200',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock, PROCESSING: Package, SHIPPED: Truck, DELIVERED: CheckCircle2, CANCELLED: XCircle,
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/seller/orders?status=${filterStatus}`)
      .then(r => setOrders(r.data.data?.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const selectOrder = async (order: any) => {
    setSelected(order);
    setTrackingLoading(true);
    setTracking([]);
    try {
      const r = await api.get(`/seller/orders/${order.id}/tracking`);
      setTracking(r.data.data?.tracking || []);
    } catch { /* no tracking yet */ }
    finally { setTrackingLoading(false); }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selected?.id === orderId) {
        setSelected((s: any) => ({ ...s, status }));
        const r = await api.get(`/seller/orders/${orderId}/tracking`);
        setTracking(r.data.data?.tracking || []);
      }
      toast.success('Order status updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary-600" /> Manage Orders
        </h1>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="flex gap-5 items-start">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden ${selected ? 'flex-1 min-w-0' : 'w-full'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>{['Order', 'Buyer', 'Items', 'Total', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="shimmer-bg h-5 rounded" /></td></tr>
                  )) : orders.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400">No orders found</td></tr>
                  ) : orders.map((order: any) => {
                    const Icon = STATUS_ICONS[order.status] || Clock;
                    return (
                      <tr key={order.id} onClick={() => selectOrder(order)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${selected?.id === order.id ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.user?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{order.items?.length}</td>
                        <td className="px-4 py-3 font-bold text-primary-600">${order.total?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[order.status] || ''}`}>
                            <Icon className="w-3 h-3" />{order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select value={order.status}
                              onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              disabled={updatingId === order.id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 pr-6 appearance-none cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:bg-gray-700 bg-white">
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="w-80 shrink-0 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Order Details</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div><p className="text-gray-400 text-xs">Order ID</p><p className="font-mono text-xs font-medium mt-0.5">#{selected.id.slice(0, 8).toUpperCase()}</p></div>
                  <div><p className="text-gray-400 text-xs">Buyer</p><p className="font-medium mt-0.5">{selected.user?.name}</p></div>
                  <div>
                    <p className="text-gray-400 text-xs">Status</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${statusColors[selected.status] || ''}`}>{selected.status}</span>
                  </div>
                  {selected.address && (
                    <div><p className="text-gray-400 text-xs">Ship to</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
                        {selected.address.street}, {selected.address.city}, {selected.address.country}
                      </p>
                    </div>
                  )}
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <div>
                    <p className="text-gray-400 text-xs mb-2">Items</p>
                    <div className="space-y-2">
                      {selected.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-2 items-start">
                          <img src={item.productImage || item.product?.images?.[0] || '/placeholder.png'} alt=""
                            className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-gray-400">x{item.quantity} · ${item.price?.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <div className="flex justify-between font-bold text-primary-600"><span>Total</span><span>${selected.total?.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary-600" /> Tracking
                  </h3>
                  <Link to="/seller/shipping" className="text-xs text-primary-600 hover:underline font-medium">Manage →</Link>
                </div>
                {trackingLoading ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}</div>
                ) : tracking.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400">No tracking events yet</p>
                    <Link to="/seller/shipping" className="text-xs text-primary-600 hover:underline mt-1 block font-medium">Add tracking update</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tracking.slice(0, 4).map((ev: any, idx: number) => {
                      const TIcon = STATUS_ICONS[ev.status] || Clock;
                      return (
                        <div key={ev.id} className="flex gap-2.5 items-start">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-primary-600' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <TIcon className={`w-3 h-3 ${idx === 0 ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{ev.status}</p>
                            <p className="text-[11px] text-gray-500 truncate">{ev.description}</p>
                            {ev.lastLocation && <p className="text-[11px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5"/>{ev.lastLocation}</p>}
                            <p className="text-[10px] text-gray-400">{new Date(ev.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {tracking.length > 4 && (
                      <Link to="/seller/shipping" className="text-xs text-primary-600 hover:underline block text-center">+{tracking.length - 4} more events</Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
