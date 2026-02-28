import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Package, Star, TrendingUp, Plus, BarChart2, ArrowUp, ArrowDown, Truck, Settings } from 'lucide-react';
import api from '../../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.name === 'Revenue' ? `$${p.value.toFixed(2)}` : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SellerDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/analytics').then(r => setAnalytics(r.data.data)).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Revenue', value: analytics ? `$${analytics.totalRevenue?.toFixed(2)}` : '$0.00', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', trend: analytics?.revenueTrend },
    { label: 'Monthly Revenue', value: analytics ? `$${analytics.monthlyRevenue?.toFixed(2)}` : '$0.00', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: analytics?.monthlyRevenueTrend },
    { label: 'Total Orders', value: analytics?.totalOrders ?? 0, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50', trend: analytics?.ordersTrend },
    { label: 'Total Products', value: analytics?.totalProducts ?? 0, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', trend: null },
    { label: 'Shop Rating', value: analytics?.shopRating ? `${analytics.shopRating.toFixed(1)} ★` : 'N/A', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', trend: null },
  ];

  const revenueData = analytics?.dailyRevenue || Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { weekday: 'short' }),
    Revenue: 0, Orders: 0,
  }));

  const topProducts = analytics?.topProducts || [];

  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50',
    PROCESSING: 'text-blue-600 bg-blue-50',
    SHIPPED: 'text-indigo-600 bg-indigo-50',
    DELIVERED: 'text-green-600 bg-green-50',
    CANCELLED: 'text-red-600 bg-red-50',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening with your shop.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/seller/add-product" className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> Add Product</Link>
            <Link to="/seller/shipping" className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Truck className="w-4 h-4" /> Shipping</Link>
            <Link to="/seller/analytics" className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><BarChart2 className="w-4 h-4" /> Analytics</Link>
            <Link to="/seller/settings" className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Settings className="w-4 h-4" /> Settings</Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              {loading ? <div className="shimmer-bg h-7 rounded w-16 mb-1" /> : <p className="text-xl font-bold text-gray-900 dark:text-white">{String(s.value)}</p>}
              <p className="text-xs text-gray-500">{s.label}</p>
              {s.trend != null && (
                <div className={`flex items-center gap-0.5 text-xs mt-1 ${s.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {s.trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{Math.abs(s.trend).toFixed(1)}% vs last period</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Revenue & Orders (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#ee4d2d" strokeWidth={2} dot={{ fill: '#ee4d2d', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Orders" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top products */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Top Products</h2>
              <Link to="/seller/products" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sales} sold</p>
                    </div>
                    <span className="text-xs font-bold text-primary">${p.revenue?.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bar chart for top products */}
        {topProducts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Product Sales Comparison</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts.slice(0, 8).map((p: any) => ({ name: p.name?.slice(0, 15) + (p.name?.length > 15 ? '…' : ''), Sales: p.sales, Revenue: p.revenue }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Sales" fill="#ee4d2d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Recent Orders</h2>
            <Link to="/seller/orders" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{['Order ID', 'Buyer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {analytics?.recentOrders?.length === 0 || !analytics?.recentOrders ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No orders yet</td></tr>
                ) : analytics.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3">{order.buyer?.name}</td>
                    <td className="px-5 py-3 text-gray-500">{order.items?.length}</td>
                    <td className="px-5 py-3 font-bold text-primary">${order.total?.toFixed(2)}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || ''}`}>{order.status}</span></td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
