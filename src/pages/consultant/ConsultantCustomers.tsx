import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { api } from '../../services/api.ts';
import { User as UserType } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantCustomers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadCustomers() {
      try {
        const res = await api.get<{ success: boolean; data: UserType[] }>('/consultant/customers');
        if (isMounted && res.success && res.data) {
          setCustomers(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Consultant customers warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assigned Applicants</h1>
        <p className="text-xs text-slate-600 mt-1">
          Direct directory of customers whose visa applications or appointments are routed to your desk.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving assigned customer directory..." />
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No applicants assigned yet</h3>
          <p className="text-xs text-slate-500">
            When you receive case assignments from administrators, client profiles will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 hover:border-blue-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-100">
                  {c.firstName[0]}
                  {c.lastName[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {c.firstName} {c.lastName}
                  </h3>
                  <span className="text-[11px] text-slate-400 block truncate">{c.email}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.phone || 'Phone not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Citizenship: {c.profile?.nationality || 'Not declared'}</span>
                </div>
                {c.profile?.passportNumber && (
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Passport:</span>
                    <span>{c.profile.passportNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
