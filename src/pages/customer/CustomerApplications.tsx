import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { VisaApplication, VisaProgram, ApplicationStatus } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const CustomerApplications: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [programs, setPrograms] = useState<VisaProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Application Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProgramId, setModalProgramId] = useState('');
  const [applicantName, setApplicantName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [applicantPassport, setApplicantPassport] = useState(user?.profile?.passportNumber || '');
  const [travelDate, setTravelDate] = useState('');
  const [passportExpiryDate, setPassportExpiryDate] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        const [appRes, progRes] = await Promise.all([
          api.get<{ success: boolean; data: VisaApplication[] }>('/applications/me'),
          api.get<{ success: boolean; data: VisaProgram[] }>('/visa-programs'),
        ]);

        if (isMounted) {
          if (appRes.success) setApplications(appRes.data || []);
          if (progRes.success) {
            setPrograms(progRes.data || []);
            if (progRes.data.length > 0) setModalProgramId(progRes.data[0].id);
          }

          // Open modal if URL parameter specifies programId or new=true
          const targetProgramId = searchParams.get('programId');
          if (targetProgramId) {
            setModalProgramId(targetProgramId);
            setIsModalOpen(true);
          } else if (searchParams.get('new') === 'true') {
            setIsModalOpen(true);
          }
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Applications fetch warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, searchParams]);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await api.post<{ success: boolean; data: VisaApplication }>('/applications', {
        visaProgramId: modalProgramId,
        applicantName,
        applicantPassport,
        travelDate: travelDate || undefined,
        passportExpiryDate: passportExpiryDate || undefined,
        notes: applicationNotes || undefined,
      });

      if (res.success && res.data) {
        setApplications((prev) => [res.data, ...prev]);
        setIsModalOpen(false);
        setSearchParams({});
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Visa Applications</h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your electronic visa filings, status progressions, and accredited case reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
        {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl transition shrink-0 ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Applications' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <LoadingSpinner message="Retrieving visa applications..." />
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">No applications found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter === 'ALL'
                ? 'You have not submitted any visa applications yet.'
                : `No applications with status "${statusFilter}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Application</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:border-blue-200 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {app.applicationNumber}
                  </span>
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-slate-400">
                    Submitted on: {app.submittedAt.split('T')[0]}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {app.visaProgram?.countryName} — {app.visaProgram?.visaType}
                </h3>

                <div className="text-xs text-slate-600 flex flex-wrap gap-4 pt-1">
                  <span>Applicant: <strong>{app.applicantName || 'Self'}</strong></span>
                  <span>Passport: <strong>{app.applicantPassport}</strong></span>
                  <span>Assigned Specialist: <strong>{app.assignedConsultant ? `${app.assignedConsultant.firstName} ${app.assignedConsultant.lastName}` : 'Triage Specialist'}</strong></span>
                  <span>Documents: <strong>{app.documents?.length || 0} uploaded</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/customer/applications/${app.id}`}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Open Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Start New Visa Application</h3>
                <p className="text-xs text-slate-500">
                  A dedicated case number will be generated immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Visa Program & Destination
                </label>
                <select
                  value={modalProgramId}
                  onChange={(e) => setModalProgramId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.countryName} — {p.visaType} (Govt Fee: ${p.officialFeeUSD})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Applicant Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="As printed in passport"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantPassport}
                    onChange={(e) => setApplicantPassport(e.target.value)}
                    placeholder="e.g. Z1298475"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Planned Departure Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Passport Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={passportExpiryDate}
                    onChange={(e) => setPassportExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Notes / Itinerary Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={applicationNotes}
                  onChange={(e) => setApplicationNotes(e.target.value)}
                  placeholder="e.g. Family vacation, flight already booked, expedited processing..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Dossier...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
