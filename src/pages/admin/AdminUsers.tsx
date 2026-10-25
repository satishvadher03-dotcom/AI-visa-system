import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldAlert, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Role } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

interface ManagedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string | null;
  createdAt: string;
  profile?: any;
  _count?: {
    applications: number;
    assignedApplications: number;
    appointmentsAsCustomer: number;
    appointmentsAsConsultant: number;
  };
}

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const params: any = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get<{ success: boolean; data: ManagedUser[] }>('/admin/users', { params });
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Fetch users warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser, roleFilter, searchQuery]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (userId === currentUser?.id && newRole !== 'ADMIN') {
      setActionMessage({
        type: 'error',
        text: 'Security restriction: You cannot demote your own administrator account.',
      });
      return;
    }

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setActionMessage(null);
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.success) {
        setActionMessage({ type: 'success', text: `User role successfully updated to ${newRole}.` });
        fetchUsers();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update user role.' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Directory & Role Authority</h1>
        <p className="text-xs text-slate-600 mt-1">
          Assign or revoke consultant and administrator credentials with server-validated role enforcement.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or telephone..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-semibold"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="CUSTOMER">Customers</option>
            <option value="CONSULTANT">Consultants</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner message="Retrieving user directory..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User / Contact</th>
                  <th className="py-3.5 px-4">Citizenship</th>
                  <th className="py-3.5 px-4">Caseload / Filings</th>
                  <th className="py-3.5 px-4">Current Role</th>
                  <th className="py-3.5 px-4 text-right">Role Authority Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div>
                        <span className="block font-bold">
                          {u.firstName} {u.lastName}
                          {u.id === currentUser?.id && (
                            <span className="ml-1.5 text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              (You)
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-normal">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {u.profile?.nationality || 'Not specified'}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {u.role === 'CUSTOMER' && (
                        <span>{u._count?.applications || 0} applications filed</span>
                      )}
                      {u.role === 'CONSULTANT' && (
                        <span>{u._count?.assignedApplications || 0} cases assigned</span>
                      )}
                      {u.role === 'ADMIN' && (
                        <span className="text-slate-400">System Oversight</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'CONSULTANT'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {u.id === currentUser?.id ? (
                        <span className="text-slate-400 italic text-[11px]">Protected Self Account</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-semibold cursor-pointer"
                        >
                          <option value="CUSTOMER">Set as CUSTOMER</option>
                          <option value="CONSULTANT">Promote to CONSULTANT</option>
                          <option value="ADMIN">Promote to ADMIN</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
