import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileCheck,
  Calendar,
  CheckSquare,
  LogOut,
  Globe,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Consultant Dashboard', href: '/consultant/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Cases', href: '/consultant/applications', icon: Briefcase },
    { label: 'Document Review Tasks', href: '/consultant/tasks', icon: CheckSquare },
    { label: 'My Applicants', href: '/consultant/customers', icon: Users },
    { label: 'Consular Appointments', href: '/consultant/appointments', icon: Calendar },
  ];

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/consultant/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block">AuraVisa</span>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Consultant Desk</span>
            </div>
          </Link>
        </div>

        {/* User Badge */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Specialist</span>
          <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-[11px] text-slate-500 truncate block">{user?.email}</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
