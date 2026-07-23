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

import { ModalAddUser } from './components/Modals/ModalAddUser';
import { ModalAddEvent } from './components/Modals/ModalAddEvent';
import { ModalAddNotice } from './components/Modals/ModalAddNotice';

function MainApp() {
  const { activeRoleId } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, calendar, notices, finance, users, settings

  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [modalEventOpen, setModalEventOpen] = useState(false);
  const [modalNoticeOpen, setModalNoticeOpen] = useState(false);

  const renderDashboardByRole = () => {
    switch (activeRoleId) {
      case 'admin': return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'contador': return <DashboardContador />;
      case 'coach': return <DashboardCoach onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} onOpenModalNotice={() => setModalNoticeOpen(true)} />;
      case 'socio': return <DashboardSocio />;
      default: return <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} activeRoleId={activeRoleId} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          {currentTab === 'dashboard' && renderDashboardByRole()}
          {currentTab === 'calendar' && <CalendarModule onOpenModalEvent={() => setModalEventOpen(true)} />}
          {currentTab === 'notices' && <NoticeBoard onOpenModalNotice={() => setModalNoticeOpen(true)} />}
          {currentTab === 'finance' && <DashboardContador />}
          {currentTab === 'users' && <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />}
          {currentTab === 'settings' && <DashboardAdmin onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />}
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
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}