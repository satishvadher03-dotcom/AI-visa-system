import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';
import { AiAssistantModal } from './components/common/AiAssistantModal.tsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.tsx';
import { Role } from './types/index.ts';

// Public Pages
import { HomePage } from './pages/public/HomePage.tsx';
import { DestinationsPage } from './pages/public/DestinationsPage.tsx';
import { VisaDetailPage } from './pages/public/VisaDetailPage.tsx';
import { EligibilityPage } from './pages/public/EligibilityPage.tsx';
import { ConsultationPage } from './pages/public/ConsultationPage.tsx';
import { ContactPage } from './pages/public/ContactPage.tsx';
import { LoginPage } from './pages/public/LoginPage.tsx';
import { RegisterPage } from './pages/public/RegisterPage.tsx';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage.tsx';
import { TermsPage } from './pages/public/TermsPage.tsx';

// Customer Panel
import { CustomerLayout } from './pages/customer/CustomerLayout.tsx';
import { CustomerDashboard } from './pages/customer/CustomerDashboard.tsx';
import { CustomerApplications } from './pages/customer/CustomerApplications.tsx';
import { CustomerApplicationDetail } from './pages/customer/CustomerApplicationDetail.tsx';
import { CustomerDocuments } from './pages/customer/CustomerDocuments.tsx';
import { CustomerAppointments } from './pages/customer/CustomerAppointments.tsx';
import { CustomerEnquiries } from './pages/customer/CustomerEnquiries.tsx';
import { CustomerProfile } from './pages/customer/CustomerProfile.tsx';

// Consultant Panel
import { ConsultantLayout } from './pages/consultant/ConsultantLayout.tsx';
import { ConsultantDashboard } from './pages/consultant/ConsultantDashboard.tsx';
import { ConsultantCases } from './pages/consultant/ConsultantCases.tsx';
import { ConsultantCaseDetail } from './pages/consultant/ConsultantCaseDetail.tsx';
import { ConsultantCustomers } from './pages/consultant/ConsultantCustomers.tsx';
import { ConsultantAppointments } from './pages/consultant/ConsultantAppointments.tsx';
import { ConsultantTasks } from './pages/consultant/ConsultantTasks.tsx';

// Admin Panel
import { AdminLayout } from './pages/admin/AdminLayout.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminUsers } from './pages/admin/AdminUsers.tsx';
import { AdminConsultants } from './pages/admin/AdminConsultants.tsx';
import { AdminApplications } from './pages/admin/AdminApplications.tsx';
import { AdminVisaPrograms } from './pages/admin/AdminVisaPrograms.tsx';
import { AdminAppointments } from './pages/admin/AdminAppointments.tsx';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.tsx';
import { AdminSettings } from './pages/admin/AdminSettings.tsx';

// Role Guard Component
const ProtectedRoute: React.FC<{ allowedRoles?: Role[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Verifying security credentials..." fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this specific role panel, redirect to their home panel
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'CONSULTANT') return <Navigate to="/consultant/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Layout Container with Navbar, Footer, and Floating AI Assistant
const PublicLayout: React.FC<{ onOpenAi: () => void }> = ({ onOpenAi }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar onOpenAiAssistant={onOpenAi} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout onOpenAi={() => setIsAiModalOpen(true)} />}>
              <Route path="/" element={<HomePage onOpenAiAssistant={() => setIsAiModalOpen(true)} />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/destinations/:id" element={<VisaDetailPage />} />
              <Route path="/eligibility" element={<EligibilityPage />} />
              <Route path="/consultation" element={<ConsultationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<LoginPage />} />

            {/* 1. Customer Protected Panel */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'CONSULTANT', 'ADMIN']}>
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/customer/dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="applications" element={<CustomerApplications />} />
              <Route path="applications/:id" element={<CustomerApplicationDetail />} />
              <Route path="documents" element={<CustomerDocuments />} />
              <Route path="appointments" element={<CustomerAppointments />} />
              <Route path="enquiries" element={<CustomerEnquiries />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>

            {/* 2. Consultant Protected Panel */}
            <Route
              path="/consultant"
              element={
                <ProtectedRoute allowedRoles={['CONSULTANT', 'ADMIN']}>
                  <ConsultantLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/consultant/dashboard" replace />} />
              <Route path="dashboard" element={<ConsultantDashboard />} />
              <Route path="applications" element={<ConsultantCases />} />
              <Route path="applications/:id" element={<ConsultantCaseDetail />} />
              <Route path="customers" element={<ConsultantCustomers />} />
              <Route path="appointments" element={<ConsultantAppointments />} />
              <Route path="tasks" element={<ConsultantTasks />} />
            </Route>

            {/* 3. Admin Protected Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="consultants" element={<AdminConsultants />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="visa-programs" element={<AdminVisaPrograms />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global AI Assistant Modal */}
          <AiAssistantModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
