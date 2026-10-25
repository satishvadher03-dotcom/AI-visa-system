import React from 'react';
import { ApplicationStatus, DocumentStatus, AppointmentStatus, EnquiryStatus } from '../../types/index.ts';

interface StatusBadgeProps {
  status: ApplicationStatus | DocumentStatus | AppointmentStatus | EnquiryStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = String(status).toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'APPROVED' || s === 'VERIFIED' || s === 'RESOLVED' || s === 'COMPLETED') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'UNDER_REVIEW' || s === 'PROCESSING' || s === 'SCHEDULED' || s === 'CONTACTED') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'DOCUMENTS_PENDING' || s === 'PENDING' || s === 'RESUBMITTED') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'REJECTED' || s === 'CANCELLED') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'SUBMITTED' || s === 'NEW') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  const padClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${padClass} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {formatText(s)}
    </span>
  );
};
