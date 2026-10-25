import React, { useState, useEffect } from 'react';
import { History, Search, ShieldCheck, Download, Filter } from 'lucide-react';
import { api } from '../../services/api.ts';
import { AuditLog } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminAuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const params: any = { limit: 100 };
        if (actionFilter !== 'ALL') params.action = actionFilter;
        if (resourceFilter !== 'ALL') params.resourceType = resourceFilter;

        const res = await api.get<{ success: boolean; data: AuditLog[] }>('/admin/audit-logs', { params });
        if (isMounted && res.success && res.data) {
          setLogs(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Audit logs warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [user, actionFilter, resourceFilter]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Security & Audit Trail</h1>
          <p className="text-xs text-slate-600 mt-1">
            Immutable evidentiary records of all user authentication, document access, role escalations, and status transitions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Statutory Compliance Logging Active</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-semibold"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="USER_ROLE_MODIFIED">USER_ROLE_MODIFIED</option>
            <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
            <option value="APPLICATION_STATUS_UPDATED">APPLICATION_STATUS_UPDATED</option>
            <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
            <option value="DOCUMENT_DOWNLOADED">DOCUMENT_DOWNLOADED</option>
            <option value="INTERNAL_NOTE_ADDED">INTERNAL_NOTE_ADDED</option>
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-semibold"
          >
            <option value="ALL">All Resource Types</option>
            <option value="User">User</option>
            <option value="VisaApplication">VisaApplication</option>
            <option value="PrivateDocument">PrivateDocument</option>
            <option value="Appointment">Appointment</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <LoadingSpinner message="Scanning immutable audit store..." />
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No matching audit events</h3>
          <p className="text-xs text-slate-500">
            System events will be appended chronologically as actions are performed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">IP / User Agent</th>
                  <th className="py-3.5 px-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {log.user ? `${log.user.email} (${log.user.role})` : 'System Daemon'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.resourceType} {log.resourceId ? `[${log.resourceId.substring(0, 8)}...]` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={log.userAgent || ''}>
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.detailsJson || ''}>
                      {log.detailsJson || '-'}
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
