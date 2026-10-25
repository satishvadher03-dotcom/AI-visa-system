import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, User, PlusCircle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Appointment } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomerAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: Appointment[] }>('/appointments/me');
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Appointments warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this consultation?')) return;
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' });
      if (res.success) {
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consular Appointments</h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your booked 1-on-1 video advisory calls, access Google Meet rooms, or reschedule slots.
          </p>
        </div>

        <Link
          to="/consultation"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Consultation</span>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving scheduled appointments..." />
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">No Appointments Scheduled</h3>
            <p className="text-xs text-slate-500 mt-1">
              Have complex travel questions or need assistance with document translation? Book a specialist consultation.
            </p>
          </div>
          <Link
            to="/consultation"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{apt.purpose}</span>
                  <StatusBadge status={apt.status} size="sm" />
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.appointmentDate.split('T')[0]}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.timeSlot}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Specialist: {apt.consultant ? `${apt.consultant.firstName} ${apt.consultant.lastName}` : 'Assigned Case Officer'}</span>
                  </span>
                </div>

                {apt.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    "{apt.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {apt.status === 'SCHEDULED' && apt.meetingLink && (
                  <a
                    href={apt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Call</span>
                  </a>
                )}
                {apt.status === 'SCHEDULED' && (
                  <button
                    type="button"
                    onClick={() => handleCancelAppointment(apt.id)}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
