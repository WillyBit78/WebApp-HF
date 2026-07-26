import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardAdmin } from './components/DashboardAdmin';
import { DashboardContador } from './components/DashboardContador';
import { DashboardCoach } from './components/DashboardCoach';
import { DashboardSocio } from './components/DashboardSocio';
import { CalendarModule } from './components/CalendarModule';
import { NoticeBoard } from './components/NoticeBoard';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';

import { ModalAddUser } from './components/Modals/ModalAddUser';
import { ModalAddEvent } from './components/Modals/ModalAddEvent';
import { ModalAddNotice } from './components/Modals/ModalAddNotice';
import { PublicRegistrationScreen } from './components/PublicRegistrationScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainApp() {
  const { currentUser, loadingDb } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, calendar, notices, finance, users, settings

  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [modalStaffOpen, setModalStaffOpen] = useState(false);
  const [modalEventOpen, setModalEventOpen] = useState(false);
  const [modalNoticeOpen, setModalNoticeOpen] = useState(false);

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loadingDb) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="relative w-24 h-24 mb-6">
           <img 
             src="/logo.png" 
             alt="Haedo Futsal Logo" 
             className="w-full h-full object-contain animate-pulse drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" 
           />
           <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-ping"></div>
        </div>
        <p className="font-semibold tracking-wide text-brand-400 animate-pulse">Conectando con la base de datos...</p>
      </div>
    );
  }

  // Si no está logueado o ingresó al link público #registro
  if (hash === '#registro') {
    return <PublicRegistrationScreen onBackToLogin={() => { window.location.hash = ''; setHash(''); }} />;
  }

  if (!currentUser) {
    return <LoginScreen onOpenPublicRegister={() => { window.location.hash = '#registro'; setHash('#registro'); }} />;
  }

  const activeRoleId = currentUser.rol || 'socio';

  const renderDashboardByRole = () => {
    switch (activeRoleId) {
      case 'admin': return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'contador': return <DashboardContador onOpenModalUser={() => setModalUserOpen(true)} />;
      case 'coach': return <DashboardCoach onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} onOpenModalNotice={() => setModalNoticeOpen(true)} />;
      case 'socio': return <DashboardSocio />;
      default: return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} />;
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'calendar':
        return <CalendarModule onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'notices':
        return <NoticeBoard onOpenModalNotice={() => setModalNoticeOpen(true)} />;
      case 'finance':
        return <DashboardContador onOpenModalUser={() => setModalUserOpen(true)} />;
      case 'users':
        return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'planteles':
        return <DashboardCoach onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} onOpenModalNotice={() => setModalNoticeOpen(true)} />;
      case 'settings':
        return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'profile':
      case 'payments':
        return <DashboardSocio />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} activeRoleId={activeRoleId} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          {renderContent()}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 gap-2">
            <div>
              © 2026 Club Social y Deportivo Haedo Futsal • Sistema de Gestión Integral
            </div>
            <div className="text-[11px] text-slate-600">
              Desarrollado para PC y Celular • Integra Supabase + Vercel + GitHub
            </div>
          </div>
        </footer>

        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} activeRoleId={activeRoleId} />
      </div>

      {modalUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <PublicRegistrationScreen isModal={true} onCloseModal={() => setModalUserOpen(false)} />
        </div>
      )}

      {modalStaffOpen && <ModalAddUser onClose={() => setModalStaffOpen(false)} />}
      {modalEventOpen && <ModalAddEvent onClose={() => setModalEventOpen(false)} />}
      {modalNoticeOpen && <ModalAddNotice onClose={() => setModalNoticeOpen(false)} />}
      
      <PWAInstallBanner />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}