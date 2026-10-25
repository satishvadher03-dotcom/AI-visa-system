import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, UserCheck, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminApplications: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const [appRes, consRes] = await Promise.all([
        api.get<{ success: boolean; data: VisaApplication[] }>('/admin/applications', { params }),
        api.get<{ success: boolean; data: any[] }>('/admin/consultants'),
      ]);

      if (appRes.success) setApplications(appRes.data || []);
      if (consRes.success) setConsultants(consRes.data || []);
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Fetch admin applications warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, statusFilter, searchQuery]);

  const handleAssignConsultant = async (appId: string, consultantId: string) => {
    setActionMessage(null);
    try {
      const res = await api.patch(`/admin/applications/${appId}/assign`, {
        consultantId,
        notes: 'Assigned via Executive Case Routing Panel',
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Application successfully assigned to consultant.' });
        fetchData();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to assign application.' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Application Registry</h1>
        <p className="text-xs text-slate-600 mt-1">
          Monitor all electronic visa applications across jurisdictions and reassign cases to active consultants.
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
            placeholder="Search by case number, applicant, or passport..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-semibold"
          >
            <option value="ALL">All Statuses ({applications.length})</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DOCUMENTS_PENDING">Documents Pending</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="PROCESSING">Processing</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {isLoading ? (
        <LoadingSpinner message="Retrieving organization dossiers..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Case Number</th>
                  <th className="py-3.5 px-4">Applicant Profile</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Assigned Specialist</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-mono font-bold text-blue-700">
                      {app.applicationNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-900 font-medium">
                      <div>
                        <span className="block font-bold">{app.applicantName || `${app.user?.firstName} ${app.user?.lastName}`}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">{app.applicantPassport}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <span className="font-semibold text-slate-800 block">{app.visaProgram?.countryName}</span>
                      <span className="text-[11px] text-slate-500">{app.visaProgram?.visaType}</span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={app.assignedConsultantId || ''}
                        onChange={(e) => handleAssignConsultant(app.id, e.target.value)}
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                      >
                        <option value="">Unassigned (Queue)</option>
                        {consultants.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} ({c._count?.assignedApplications || 0} cases)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/consultant/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg font-semibold transition"
                      >
                        <span>Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
