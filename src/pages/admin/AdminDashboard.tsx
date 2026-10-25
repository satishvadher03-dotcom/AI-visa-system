import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Calendar,
  Globe,
  ShieldCheck,
  History,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadStats() {
      try {
        const res = await api.get<{ success: boolean; data: any }>('/admin/stats');
        if (isMounted && res.success && res.data) {
          setStats(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Admin stats warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating platform intelligence and audit summaries..." />;
  }

  const statusCounts = stats?.statusCounts || {};

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Management Console</h1>
        <p className="text-xs text-slate-600 mt-1">
          Global operations overview, user authorization controls, caseload distribution, and immutable audit logs.
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Total Registered Users</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats?.totalUsers || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Customers, Consultants & Admins</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Total Applications</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{stats?.totalApplications || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Across 10+ sovereign programs</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Scheduled Consultations</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{stats?.totalAppointments || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Video advisory sessions</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Active Visa Programs</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats?.activeVisaPrograms || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Verified official authorities</span>
        </div>
      </div>

      {/* Pipeline Status Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Application Pipeline Distribution</h2>
          </div>
          <Link
            to="/admin/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Submitted</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{statusCounts['SUBMITTED'] || 0}</span>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Under Review</span>
            <span className="text-xl font-bold text-blue-700 mt-1 block">{statusCounts['UNDER_REVIEW'] || 0}</span>
          </div>
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Docs Pending</span>
            <span className="text-xl font-bold text-amber-700 mt-1 block">{statusCounts['DOCUMENTS_PENDING'] || 0}</span>
          </div>
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">Processing</span>
            <span className="text-xl font-bold text-indigo-700 mt-1 block">{statusCounts['PROCESSING'] || 0}</span>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Approved</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{statusCounts['APPROVED'] || 0}</span>
          </div>
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">Rejected</span>
            <span className="text-xl font-bold text-rose-700 mt-1 block">{statusCounts['REJECTED'] || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent System Audit Logs Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Immutable Audit Trail</h2>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Open Full Audit Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {(stats?.recentAuditLogs || []).map((log: any) => (
            <div
              key={log.id}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-800">Target: {log.resourceType}</span>
                </div>
                <div className="text-slate-500 text-[11px] flex gap-3">
                  <span>Actor: {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.role})` : 'System Daemon'}</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
              <span className="text-slate-400 text-[10px] shrink-0">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
