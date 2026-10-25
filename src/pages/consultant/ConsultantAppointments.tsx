import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Appointment } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: Appointment[] }>('/appointments/consultant');
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Consultant appointments warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      if (res.success) {
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consular Appointments Desk</h1>
        <p className="text-xs text-slate-600 mt-1">
          Review your upcoming video consultations, access meeting rooms, and mark completed sessions.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving appointments schedule..." />
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No appointments scheduled</h3>
          <p className="text-xs text-slate-500">
            When customers book consultation slots with you, sessions will appear here.
          </p>
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
                    <span>Client: {apt.user ? `${apt.user.firstName} ${apt.user.lastName} (${apt.user.email})` : 'Applicant'}</span>
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
                    <span>Join Room</span>
                  </a>
                )}

                {apt.status === 'SCHEDULED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                    className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition"
                  >
                    Mark Done
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
