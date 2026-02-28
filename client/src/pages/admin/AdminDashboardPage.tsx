import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, DollarSign, Store,
  Clock, TrendingUp, ArrowRight, CheckCircle, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

interface Stats {
  users: number;
  activeProducts: number;
  orders: number;
  revenue: number;
  shops: number;
  pendingOrders: number;
  sellers: number;
  recentOrders: any[];
  recentUsers: any[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  CONFIRMED: 'bg-blue-500/10 text-blue-400',
  PROCESSING: 'bg-indigo-500/10 text-indigo-400',
  SHIPPED: 'bg-purple-500/10 text-purple-400',
  DELIVERED: 'bg-green-500/10 text-green-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  REFUNDED: 'bg-gray-500/10 text-gray-400',
};

const paymentColors: Record<string, string> = {
  PAID: 'bg-green-500/10 text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  FAILED: 'bg-red-500/10 text-red-400',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.users ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', link: '/admin/users' },
    { label: 'Active Products', value: stats?.activeProducts ?? 0, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/products' },
    { label: 'Total Orders', value: stats?.orders ?? 0, icon: ShoppingCart, color: 'text-orange-400', bg: 'bg-orange-500/10', link: '/admin/orders' },
    { label: 'Total Revenue', value: `$${(stats?.revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', link: '/admin/orders' },
    { label: 'Active Shops', value: stats?.shops ?? 0, icon: Store, color: 'text-pink-400', bg: 'bg-pink-500/10', link: '/admin/shops' },
    { label: 'Sellers', value: stats?.sellers ?? 0, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', link: '/admin/users' },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', link: '/admin/orders' },
  ];

  const Shimmer = () => <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back! Here's what's happening with NexMart.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map(c => (
          <Link
            key={c.label}
            to={c.link}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-all group"
          >
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            {loading ? <Shimmer /> : (
              <p className="text-2xl font-bold text-white">{c.value}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary-400" />
              Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-primary-400 text-xs flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{o.user?.name}</p>
                    <p className="text-gray-500 text-xs">#{o.orderNumber?.slice(-8)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status]}`}>
                      {o.status}
                    </span>
                    <span className="text-white text-sm font-bold">${o.total?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              Recent Users
            </h2>
            <Link to="/admin/users" className="text-primary-400 text-xs flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <p className="text-gray-500 text-xs truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.role === 'ADMIN' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : u.role === 'SELLER' ? (
                      <Store className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      u.role === 'ADMIN' ? 'text-red-400' : u.role === 'SELLER' ? 'text-purple-400' : 'text-green-400'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
