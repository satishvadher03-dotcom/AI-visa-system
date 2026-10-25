import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  Search,
  ShieldCheck,
  FileCheck2,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Users,
  CheckCircle2,
  HelpCircle,
  FileText,
  Lock,
  Compass,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaProgram } from '../../types/index.ts';

interface HomePageProps {
  onOpenAiAssistant?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAiAssistant }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [flowFilter, setFlowFilter] = useState<'ALL' | 'INDIA_TO_WORLD' | 'WORLD_TO_INDIA'>('ALL');
  const [popularPrograms, setPopularPrograms] = useState<VisaProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadPrograms() {
      try {
        const res = await api.get<{ success: boolean; data: VisaProgram[] }>('/visa-programs');
        if (res.success && res.data) {
          setPopularPrograms(res.data.slice(0, 6));
        }
      } catch (err: any) {
        console.warn('Home visa programs warning:', err?.message || err);
      } finally {
        setIsLoadingPrograms(false);
      }
    }
    loadPrograms();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/destinations');
    }
  };

  const faqs = [
    {
      q: 'Is AuraVisa Global an official embassy or government immigration agency?',
      a: 'No. AuraVisa Global is an independent private consultancy, eligibility evaluator, and document facilitating service. We assist applicants in verifying required documents, preventing common filing rejections, and navigating official portals. Final visa approval and admission into any sovereign country is granted exclusively at the discretion of the destination government’s immigration authority.',
    },
    {
      q: 'How does the AI Visa Assistant verify immigration information?',
      a: 'Our AI consultant "Aura" is directly grounded in verified consular guidelines and official government portals (such as the Indian Ministry of Home Affairs, UAE ICP Smart Services, US Department of State, and UKVI). Every recommendation includes the date of verification and a direct link to the corresponding government website. It is strictly configured never to fabricate fees, timelines, or approval guarantees.',
    },
    {
      q: 'How are my uploaded private passport scans and financial documents secured?',
      a: 'Your private documents are stored in an encrypted, isolated directory strictly outside public web-accessible roots. Each file is renamed with cryptographic UUIDs and protected by server-side role-based access checks. Only you, your assigned accredited visa consultant, and authorized system administrators can access or download your files. Every access is recorded in an immutable audit log.',
    },
    {
      q: 'What is the difference between official government fees and AuraVisa service fees?',
      a: 'Official government fees are the non-refundable statutory fees levied directly by the sovereign immigration department of the destination country. AuraVisa service fees cover personalized eligibility evaluation, document forensic verification, photo compliance adjustment, consular appointment tracking, and end-to-end case manager support.',
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 border-b border-slate-200 bg-linear-to-b from-slate-50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Grounded in 100% Verified Sovereign Government Portals</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              AI-Powered e-Visa Facilitation &{' '}
              <span className="text-blue-600">Accredited Advisory</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Prepare verified application dossiers for tourist, business, and conference visas. Avoid biometric and document rejections with dual AI pre-checks and licensed human case specialists.
            </p>

            {/* Search Bar Form */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-2xl mx-auto">
              <div className="bg-white p-2 rounded-2xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-3 px-3 flex-1 w-full">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Where are you traveling to? (e.g. Dubai, India, UK, USA, France)"
                    className="w-full py-2.5 text-sm bg-transparent focus:outline-none text-slate-900 placeholder-slate-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
                >
                  <span>Search Visas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Flow Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-medium text-slate-600">
              <span className="text-slate-400">Popular Travel Routes:</span>
              <button
                type="button"
                onClick={() => navigate('/destinations?flow=INDIA_TO_WORLD')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition"
              >
                🇮🇳 India to World (Dubai, UK, US, Singapore)
              </button>
              <button
                type="button"
                onClick={() => navigate('/destinations?flow=WORLD_TO_INDIA')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition"
              >
                🌍 World to India (30-Day, 1-Year e-Tourist)
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <div className="text-2xl font-bold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Verified Official Portals</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <div className="text-2xl font-bold text-blue-600">99.4%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Document Compliance Rate</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <div className="text-2xl font-bold text-slate-900">170+</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Eligible Nationalities</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <div className="text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-xs text-slate-500 font-medium mt-1">AI Assistant & Case Vault</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Destinations & Programs */}
      <section className="py-16 md:py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                <Compass className="w-4 h-4" />
                <span>Verified Programs</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured e-Visa Categories
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Explore real processing timelines, official consular fees, and required checklists.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFlowFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  flowFilter === 'ALL' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Destinations
              </button>
              <button
                type="button"
                onClick={() => setFlowFilter('INDIA_TO_WORLD')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  flowFilter === 'INDIA_TO_WORLD' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                India → World
              </button>
              <button
                type="button"
                onClick={() => setFlowFilter('WORLD_TO_INDIA')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  flowFilter === 'WORLD_TO_INDIA' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                World → India
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPrograms
              .filter((p) => (flowFilter === 'ALL' ? true : p.flowType === flowFilter))
              .map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition duration-200 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {program.flowType === 'WORLD_TO_INDIA' ? 'Travel to India' : 'Outbound Visa'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition">
                          {program.countryName}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">{program.visaType}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Govt Fee</span>
                        <span className="text-base font-bold text-slate-900">${program.officialFeeUSD}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {program.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity</span>
                        <span className="font-semibold text-slate-800">{program.validity}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Processing</span>
                        <span className="font-semibold text-slate-800">~{program.processingTimeDays} business days</span>
                      </div>
                    </div>

                    {/* Official source badge */}
                    <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="truncate pr-1">Portal: {program.officialSourceName}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <Link
                      to={`/destinations/${program.id}`}
                      className="flex-1 py-2 text-center text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/70 rounded-lg transition"
                    >
                      View Requirements
                    </Link>
                    <Link
                      to={`/customer/applications?programId=${program.id}`}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1 shadow-2xs"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/destinations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>Explore all destinations & categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. How It Works (4-Step Process) */}
      <section className="py-16 md:py-24 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              A Transparent, 4-Step Filing Journey
            </h2>
            <p className="text-sm text-slate-600">
              Zero ambiguity. Every phase is audited for sovereign immigration compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center mb-4 text-sm border border-blue-100">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Check Eligibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete our interactive questionnaire to verify passport validity rules, stay limits, and sovereign entry exemptions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center mb-4 text-sm border border-blue-100">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Vault Documents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your passport biodata scan and photograph to your private encrypted document vault with strict access controls.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center mb-4 text-sm border border-blue-100">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Specialist Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An assigned accredited case consultant verifies file resolution, ICAO biometric lines, and return flight criteria.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center mb-4 text-sm border border-blue-100">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Filing & Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive live status tracking, verified government reference numbers, and your finalized electronic visa document.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AI Visa Assistant Spotlight */}
      <section className="py-16 md:py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-linear-to-r from-blue-50 via-white to-slate-50 border border-blue-200 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/60 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Multilingual: English • ગુજરાતી • हिन्दी</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Meet Aura: Your Factual AI Visa Consultant
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Ask specific questions about photo dimensions, required bank balance, transit visa policies, or Indian/UAE e-Visa procedures. Aura only cites verified government portals and discloses uncertainty when rules require consular discretion.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                {onOpenAiAssistant && (
                  <button
                    type="button"
                    onClick={onOpenAiAssistant}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch AI Assistant</span>
                  </button>
                )}
                <Link
                  to="/eligibility"
                  className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Take Eligibility Quiz
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-800">Aura Live Assistant Preview</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 space-y-2 border border-slate-100">
                <p className="font-semibold text-blue-700">Applicant: "Can I enter Dubai on a 30-day visa if my passport expires in 4 months?"</p>
                <p className="text-slate-600 leading-relaxed">
                  Aura: "No. Under official UAE Federal Authority for Identity (ICP) regulations, your passport must possess a minimum of 6 months validity from the date of arrival. Entering with 4 months validity will lead to airline boarding denial."
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                  Source: ICP Smart Services (Verified: 2026-10-25)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className="py-16 md:py-20 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Clear answers regarding statutory compliance, security protocols, and our consultancy role.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-blue-600 transition text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 text-lg">{activeFaq === idx ? '−' : '+'}</span>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Consultation Booking CTA */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Have Complex Travel or Previous Refusals?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Book a direct video consultation with an accredited case specialist. We will review your travel history, financial dossier, and draft compelling representations.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/consultation"
              className="px-6 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule 1-on-1 Consultation</span>
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3.5 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
            >
              Submit General Enquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
