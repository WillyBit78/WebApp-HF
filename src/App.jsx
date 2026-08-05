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

import { DashboardSocios } from './components/DashboardSocios';
import { ModalFichaSocio } from './components/ModalFichaSocio';
import { ModalAddUser } from './components/Modals/ModalAddUser';
import { ModalAddEvent } from './components/Modals/ModalAddEvent';
import { ModalAddNotice } from './components/Modals/ModalAddNotice';
import { PublicRegistrationScreen } from './components/PublicRegistrationScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { StoreModule } from './components/StoreModule';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainApp() {
  const { currentUser, loadingDb, selectedSocioForModal, closeFichaSocio, registrarPagoEfectivoCoach } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, calendar, notices, finance, users, settings

  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [modalStaffOpen, setModalStaffOpen] = useState(false);
  const [modalEventOpen, setModalEventOpen] = useState(false);
  const [modalNoticeOpen, setModalNoticeOpen] = useState(false);
  const [noticeToReuse, setNoticeToReuse] = useState(null);

  // Cash payment modal triggered from global Ficha Socio
  const [cashModalSocio, setCashModalSocio] = useState(null);
  const [cashMonto, setCashMonto] = useState(15000);
  const [cashConcepto, setCashConcepto] = useState('Pago de cuota social en efectivo');

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loadingDb) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
        {/* Soft Red Background Light Glow */}
        <div className="absolute w-80 h-80 bg-red-600/25 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
           {/* Vibrant Blue Spinning Surrounding Circle */}
           <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 border-t-blue-500 border-r-blue-400 animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

           {/* Shield Logo with Soft Red Drop-Shadow */}
           <img 
             src="/logo.png?v=clean-20260726" 
             alt="Haedo Futsal Logo" 
             className="w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] z-10" 
           />
        </div>
        <p className="font-bold tracking-wide text-slate-200 text-xs uppercase tracking-widest animate-pulse z-10">Conectando con la base de datos...</p>
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
      case 'admin': return <DashboardAdmin onNavigate={setCurrentTab} onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'contador': return <DashboardContador onNavigate={setCurrentTab} initialTab="control_financiero" onOpenModalUser={() => setModalUserOpen(true)} />;
      case 'coach': return <DashboardCoach onNavigate={setCurrentTab} onOpenModalUser={() => setModalUserOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'socio': return <DashboardSocio />;
      default: return <DashboardAdmin onNavigate={setCurrentTab} onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'calendar':
        return <CalendarModule onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'notices':
        return (
          <NoticeBoard 
            onOpenModalNotice={(notice = null) => {
              setNoticeToReuse(notice);
              setModalNoticeOpen(true);
            }} 
          />
        );
      case 'store':
        return <StoreModule />;
      case 'finance':
        return <DashboardContador initialTab="control_financiero" onOpenModalUser={() => setModalUserOpen(true)} />;
      case 'users':
        return <DashboardSocios onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} />;
      case 'planteles':
        return <DashboardSocios onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} />;
      case 'settings':
        return <DashboardAdmin initialSubTab="configuracion" onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'audit-logs':
        return <DashboardAdmin initialSubTab="logs" onNavigate={setCurrentTab} onOpenModalUser={() => setModalUserOpen(true)} onOpenModalStaff={() => setModalStaffOpen(true)} onOpenModalEvent={() => setModalEventOpen(true)} />;
      case 'profile':
      case 'payments':
        return <DashboardSocio />;
      default:
        return renderDashboardByRole();
    }
  };

  const handleConfirmCashPayment = (e) => {
    e.preventDefault();
    if (!cashModalSocio) return;
    registrarPagoEfectivoCoach(cashModalSocio.id, cashMonto, cashConcepto);
    setCashModalSocio(null);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans relative">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} activeRoleId={activeRoleId} />
      
      <div className="flex-1 flex flex-col h-full w-full md:ml-64 overflow-hidden relative">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main 
          className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 md:pb-12"
        >
          {renderContent()}

          <footer className="mt-10 border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 text-center">
              © 2026 Haedo Futsal App - Sistema de Gestión Integral
            </div>
          </footer>
        </main>

        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} activeRoleId={activeRoleId} />
      </div>

      {/* Global Ficha Personal Modal */}
      {selectedSocioForModal && (
        <ModalFichaSocio 
          socio={selectedSocioForModal} 
          onClose={closeFichaSocio} 
          onOpenCashModal={(socio) => {
            setCashModalSocio(socio);
            setCashMonto(socio.montoCuota || 15000);
          }}
        />
      )}

      {/* Cash Payment Modal */}
      {cashModalSocio && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Cobrar Cuota en Efectivo</h3>
              <button onClick={() => setCashModalSocio(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmCashPayment} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Socio pagador:</div>
                <div className="font-extrabold text-white text-base mt-0.5">{cashModalSocio.nombre} {cashModalSocio.apellido}</div>
                <div className="text-[11px] text-amber-400 font-mono">N° Socio: #{cashModalSocio.numeroSocio} • Categoría: {cashModalSocio.categoria}</div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Monto Recibido ($)</label>
                <input
                  type="number"
                  required
                  value={cashMonto}
                  onChange={(e) => setCashMonto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Concepto / Período</label>
                <input
                  type="text"
                  required
                  value={cashConcepto}
                  onChange={(e) => setCashConcepto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCashModalSocio(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <PublicRegistrationScreen isModal={true} onCloseModal={() => setModalUserOpen(false)} />
        </div>
      )}

      {modalStaffOpen && <ModalAddUser onClose={() => setModalStaffOpen(false)} />}
      {modalEventOpen && <ModalAddEvent onClose={() => setModalEventOpen(false)} />}
      {modalNoticeOpen && (
        <ModalAddNotice 
          initialNotice={noticeToReuse} 
          onClose={() => {
            setModalNoticeOpen(false);
            setNoticeToReuse(null);
          }} 
        />
      )}
      
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