import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { VisaApplication, Appointment } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [appRes, aptRes] = await Promise.all([
          api.get<{ success: boolean; data: VisaApplication[] }>('/applications/me'),
          api.get<{ success: boolean; data: Appointment[] }>('/appointments/me'),
        ]);
        if (isMounted) {
          if (appRes.success) setApplications(appRes.data || []);
          if (aptRes.success) setAppointments(aptRes.data || []);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Customer dashboard data warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner message="Loading customer dashboard..." />;
  }

  const activeCasesCount = applications.filter(
    (a) => !['APPROVED', 'REJECTED', 'CANCELLED'].includes(a.status)
  ).length;

  const totalDocumentsCount = applications.reduce((sum, a) => sum + (a.documents?.length || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Customer Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track your ongoing electronic visa dossiers, manage biometric documents, and consult with assigned specialists.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/customer/applications?new=true"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Visa Application</span>
          </Link>
          <Link
            to="/consultation"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Book Specialist
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Total Applications</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{applications.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">In Active Review</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{activeCasesCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Vaulted Documents</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalDocumentsCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs font-medium block">Upcoming Consultations</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {appointments.filter((a) => a.status === 'SCHEDULED').length}
          </span>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Your Visa Applications</h2>
          </div>
          <Link
            to="/customer/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <p className="text-xs text-slate-500">You have not submitted any visa applications yet.</p>
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <span>Explore Programs & Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {app.applicationNumber}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {app.visaProgram?.countryName} — {app.visaProgram?.visaType}
                  </h3>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                    <span>Applicant: {app.applicantName || `${user?.firstName} ${user?.lastName}`}</span>
                    <span>Passport: {app.applicantPassport}</span>
                    <span>Assigned Specialist: {app.assignedConsultant ? `${app.assignedConsultant.firstName} ${app.assignedConsultant.lastName}` : 'Triage Queue'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/customer/applications/${app.id}`}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Open Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consultations Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Scheduled Video Consultations</h2>
          </div>
          <Link
            to="/customer/appointments"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            No upcoming consultations. Need guidance on difficult cases?{' '}
            <Link to="/consultation" className="text-blue-600 font-semibold hover:underline">
              Book a video meeting
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 2).map((apt) => (
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
                    <span>Time: {apt.timeSlot}</span>
                    <span>Specialist: {apt.consultant ? `${apt.consultant.firstName} ${apt.consultant.lastName}` : 'Unassigned'}</span>
                  </div>
                </div>

                {apt.meetingLink && apt.status === 'SCHEDULED' && (
                  <a
                    href={apt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition text-center shrink-0 shadow-2xs"
                  >
                    Join Meeting
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
