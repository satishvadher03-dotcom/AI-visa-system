import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  FileText,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const EligibilityPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nationality: 'India',
    residenceCountry: 'India',
    destinationCountry: 'United Arab Emirates',
    travelPurpose: 'Tourism',
    intendedStayDays: 14,
    passportValidityMonths: 12,
    hasPreviousRefusals: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckEligibility = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; assessment: any }>('/eligibility/check', formData);
      if (res.success && res.assessment) {
        setAssessment(res.assessment);
        setStep(5); // Go to results step
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete eligibility assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  const destinationsList = [
    'United Arab Emirates',
    'India',
    'United Kingdom',
    'United States',
    'France (Schengen Area)',
    'Singapore',
    'Saudi Arabia',
    'Vietnam',
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Interactive Consular Pre-Screening</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            e-Visa Eligibility Assessment
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Answer a few quick questions to determine electronic visa eligibility, passport validity thresholds, and required documentation.
          </p>
        </div>

        {/* Step Progress Bar */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Step {step} of 4</span>
              <span>
                {step === 1 && 'Nationality & Residence'}
                {step === 2 && 'Destination & Purpose'}
                {step === 3 && 'Duration & Passport'}
                {step === 4 && 'Declarations'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Questionnaire Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-6 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner message="Consulting immigration parameters and official portals..." />
          ) : step === 1 ? (
            /* STEP 1: Nationality & Residence */
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">1. Citizen & Residence Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Country of Citizenship (Passport Issuer)
                  </label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  >
                    <option value="India">India (Indian Passport)</option>
                    <option value="United States">United States (US Passport)</option>
                    <option value="United Kingdom">United Kingdom (British Citizen)</option>
                    <option value="Canada">Canada (Canadian Passport)</option>
                    <option value="Australia">Australia (Australian Passport)</option>
                    <option value="Germany">Germany (German Passport)</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Country of Permanent Residence
                  </label>
                  <select
                    value={formData.residenceCountry}
                    onChange={(e) => handleInputChange('residenceCountry', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  >
                    <option value="India">India</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            /* STEP 2: Destination & Travel Purpose */
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">2. Travel Route & Purpose</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Destination Country
                  </label>
                  <select
                    value={formData.destinationCountry}
                    onChange={(e) => handleInputChange('destinationCountry', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  >
                    {destinationsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Primary Purpose of Travel
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Tourism', 'Business', 'Conference', 'Medical', 'Transit'].map((purpose) => (
                      <button
                        key={purpose}
                        type="button"
                        onClick={() => handleInputChange('travelPurpose', purpose)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                          formData.travelPurpose === purpose
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                        }`}
                      >
                        {purpose}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : step === 3 ? (
            /* STEP 3: Duration & Passport Validity */
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">3. Duration & Passport Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Intended Stay Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={formData.intendedStayDays}
                    onChange={(e) => handleInputChange('intendedStayDays', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard tourist electronic visas typically permit stays up to 30 to 90 days.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Passport Remaining Validity (Months from Planned Arrival)
                  </label>
                  <select
                    value={formData.passportValidityMonths}
                    onChange={(e) => handleInputChange('passportValidityMonths', parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  >
                    <option value="2">Less than 3 months (Critical Risk)</option>
                    <option value="4">3 to 5 months</option>
                    <option value="7">6 to 11 months (Standard)</option>
                    <option value="12">12+ months (Recommended)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : step === 4 ? (
            /* STEP 4: Legal Declarations & Refusals */
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">4. History & Statutory Declaration</h2>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="refusals"
                      checked={formData.hasPreviousRefusals}
                      onChange={(e) => handleInputChange('hasPreviousRefusals', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="refusals" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                      <strong>Previous Visa Refusal Disclosure:</strong> Have you ever been refused a visa, entry permit, or deported from any country (including Schengen, UK, US, or Canada)?
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-7">
                    Disclosing refusals allows our specialists to assemble necessary mitigating letters and avoid biometric bans.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckEligibility}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate My Profile</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 5: RESULTS SCREEN */
            assessment && (
              <div className="space-y-6">
                {/* Result Status Banner */}
                <div
                  className={`p-6 rounded-2xl border ${
                    assessment.status === 'HIGHLY_ELIGIBLE'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : assessment.status === 'CRITICAL_INELIGIBILITY'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    {assessment.status === 'HIGHLY_ELIGIBLE' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : assessment.status === 'CRITICAL_INELIGIBILITY' ? (
                      <XCircle className="w-6 h-6 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    )}
                    <h2 className="text-xl font-bold">
                      {assessment.status === 'HIGHLY_ELIGIBLE' && 'Preliminary Result: Highly Eligible for e-Visa'}
                      {assessment.status === 'CRITICAL_INELIGIBILITY' && 'Preliminary Result: Action Required Before Application'}
                      {assessment.status === 'CONDITIONAL_REVIEW' && 'Preliminary Result: Additional Review Recommended'}
                      {assessment.status === 'REQUIRES_CONSULAR_INTERVIEW' && 'Preliminary Result: Consular Stream Recommended'}
                    </h2>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    Based on your citizen profile ({assessment.nationality}), destination ({assessment.destination}), and intended stay ({assessment.intendedStayDays} days).
                  </p>
                </div>

                {/* Issues and Recommendations */}
                {assessment.issues.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                      Noticed Conditions:
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                      {assessment.issues.map((issue: string, idx: number) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Matched Official Program Card */}
                {assessment.matchedProgram && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-blue-600 block">Matched Official Program</span>
                        <h3 className="text-lg font-bold text-slate-900">{assessment.matchedProgram.name}</h3>
                        <p className="text-xs text-slate-500">
                          {assessment.matchedProgram.country} • Validity: {assessment.matchedProgram.validity}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Official Govt Fee</span>
                        <span className="text-base font-bold text-slate-900">${assessment.matchedProgram.officialFeeUSD} USD</span>
                      </div>
                    </div>

                    {/* Official Portal Reference */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">Verified Official Government Portal:</span>
                        <span className="text-slate-600 block">{assessment.matchedProgram.officialSourceName}</span>
                      </div>
                      <a
                        href={assessment.matchedProgram.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 flex items-center gap-1 transition"
                      >
                        <span>Visit Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Checklist preview */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-bold text-slate-700">Required Document Checklist:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        {assessment.matchedProgram.requiredDocuments.map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{doc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Statutory Disclaimer */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                  <strong>Non-Guarantee Notice:</strong> {assessment.disclaimer}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Recalculate with New Profile
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/consultation"
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                    >
                      Book Specialist Call
                    </Link>
                    {assessment.matchedProgram && (
                      <Link
                        to={`/customer/applications?programId=${assessment.matchedProgram.id}`}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>Start Verified Application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
