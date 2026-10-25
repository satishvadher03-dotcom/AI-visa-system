import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, Mail, Phone, UserCheck, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ConsultantSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  _count?: {
    assignedApplications: number;
    appointmentsAsConsultant: number;
  };
}

export const AdminConsultants: React.FC = () => {
  const { user } = useAuth();
  const [consultants, setConsultants] = useState<ConsultantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadConsultants() {
      try {
        const res = await api.get<{ success: boolean; data: ConsultantSummary[] }>('/admin/consultants');
        if (isMounted && res.success && res.data) {
          setConsultants(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Consultants warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadConsultants();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consultant Workload Management</h1>
        <p className="text-xs text-slate-600 mt-1">
          Monitor assigned caseload distribution, specialist queue depths, and advisory appointments.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving specialist roster..." />
      ) : consultants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No active consultants found</h3>
          <p className="text-xs text-slate-500">
            Promote registered users to the CONSULTANT role in the User Directory to allocate cases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultants.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5 hover:border-blue-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-base border border-blue-100">
                  {c.firstName[0]}
                  {c.lastName[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {c.firstName} {c.lastName}
                  </h3>
                  <span className="text-xs text-slate-400 block truncate">{c.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Dossiers</span>
                  <span className="text-xl font-bold text-blue-600 mt-0.5 block">
                    {c._count?.assignedApplications || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Appointments</span>
                  <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
                    {c._count?.appointmentsAsConsultant || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.phone || 'Phone not registered'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Active Accreditation Status: Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
