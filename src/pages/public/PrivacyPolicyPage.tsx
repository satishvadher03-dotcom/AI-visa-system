import React from 'react';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-2xs space-y-6 text-slate-700 leading-relaxed text-sm">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Legal & Compliance</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Privacy & Document Security Policy
            </h1>
            <p className="text-xs text-slate-400 mt-1">Effective Date: October 25, 2026</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">1. Private Document Storage Architecture</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              AuraVisa Global treats passport scans, civil registry documents, and bank statements as confidential personal data. All files uploaded by users are saved in private, isolated file system directories strictly segregated from public web roots. Files are identified by cryptographic UUIDs and can only be accessed through authenticated endpoints enforcing strict role-based and case ownership checks.
            </p>

            <h2 className="text-lg font-bold text-slate-900">2. Non-Government Status & Limited Scope</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              AuraVisa Global is a private electronic visa consultancy and documentation audit firm. We are not an embassy, consulate, or sovereign immigration department. Customer documents are reviewed exclusively by our authorized staff to audit compliance against official government standards before filing.
            </p>

            <h2 className="text-lg font-bold text-slate-900">3. Artificial Intelligence Safety & Privacy Boundary</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our AI Visa Assistant operates only on general immigration guidelines and public verified government portals. We do not transmit customer passport numbers, financial records, or private document files to external LLM providers. All AI processing is conducted server-side using secure API configurations.
            </p>

            <h2 className="text-lg font-bold text-slate-900">4. Evidentiary Audit Logging</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with consular data protection standards, every upload, download, and status modification is recorded in an immutable audit trail capturing actor identity, action type, IP address, and timestamp.
            </p>

            <h2 className="text-lg font-bold text-slate-900">5. Right to Erasure & Deletion</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers possess the right to delete unverified private documents from their vault at any time, or request full account purging by contacting <span className="font-semibold text-blue-600">privacy@auravisa.com</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
