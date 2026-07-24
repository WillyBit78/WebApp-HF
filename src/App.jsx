import React, { useState } from 'react';
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
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainApp() {
  const { currentUser, loadingDb } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, calendar, notices, finance, users, settings

  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [modalEventOpen, setModalEventOpen] = useState(false);
  const [modalNoticeOpen, setModalNoticeOpen] = useState(false);

  if (loadingDb) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
        <p>Conectando con la base de datos...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const activeRoleId = currentUser.rol || 'socio';

  const renderDashboardByRole = () => {
    switch (activeRoleId) {
      case 'admin': return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'contador': return <DashboardContador />;
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
        return <DashboardContador />;
      case 'users':
        return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
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

        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <strong className="text-slate-300">Haedo Futsal</strong> © {new Date().getFullYear()} • Sistema Oficial de Gestión de Club
            </div>
            <div className="text-[11px] text-slate-600">
              Desarrollado para PC y Celular • Integra Supabase + Vercel + GitHub
            </div>
          </div>
        </footer>

        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} activeRoleId={activeRoleId} />
      </div>

      {modalUserOpen && <ModalAddUser onClose={() => setModalUserOpen(false)} />}
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