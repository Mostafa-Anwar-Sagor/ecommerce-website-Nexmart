import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#ee4d2d', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `$${p.value.toFixed(2)}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SellerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d'>('30d');

  useEffect(() => {
    api.get(`/seller/analytics?range=${range}`).then(r => setAnalytics(r.data.data)).finally(() => setLoading(false));
  }, [range]);

  const revenueData = analytics?.dailyRevenue || [];
  const topProducts = analytics?.topProducts || [];
  const categoryDist = analytics?.categoryDistribution || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <div className="flex gap-2">
            {(['7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${range === r ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700'}`}>
                {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer-bg h-72 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ee4d2d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ee4d2d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="Revenue" stroke="#ee4d2d" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders trend */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Orders Per Day</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Sales by Category</h2>
                {categoryDist.length === 0 ? (
                  <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {categoryDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top products comparison */}
            {topProducts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Top Products Performance</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProducts.slice(0, 10).map((p: any) => ({ name: p.name?.slice(0, 12), Sales: p.sales, Revenue: p.revenue }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Sales" fill="#ee4d2d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Top Products by Revenue</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>{['#', 'Product', 'Units Sold', 'Revenue', 'Avg Rating'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {topProducts.slice(0, 10).map((p: any, i: number) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3 text-gray-400 font-medium">#{i + 1}</td>
                      <td className="px-5 py-3 flex items-center gap-2">
                        <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{p.name}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{p.sales}</td>
                      <td className="px-5 py-3 font-bold text-primary">${p.revenue?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-yellow-500">{'★'.repeat(Math.round(p.rating || 0))}{'☆'.repeat(5 - Math.round(p.rating || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
