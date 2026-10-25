import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, ExternalLink, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      {/* Official Government Disclosure Banner */}
      <div className="bg-blue-50/70 border-b border-blue-100 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 text-xs text-blue-900 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="font-semibold">Official Regulatory Disclosure:</strong> AuraVisa Global is a private visa consultancy, eligibility assessment, and document facilitation firm. We are not an embassy, consulate, or sovereign immigration department. Final entry and visa grant authority rests strictly with the immigration department of the destination country.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Brief */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">AuraVisa Global</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Empowering global travelers with AI-assisted visa eligibility checks, verified government application dossiers, secure private document vaults, and expert consular advisory.
            </p>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>HQ: International Tower, Financial District & Consular Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>support@auravisa.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>+1 (800) 287-2847 / +91 (79) 4900-8000</span>
              </div>
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/destinations?flow=INDIA_TO_WORLD" className="hover:text-blue-600 transition">
                  India to World Visas
                </Link>
              </li>
              <li>
                <Link to="/destinations?flow=WORLD_TO_INDIA" className="hover:text-blue-600 transition">
                  World to India e-Visa
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="hover:text-blue-600 transition">
                  Eligibility Questionnaire
                </Link>
              </li>
              <li>
                <Link to="/consultation" className="hover:text-blue-600 transition">
                  Book Consular Meeting
                </Link>
              </li>
              <li>
                <Link to="/destinations" className="hover:text-blue-600 transition">
                  Document Checklists
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Accounts */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/customer/dashboard" className="hover:text-blue-600 transition">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/consultant/dashboard" className="hover:text-blue-600 transition">
                  Consultant Console
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-blue-600 transition">
                  Administrator Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-600 transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-600 transition">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Verified Official Portals */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Verified Sources</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a
                  href="https://indianvisaonline.gov.in/evisa/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1 transition"
                >
                  <span>India eVisa Official</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://smartservices.icp.gov.ae"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1 transition"
                >
                  <span>UAE ICP Smart Services</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://travel.state.gov"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1 transition"
                >
                  <span>US Travel State Gov</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://france-visas.gouv.fr"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1 transition"
                >
                  <span>France-Visas Official</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gov.uk/standard-visitor"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 flex items-center gap-1 transition"
                >
                  <span>UK Visas & Immigration</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AuraVisa Global Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-900 transition">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-900 transition">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-900 transition">
              Compliance & Ethics
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
