import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS, MOCK_PAYMENTS, MOCK_EVENTS, MOCK_NOTICES, MOCK_ROLES } from '../mockData/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Active role selector for demo (admin, contador, coach, socio)
  const [activeRoleId, setActiveRoleId] = useState('admin');
  
  // Data states initialized from localStorage or mockData
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('hf_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('hf_payments');
    return saved ? JSON.parse(saved) : MOCK_PAYMENTS;
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('hf_events');
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('hf_notices');
    return saved ? JSON.parse(saved) : MOCK_NOTICES;
  });

  const [clubSettings, setClubSettings] = useState({
    nombreClub: 'Haedo Futsal',
    aliasMercadoPago: 'HAEDOFUTSAL.MP',
    cuitClub: '30-71234567-8',
    montoCuotaGeneral: 15000,
    cuentaTitular: 'Club Social y Deportivo Haedo Futsal'
  });

  // Current active logged in user based on selected role
  const currentUser = users.find(u => u.rol === activeRoleId) || users[0];

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('hf_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('hf_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('hf_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('hf_notices', JSON.stringify(notices));
  }, [notices]);

  // Attempt Supabase sync if credentials exist
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      console.log('Supabase configurado: listos para sincronizar datos remotos.');
    }
  }, []);

  // --- ACTIONS ---

  // 1. Submit payment receipt (From Socio)
  const uploadPaymentReceipt = (receiptData) => {
    const newPayment = {
      id: `pay-${Date.now()}`,
      socioId: currentUser.id,
      socioNombre: `${currentUser.nombre} ${currentUser.apellido}`,
      numeroOperacion: receiptData.numeroOperacion || `MP-${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      monto: Number(receiptData.monto) || 15000,
      billeteraOrigen: receiptData.billeteraOrigen || 'Mercado Pago',
      emisorNombre: receiptData.emisorNombre || `${currentUser.nombre} ${currentUser.apellido}`,
      fechaTransferencia: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      comprobanteUrl: receiptData.comprobanteUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
      estado: 'en_revision',
      observaciones: receiptData.observaciones || 'Comprobante subido desde billetera virtual.'
    };

    setPayments(prev => [newPayment, ...prev]);

    // Set socio status to pending review
    setUsers(prev => prev.map(u => 
      u.id === currentUser.id ? { ...u, estadoCuota: 'pendiente' } : u
    ));

    return newPayment;
  };

  // 2. Approve or Reject Payment (From Contador / Admin)
  const updatePaymentStatus = (paymentId, newStatus, obs = '') => {
    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        const updated = { ...p, estado: newStatus, observaciones: obs || p.observaciones };
        
        // If approved, update socio fee status to 'al_dia'
        if (newStatus === 'aprobado') {
          setUsers(userList => userList.map(u => 
            u.id === p.socioId ? { ...u, estadoCuota: 'al_dia' } : u
          ));
        } else if (newStatus === 'rechazado') {
          setUsers(userList => userList.map(u => 
            u.id === p.socioId ? { ...u, estadoCuota: 'moroso' } : u
          ));
        }

        return updated;
      }
      return p;
    }));
  };

  // 3. Add or Edit Socio (From Coach / Admin)
  const addOrUpdateUser = (userData) => {
    if (userData.id) {
      setUsers(prev => prev.map(u => u.id === userData.id ? { ...u, ...userData } : u));
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        numeroSocio: users.length + 201,
        estadoCuota: 'al_dia',
        montoCuota: 15000,
        ...userData
      };
      setUsers(prev => [...prev, newUser]);
    }
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // 4. Add Event (From Coach / Admin)
  const addEvent = (eventData) => {
    const newEvt = {
      id: `evt-${Date.now()}`,
      creadoPor: currentUser.nombre,
      ...eventData
    };
    setEvents(prev => [newEvt, ...prev]);
  };

  // 5. Add Notice (From Coach / Admin)
  const addNotice = (noticeData) => {
    const newNotice = {
      id: `not-${Date.now()}`,
      autor: `${currentUser.nombre} (${currentUser.rol.toUpperCase()})`,
      fecha: new Date().toISOString().split('T')[0],
      ...noticeData
    };
    setNotices(prev => [newNotice, ...prev]);
  };

  // Financial Stats Calculation
  const totalRecaudado = payments
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + Number(p.monto), 0);

  const pagosPendientesRev = payments.filter(p => p.estado === 'en_revision');
  
  const sociosAlDiaCount = users.filter(u => u.estadoCuota === 'al_dia').length;
  const sociosPendientesCount = users.filter(u => u.estadoCuota === 'pendiente').length;
  const sociosMorososCount = users.filter(u => u.estadoCuota === 'moroso').length;

  return (
    <AppContext.Provider value={{
      activeRoleId,
      setActiveRoleId,
      currentUser,
      users,
      payments,
      events,
      notices,
      clubSettings,
      setClubSettings,
      roles: MOCK_ROLES,
      uploadPaymentReceipt,
      updatePaymentStatus,
      addOrUpdateUser,
      deleteUser,
      addEvent,
      addNotice,
      stats: {
        totalRecaudado,
        pagosPendientesRev,
        sociosAlDiaCount,
        sociosPendientesCount,
        sociosMorososCount,
        totalSocios: users.length
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
