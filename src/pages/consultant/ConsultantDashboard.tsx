import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileCheck, Calendar, Users, ArrowRight, ShieldCheck, CheckSquare, Clock } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication, Appointment } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<VisaApplication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadData() {
      try {
        const [casesRes, aptRes] = await Promise.all([
          api.get<{ success: boolean; data: VisaApplication[] }>('/consultant/assigned-cases'),
          api.get<{ success: boolean; data: Appointment[] }>('/appointments/consultant'),
        ]);

        if (isMounted) {
          if (casesRes.success) setCases(casesRes.data || []);
          if (aptRes.success) setAppointments(aptRes.data || []);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Consultant dashboard warning:', err?.message || err);
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
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner message="Loading consultant caseload..." />;
  }

  const underReviewCount = cases.filter((c) => c.status === 'UNDER_REVIEW').length;
  const docsPendingCount = cases.filter((c) => c.status === 'DOCUMENTS_PENDING').length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Case Specialist Desk</h1>
        <p className="text-xs text-slate-600 mt-1">
          Review assigned dossiers, perform document forensic checks, and guide applicants through sovereign filing requirements.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Assigned Cases</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{cases.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Under Review</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{underReviewCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Documents Pending</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{docsPendingCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Scheduled Consultations</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{appointments.length}</span>
        </div>
      </div>

      {/* Active Cases Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Priority Assigned Cases</h2>
          </div>
          <Link
            to="/consultant/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All ({cases.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {cases.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No cases assigned to your queue at present.</p>
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {c.applicationNumber}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                    <span className="text-slate-400">
                      {c.visaProgram?.countryName} — {c.visaProgram?.visaType}
                    </span>
                  </div>
                  <div className="text-slate-600 flex gap-4 pt-0.5">
                    <span>Applicant: <strong>{c.applicantName || `${c.user?.firstName} ${c.user?.lastName}`}</strong></span>
                    <span>Passport: <strong>{c.applicantPassport}</strong></span>
                    <span>Documents: <strong>{c.documents?.length || 0} attached</strong></span>
                  </div>
                </div>

                <Link
                  to={`/consultant/applications/${c.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shrink-0 shadow-2xs text-center"
                >
                  Review Dossier
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Consultations */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Your Video Consultation Schedule</h2>
          </div>
          <Link
            to="/consultant/appointments"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No appointments scheduled today.</p>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{apt.purpose}</span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                  <div className="text-slate-500 flex gap-4">
                    <span>Date: {apt.appointmentDate.split('T')[0]}</span>
                    <span>Slot: {apt.timeSlot}</span>
                    <span>Client: {apt.user ? `${apt.user.firstName} ${apt.user.lastName} (${apt.user.email})` : 'Applicant'}</span>
                  </div>
                </div>

                {apt.meetingLink && apt.status === 'SCHEDULED' && (
                  <a
                    href={apt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shrink-0 text-center shadow-2xs"
                  >
                    Open Meeting Room
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
