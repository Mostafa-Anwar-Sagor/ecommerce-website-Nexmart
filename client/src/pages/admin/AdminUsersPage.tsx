import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, ShoppingBag, Store, User, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  SELLER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  BUYER: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const roleIcons: Record<string, any> = {
  ADMIN: Shield,
  SELLER: Store,
  BUYER: User,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback((page = 1, q = search) => {
    setLoading(true);
    api.get(`/admin/users?page=${page}&limit=20${q ? `&search=${encodeURIComponent(q)}` : ''}`)
      .then(r => {
        setUsers(r.data.data.users);
        setPagination(r.data.data.pagination);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchUsers(1, search); }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const changeRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} total users</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3.5">User</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Role</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Orders</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Spent</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Verified</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3.5">Joined</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3.5">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td colSpan={7} className="px-5 py-3.5">
                      <div className="h-8 bg-gray-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-16">No users found</td>
                </tr>
              ) : users.map(u => {
                const RoleIcon = roleIcons[u.role];
                return (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{u.name}</p>
                          <p className="text-gray-500 text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${roleColors[u.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                        {u._count?.orders ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white font-medium">${(u.totalSpent ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      {u.isVerified
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-gray-600" />
                      }
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="BUYER">BUYER</option>
                        <option value="SELLER">SELLER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
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
