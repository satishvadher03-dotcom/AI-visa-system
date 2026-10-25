import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search, Filter, ArrowRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantCases: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<VisaApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function fetchCases() {
      setIsLoading(true);
      try {
        const params: any = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (searchQuery) params.search = searchQuery;

        const res = await api.get<{ success: boolean; data: VisaApplication[] }>('/consultant/assigned-cases', {
          params,
        });
        if (isMounted && res.success && res.data) {
          setCases(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Consultant cases warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchCases();
    return () => {
      isMounted = false;
    };
  }, [user, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assigned Case Dossiers</h1>
        <p className="text-xs text-slate-600 mt-1">
          Review documents, verify biometric clarity, update filing status, and record internal case notes.
        </p>
      </div>

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
            <option value="ALL">All Statuses</option>
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

      {isLoading ? (
        <LoadingSpinner message="Retrieving assigned dossiers..." />
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No matching cases found</h3>
          <p className="text-xs text-slate-500">
            Cases assigned to you by administrators will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-200 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {c.applicationNumber}
                  </span>
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-slate-400">
                    Updated: {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {c.visaProgram?.countryName} — {c.visaProgram?.visaType}
                </h3>

                <div className="text-xs text-slate-600 flex flex-wrap gap-4 pt-1">
                  <span>Applicant: <strong>{c.applicantName || `${c.user?.firstName} ${c.user?.lastName}`}</strong></span>
                  <span>Email: <strong>{c.user?.email}</strong></span>
                  <span>Passport: <strong>{c.applicantPassport}</strong></span>
                  <span>Documents: <strong>{c.documents?.length || 0} attached</strong></span>
                </div>
              </div>

              <Link
                to={`/consultant/applications/${c.id}`}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-2xs text-center flex items-center gap-1.5"
              >
                <span>Open Review Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
