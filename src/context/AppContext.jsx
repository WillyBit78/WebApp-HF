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

  const [movimientosFinancieros, setMovimientosFinancieros] = useState(() => {
    const saved = localStorage.getItem('hf_movimientos');
    return saved ? JSON.parse(saved) : [
      {
        id: 'mov-1',
        caja: 'cuotas',
        tipo: 'ingreso',
        monto: 45000,
        concepto: 'Cobro de cuotas sociales presenciales en sede',
        categoria: 'Cuotas',
        fecha: new Date().toLocaleDateString('es-AR')
      },
      {
        id: 'mov-2',
        caja: 'torneos',
        tipo: 'ingreso',
        monto: 60000,
        concepto: 'Inscripciones Torneo Clausura AFAR (Categoría Primera)',
        categoria: 'Torneos',
        fecha: new Date().toLocaleDateString('es-AR')
      },
      {
        id: 'mov-3',
        caja: 'torneos',
        tipo: 'gasto',
        monto: 18000,
        concepto: 'Pago de ternas arbitrales y mesa de control Fecha 1',
        categoria: 'Arbitrajes',
        fecha: new Date().toLocaleDateString('es-AR')
      },
      {
        id: 'mov-4',
        caja: 'cuotas',
        tipo: 'gasto',
        monto: 12000,
        concepto: 'Compra de pelotas de futsal de competición y conos',
        categoria: 'Indumentaria e Insumos',
        fecha: new Date().toLocaleDateString('es-AR')
      }
    ];
  });

  // Transferencias recibidas en vivo en la cuenta de Mercado Pago del club
  const [mercadoPagoTransfers, setMercadoPagoTransfers] = useState(() => {
    const saved = localStorage.getItem('hf_mp_transfers');
    return saved ? JSON.parse(saved) : [
      {
        id: 'mp-tx-994827164',
        numeroOperacion: '994827164',
        emisorNombre: 'Lucas Rossi',
        billeteraOrigen: 'Mercado Pago',
        monto: 15000,
        fecha: new Date().toLocaleDateString('es-AR') + ' 14:22',
        estado: 'sin_vincular',
        socioIdSugerido: 'usr-4'
      },
      {
        id: 'mp-tx-883719204',
        numeroOperacion: '883719204',
        emisorNombre: 'Carlos Gomez',
        billeteraOrigen: 'Cuenta DNI',
        monto: 15000,
        fecha: new Date().toLocaleDateString('es-AR') + ' 11:05',
        estado: 'sin_vincular',
        socioIdSugerido: 'usr-5'
      },
      {
        id: 'mp-tx-771294810',
        numeroOperacion: '771294810',
        emisorNombre: 'Mariana Lopez',
        billeteraOrigen: 'Ualá',
        monto: 15000,
        fecha: new Date().toLocaleDateString('es-AR') + ' 09:15',
        estado: 'conciliado',
        socioNombre: 'Mariana López',
        asociadoAPagoId: 'pay-2'
      }
    ];
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

  useEffect(() => {
    localStorage.setItem('hf_movimientos', JSON.stringify(movimientosFinancieros));
  }, [movimientosFinancieros]);

  useEffect(() => {
    localStorage.setItem('hf_mp_transfers', JSON.stringify(mercadoPagoTransfers));
  }, [mercadoPagoTransfers]);

  // Attempt Supabase sync if credentials exist
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      console.log('Supabase configurado: listos para sincronizar datos remotos.');
    }
  }, []);

  // --- ACTIONS ---

  // Vincular y Conciliar Transferencia de Mercado Pago con Comprobante de Socio
  const vincularTransferenciaMP = (mpId, paymentId) => {
    const targetMp = mercadoPagoTransfers.find(t => t.id === mpId);
    const targetPayment = payments.find(p => p.id === paymentId);

    if (!targetMp || !targetPayment) return false;

    // 1. Actualizar transferencia MP a 'conciliado'
    setMercadoPagoTransfers(prev => prev.map(t => 
      t.id === mpId 
        ? { ...t, estado: 'conciliado', asociadoAPagoId: paymentId, socioNombre: targetPayment.socioNombre } 
        : t
    ));

    // 2. Aprobar comprobante del socio
    updatePaymentStatus(paymentId, 'aprobado', `Conciliado automáticamente con transferencia MP N° ${targetMp.numeroOperacion}`);

    return true;
  };

  // Add new financial transaction (Ingreso o Gasto)
  const addMovimientoFinanciero = (movData) => {
    const newMov = {
      id: `mov-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-AR'),
      monto: Number(movData.monto),
      ...movData
    };
    setMovimientosFinancieros(prev => [newMov, ...prev]);
  };

  const deleteMovimientoFinanciero = (movId) => {
    setMovimientosFinancieros(prev => prev.filter(m => m.id !== movId));
  };

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

  // Cajas separadas y Balance General
  const ingresosCuotasMov = movimientosFinancieros
    .filter(m => m.caja === 'cuotas' && m.tipo === 'ingreso')
    .reduce((sum, m) => sum + Number(m.monto), 0);
  
  const gastosCuotasMov = movimientosFinancieros
    .filter(m => m.caja === 'cuotas' && m.tipo === 'gasto')
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const ingresosCuotasTotal = totalRecaudado + ingresosCuotasMov;
  const saldoCajaCuotas = ingresosCuotasTotal - gastosCuotasMov;

  const ingresosTorneosTotal = movimientosFinancieros
    .filter(m => m.caja === 'torneos' && m.tipo === 'ingreso')
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const gastosTorneosTotal = movimientosFinancieros
    .filter(m => m.caja === 'torneos' && m.tipo === 'gasto')
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const saldoCajaTorneos = ingresosTorneosTotal - gastosTorneosTotal;

  const totalIngresosGlobal = ingresosCuotasTotal + ingresosTorneosTotal;
  const totalGastosGlobal = gastosCuotasMov + gastosTorneosTotal;
  const balanceGeneralTotal = saldoCajaCuotas + saldoCajaTorneos;

  return (
    <AppContext.Provider value={{
      activeRoleId,
      setActiveRoleId,
      currentUser,
      users,
      payments,
      events,
      notices,
      movimientosFinancieros,
      addMovimientoFinanciero,
      deleteMovimientoFinanciero,
      mercadoPagoTransfers,
      vincularTransferenciaMP,
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
        totalSocios: users.length,
        // Balances profesionales
        ingresosCuotasTotal,
        gastosCuotasMov,
        saldoCajaCuotas,
        ingresosTorneosTotal,
        gastosTorneosTotal,
        saldoCajaTorneos,
        totalIngresosGlobal,
        totalGastosGlobal,
        balanceGeneralTotal
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
