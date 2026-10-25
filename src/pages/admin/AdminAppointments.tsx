import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Appointment } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadAppointments() {
      try {
        const res = await api.get<{ success: boolean; data: Appointment[] }>('/appointments/consultant');
        if (isMounted && res.success && res.data) {
          setAppointments(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Admin appointments warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadAppointments();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Appointments Registry</h1>
        <p className="text-xs text-slate-600 mt-1">
          Monitor all scheduled 1-on-1 video consultations between applicants and specialists across the organization.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving appointments registry..." />
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No appointments scheduled</h3>
          <p className="text-xs text-slate-500">
            Bookings made by customers on the public consultation page will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Time Slot</th>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Assigned Consultant</th>
                  <th className="py-3.5 px-4">Consultation Subject</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Meeting Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div>
                        <span>{apt.appointmentDate.split('T')[0]}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">{apt.timeSlot}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-900 font-medium">
                      <span>{apt.user ? `${apt.user.firstName} ${apt.user.lastName}` : 'Applicant'}</span>
                      <span className="text-[11px] text-slate-400 block font-normal">{apt.user?.email}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {apt.consultant ? `${apt.consultant.firstName} ${apt.consultant.lastName}` : 'Unassigned'}
                    </td>
                    <td className="py-4 px-4 text-slate-800">
                      {apt.purpose}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={apt.status} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      {apt.meetingLink ? (
                        <a
                          href={apt.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Google Meet</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
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
