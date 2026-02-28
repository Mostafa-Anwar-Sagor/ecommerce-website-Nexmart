import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Package, CheckCircle2, Clock, XCircle, MapPin,
  Plus, ChevronRight, Search, RefreshCw, ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',   icon: Clock },
  PROCESSING: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',       icon: Package },
  SHIPPED:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200',   icon: Truck },
  DELIVERED:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',     icon: CheckCircle2 },
  CANCELLED:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',         icon: XCircle },
};

const CARRIERS = [
  'Standard Delivery', 'FedEx', 'UPS', 'DHL', 'USPS',
  'BlueDart', 'Aramex', 'SF Express', 'J&T Express', 'Other',
];

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  trackingNumber?: string;
  carrier?: string;
  lastLocation?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string; avatar?: string };
  address: { street: string; city: string; state?: string; postalCode: string; country: string };
  items: { id: string; productName: string; productImage: string; quantity: number; price: number }[];
  tracking: TrackingEvent[];
}

export default function SellerShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('PROCESSING');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    status: 'PROCESSING' as OrderStatus,
    trackingNumber: '',
    carrier: 'Standard Delivery',
    description: '',
    lastLocation: '',
    estimatedDelivery: '',
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/seller/shipping?status=${selectedTab}`);
      setOrders(r.data.data?.orders || []);
      setStatusCounts(r.data.data?.statusCounts || {});
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const loadOrderDetail = async (orderId: string) => {
    setDetailLoading(true);
    setSelectedOrder(null);
    setShowAddForm(false);
    try {
      const r = await api.get(`/seller/orders/${orderId}/tracking`);
      setSelectedOrder(r.data.data);
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddTracking = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await api.post(`/seller/orders/${selectedOrder.id}/tracking`, form);
      toast.success('Tracking event added');
      setShowAddForm(false);
      setForm({ status: 'PROCESSING', trackingNumber: '', carrier: 'Standard Delivery', description: '', lastLocation: '', estimatedDelivery: '' });
      // Reload detail
      const r = await api.get(`/seller/orders/${selectedOrder.id}/tracking`);
      setSelectedOrder(r.data.data);
      // Refresh list
      loadOrders();
    } catch {
      toast.error('Failed to add tracking event');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left panel */}
      <div className={`flex flex-col ${selectedOrder ? 'w-full lg:w-[420px] lg:shrink-0' : 'w-full'} border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-600" /> Shipping & Tracking
            </h1>
            <button onClick={loadOrders} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Order # or buyer name..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-3 gap-1 py-2 shrink-0">
          {STATUSES.map(s => {
            const meta = STATUS_META[s];
            const count = statusCounts[s] ?? 0;
            return (
              <button
                key={s}
                onClick={() => setSelectedTab(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedTab === s
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {s === 'SHIPPED' && <Truck className="w-3 h-3" />}
                {meta.label}
                {count > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selectedTab === s ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-50 dark:bg-gray-700/60 rounded animate-pulse w-2/3" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Truck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No orders in this status</p>
            </div>
          ) : filtered.map(order => {
            const meta = STATUS_META[order.status] || STATUS_META.PENDING;
            const StatusIcon = meta.icon;
            const latestTracking = order.tracking?.[0];
            const isSelected = selectedOrder?.id === order.id;
            return (
              <button
                key={order.id}
                onClick={() => loadOrderDetail(order.id)}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                      #{order.orderNumber?.slice(0, 10).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.user?.name}</p>
                    {order.address && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.address.city}, {order.address.country}
                      </p>
                    )}
                    {latestTracking?.trackingNumber && (
                      <p className="text-xs text-indigo-500 mt-1 font-mono">{latestTracking.carrier}: {latestTracking.trackingNumber}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                      <StatusIcon className="inline w-3 h-3 mr-0.5" />{meta.label}
                    </span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">${order.total?.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel - Order Detail */}
      {(selectedOrder || detailLoading) && (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />)}
              </div>
            </div>
          ) : selectedOrder ? (
            <div className="p-6 space-y-5">
              {/* Order header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                      #{selectedOrder.orderNumber?.slice(0, 10).toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Placed {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const meta = STATUS_META[selectedOrder.status] || STATUS_META.PENDING;
                        const Icon = meta.icon;
                        return (
                          <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                            <Icon className="w-4 h-4" /> {meta.label}
                          </span>
                        );
                      })()}
                      <span className="text-sm font-bold text-gray-900 dark:text-white">${selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {showAddForm ? 'Cancel' : 'Add Tracking Update'}
                  </button>
                </div>
              </div>

              {/* Add tracking form */}
              {showAddForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-2 border-primary-200 dark:border-primary-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary-600" /> New Tracking Event
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status *</label>
                      <select
                        value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value as OrderStatus }))}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Carrier</label>
                      <select
                        value={form.carrier}
                        onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
                      >
                        {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Tracking Number</label>
                      <input
                        value={form.trackingNumber}
                        onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                        placeholder="e.g. 1Z999AA10123456784"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Current Location</label>
                      <input
                        value={form.lastLocation}
                        onChange={e => setForm(f => ({ ...f, lastLocation: e.target.value }))}
                        placeholder="e.g. New York Warehouse"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Estimated Delivery</label>
                      <input
                        type="date"
                        value={form.estimatedDelivery}
                        onChange={e => setForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Description</label>
                      <input
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="e.g. Package picked up by carrier"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddTracking}
                    disabled={submitting}
                    className="mt-4 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Adding...' : 'Add Tracking Event'}
                  </button>
                </div>
              )}

              {/* Tracking Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Tracking Timeline</h3>
                {selectedOrder.tracking.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tracking events yet</p>
                    <p className="text-xs mt-1">Add a tracking update to get started</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-6">
                      {selectedOrder.tracking.map((event, idx) => {
                        const meta = STATUS_META[event.status] || STATUS_META.PENDING;
                        const EventIcon = meta.icon;
                        return (
                          <div key={event.id} className="flex gap-4 relative">
                            <div className={`w-8 h-8 rounded-full ${idx === 0 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center shrink-0 relative z-10`}>
                              <EventIcon className={`w-4 h-4 ${idx === 0 ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{event.description}</p>
                                  {event.lastLocation && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" /> {event.lastLocation}
                                    </p>
                                  )}
                                  {event.trackingNumber && (
                                    <p className="text-xs text-indigo-500 font-mono mt-1">
                                      {event.carrier} · {event.trackingNumber}
                                    </p>
                                  )}
                                  {event.estimatedDelivery && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Est. delivery: {new Date(event.estimatedDelivery).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                  {new Date(event.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600" /> Delivery Address
                  </h3>
                  {selectedOrder.address ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.user?.name}</p>
                      <p>{selectedOrder.address.street}</p>
                      <p>{selectedOrder.address.city}{selectedOrder.address.state ? `, ${selectedOrder.address.state}` : ''} {selectedOrder.address.postalCode}</p>
                      <p>{selectedOrder.address.country}</p>
                    </div>
                  ) : <p className="text-gray-400 text-sm">No address on file</p>}
                </div>

                {/* Order items */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600" /> Items ({selectedOrder.items?.length})
                  </h3>
                  <div className="space-y-2.5">
                    {selectedOrder.items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.productImage || '/placeholder.png'}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity} · ${item.price?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Empty right state */}
      {!selectedOrder && !detailLoading && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center text-gray-400">
            <Truck className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">Select an order</p>
            <p className="text-sm mt-1">Click an order on the left to view shipping details</p>
          </div>
        </div>
      )}
    </div>
  );
}
