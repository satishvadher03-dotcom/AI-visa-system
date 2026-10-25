import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, PlusCircle, Clock, Mail, MapPin } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Enquiry } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomerEnquiries: React.FC = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadEnquiries() {
      try {
        const res = await api.get<{ success: boolean; data: Enquiry[] }>('/enquiries/me');
        if (isMounted && res.success && res.data) {
          setEnquiries(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Customer enquiries warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadEnquiries();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Enquiries</h1>
          <p className="text-xs text-slate-600 mt-1">
            Track communication and responses sent to AuraVisa consular desk specialists.
          </p>
        </div>

        <Link
          to="/contact"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Enquiry</span>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving enquiry tickets..." />
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">No Enquiries Filed</h3>
            <p className="text-xs text-slate-500 mt-1">
              Need assistance with visa regulations or specialized medical visas? Contact our desk.
            </p>
          </div>
          <Link
            to="/contact"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-block"
          >
            Submit an Enquiry
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enq) => (
            <div
              key={enq.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {enq.destinationCountry} — {enq.visaType}
                  </span>
                  <StatusBadge status={enq.status} size="sm" />
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(enq.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                "{enq.message}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
