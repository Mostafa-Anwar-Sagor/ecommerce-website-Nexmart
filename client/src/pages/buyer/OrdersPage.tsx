import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Truck, Clock, ShoppingBag, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
};

const statusIcons: Record<string, React.ElementType> = {
  PENDING: Clock, CONFIRMED: ShoppingBag, PROCESSING: ClipboardList, SHIPPED: Truck, DELIVERED: CheckCircle2, CANCELLED: XCircle,
};

const STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const stepIndex: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };

function MiniTracker({ status }: { status: string }) {
  const current = stepIndex[status] ?? 0;
  if (status === 'CANCELLED' || status === 'REFUNDED') return null;
  return (
    <div className="flex items-center gap-1 mt-2">
      {STEPS.map((_, idx) => (
        <div key={idx} className={`h-1 flex-1 rounded-full transition-all ${idx <= current ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('');

  useEffect(() => {
    api.get(`/orders?status=${activeStatus}&limit=20`)
      .then(r => setOrders(r.data.data?.orders || []))
      .finally(() => setLoading(false));
  }, [activeStatus]);

  const statuses = ['', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Package className="w-6 h-6 text-primary" /> My Orders</h1>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {statuses.map(s => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeStatus === s ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary/10'}`}>
              {s || 'All Orders'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer-bg h-28 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-600">No orders found</h3>
            <Link to="/" className="btn-primary mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const Icon = statusIcons[order.status] || Clock;
              const latestTracking = order.tracking?.[0];
              return (
                <Link key={order.id} to={`/order-tracking/${order.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono text-sm font-medium text-gray-600 dark:text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="ml-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="w-3 h-3" />{order.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {order.items?.slice(0, 3).map((item: any) => (
                      <img key={item.id} src={item.product?.images?.[0] || item.productImage}
                        alt={item.productName} className="w-12 h-12 object-cover rounded-lg" />
                    ))}
                    {order.items?.length > 3 && <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-500">+{order.items.length - 3}</div>}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-primary">${order.total?.toFixed(2)}</span>
                  </div>
                  <MiniTracker status={order.status} />
                  {latestTracking?.description && (
                    <p className="text-xs text-gray-400 mt-2 truncate flex items-center gap-1">
                      <Truck className="w-3 h-3 shrink-0" /> {latestTracking.description}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
