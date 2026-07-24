import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchMercadoPagoTransfers } from '../services/mercadopago';
import { MOCK_ROLES } from '../mockData/initialData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hf_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [movimientosFinancieros, setMovimientosFinancieros] = useState([]);
  const [mercadoPagoTransfers, setMercadoPagoTransfers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Settings and Cuotas
  const [cuotasPorCategoria, setCuotasPorCategoria] = useState({
    'BAFI Femenino': 15000,
    'EDEFI Mayores': 15000,
    'EDEFI Baby': 15000,
    'FUTSALA Promo': 15000,
    'FUTSALA Masculino': 15000,
    'BAFI Masculino': 15000
  });

  const [clubSettings, setClubSettings] = useState({
    nombreClub: 'Haedo Futsal',
    aliasMercadoPago: 'HAEDOFUTSAL.MP',
    cuitClub: '30-71234567-8',
    montoCuotaGeneral: 15000,
    cuentaTitular: 'Club Social y Deportivo Haedo Futsal'
  });

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingDb(true);
      if (isSupabaseConfigured) {
        try {
          const [uRes, pRes, eRes, nRes, mRes, lRes] = await Promise.all([
            supabase.from('users').select('*').order('created_at', { ascending: true }),
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('events').select('*').order('created_at', { ascending: false }),
            supabase.from('notices').select('*').order('created_at', { ascending: false }),
            supabase.from('movimientos').select('*').order('created_at', { ascending: false }),
            supabase.from('logs').select('*').order('created_at', { ascending: false })
          ]);
          if (uRes.data) setUsers(uRes.data);
          if (pRes.data) setPayments(pRes.data);
          if (eRes.data) setEvents(eRes.data);
          if (nRes.data) setNotices(nRes.data);
          if (mRes.data) setMovimientosFinancieros(mRes.data);
          if (lRes.data) setLogs(lRes.data);
        } catch (error) {
          console.error("Error loading data from Supabase:", error);
        }
      }
      setLoadingDb(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hf_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hf_current_user');
    }
  }, [currentUser]);

  // Login / Logout
  const login = (usuario, clave) => {
    const userMatch = users.find(u => 
      u.usuario?.toLowerCase() === usuario.toLowerCase() && 
      u.clave === clave
    );
    if (userMatch) {
      setCurrentUser(userMatch);
      registrarLog('login_usuario', `Inicio de sesión exitoso`, `Usuario: ${userMatch.usuario} • Rol: ${userMatch.rol}`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) registrarLog('logout_usuario', `Cierre de sesión`, `Usuario: ${currentUser.usuario}`);
    setCurrentUser(null);
  };

  // Audit Logs
  const registrarLog = async (tipoEvento, descripcion, detalles = '') => {
    const newLog = {
      id: `log-${Date.now()}`,
      fechaHora: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Sistema',
      usuarioRol: currentUser ? currentUser.rol : 'sistema',
      tipoEvento,
      descripcion,
      detalles
    };
    setLogs(prev => [newLog, ...prev]);
    if (isSupabaseConfigured) {
      await supabase.from('logs').insert([newLog]).catch(console.error);
    }
  };

  // Mercado Pago
  const mpAccessToken = import.meta.env.VITE_MP_ACCESS_TOKEN || '';
  const sincronizarMercadoPago = async () => {
    if (!mpAccessToken) return;
    try {
      const realTransfers = await fetchMercadoPagoTransfers(mpAccessToken);
      if (Array.isArray(realTransfers) && realTransfers.length > 0) {
        setMercadoPagoTransfers(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArray.map(t => t.numeroOperacion));
          const newItems = realTransfers.filter(t => !existingIds.has(t.numeroOperacion));
          return [...newItems, ...prevArray];
        });
      }
    } catch (err) {
      console.warn('Sincronización MP:', err);
    }
  };

  useEffect(() => {
    sincronizarMercadoPago();
  }, []);

  const vincularTransferenciaMP = (mpId, paymentId) => {
    const targetMp = mercadoPagoTransfers.find(t => t.id === mpId);
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetMp || !targetPayment) return false;

    setMercadoPagoTransfers(prev => prev.map(t => 
      t.id === mpId ? { ...t, estado: 'conciliado', asociadoAPagoId: paymentId, socioNombre: targetPayment.socioNombre } : t
    ));
    updatePaymentStatus(paymentId, 'aprobado', `Conciliado automáticamente con MP N° ${targetMp.numeroOperacion}`);
    return true;
  };

  // Finances (Movimientos)
  const addMovimientoFinanciero = async (movData) => {
    const newMov = {
      id: `mov-${Date.now()}`,
      caja: movData.caja,
      tipo: movData.tipo,
      monto: Number(movData.monto),
      concepto: movData.concepto,
      categoria: movData.categoria || '',
      responsable: movData.responsable || `${currentUser.nombre} ${currentUser.apellido} (${currentUser.rol.toUpperCase()})`,
      fecha: new Date().toLocaleDateString('es-AR')
    };
    setMovimientosFinancieros(prev => [newMov, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('movimientos').insert([newMov]).catch(console.error);
    }

    registrarLog(
      movData.tipo === 'ingreso' ? 'ingreso_manual' : 'gasto_manual',
      `${movData.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado en ${movData.caja}`,
      `Monto: $${newMov.monto} • Concepto: ${newMov.concepto}`
    );
  };

  const deleteMovimientoFinanciero = async (movId) => {
    setMovimientosFinancieros(prev => prev.filter(m => m.id !== movId));
    if (isSupabaseConfigured) {
      await supabase.from('movimientos').delete().eq('id', movId).catch(console.error);
    }
  };

  // Users / Socios
  const addOrUpdateUser = async (userData) => {
    if (userData.id) {
      setUsers(prev => prev.map(u => u.id === userData.id ? { ...u, ...userData } : u));
      if (isSupabaseConfigured) {
        await supabase.from('users').update(userData).eq('id', userData.id).catch(console.error);
      }
      registrarLog('modificacion_usuario', `Usuario modificado (${userData.nombre})`, `Rol: ${userData.rol}`);
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        numeroSocio: users.length + 201,
        estadoCuota: 'al_dia',
        montoCuota: 15000,
        ...userData
      };
      setUsers(prev => [...prev, newUser]);
      if (isSupabaseConfigured) {
        await supabase.from('users').insert([newUser]).catch(console.error);
      }
      registrarLog('alta_usuario', `Alta de usuario (${newUser.nombre})`, `Rol: ${newUser.rol}`);
    }
  };

  const deleteUser = async (userId) => {
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (isSupabaseConfigured) {
      await supabase.from('users').delete().eq('id', userId).catch(console.error);
    }
    if (target) registrarLog('baja_usuario', `Baja de usuario (${target.nombre})`, `Rol: ${target.rol}`);
  };

  // Payments
  const uploadPaymentReceipt = async (receiptData) => {
    const newPayment = {
      id: `pay-${Date.now()}`,
      socioId: currentUser.id,
      socioNombre: `${currentUser.nombre} ${currentUser.apellido}`,
      numeroOperacion: receiptData.numeroOperacion || `MP-${Math.floor(Math.random() * 900000000)}`,
      monto: Number(receiptData.monto) || 15000,
      billeteraOrigen: receiptData.billeteraOrigen || 'Mercado Pago',
      emisorNombre: receiptData.emisorNombre || `${currentUser.nombre}`,
      fechaTransferencia: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      comprobanteUrl: receiptData.comprobanteUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
      estado: 'en_revision',
      observaciones: receiptData.observaciones || 'Comprobante subido desde app.'
    };

    setPayments(prev => [newPayment, ...prev]);
    
    // Optimistic user state update
    const updatedUser = { ...currentUser, estadoCuota: 'pendiente' };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('payments').insert([newPayment]),
        supabase.from('users').update({ estadoCuota: 'pendiente' }).eq('id', currentUser.id)
      ]).catch(console.error);
    }

    registrarLog('comprobante_recibido', `Comprobante subido por ${currentUser.nombre}`);
    return newPayment;
  };

  const updatePaymentStatus = async (paymentId, newStatus, obs = '') => {
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetPayment) return;

    const newSocioStatus = newStatus === 'aprobado' ? 'al_dia' : (newStatus === 'rechazado' ? 'moroso' : 'pendiente');
    
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, estado: newStatus, observaciones: obs || p.observaciones } : p));
    setUsers(userList => userList.map(u => u.id === targetPayment.socioId ? { ...u, estadoCuota: newSocioStatus } : u));

    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('payments').update({ estado: newStatus, observaciones: obs || targetPayment.observaciones }).eq('id', paymentId),
        supabase.from('users').update({ estadoCuota: newSocioStatus }).eq('id', targetPayment.socioId)
      ]).catch(console.error);
    }

    registrarLog(
      newStatus === 'aprobado' ? 'comprobante_aprobado' : 'comprobante_rechazado',
      `Comprobante N° ${targetPayment.numeroOperacion} marcado como ${newStatus.toUpperCase()}`
    );
  };

  const registrarPagoEfectivoCoach = async (socioId, monto = 15000, concepto = 'Cuota en efectivo') => {
    const socioTarget = users.find(u => u.id === socioId);
    if (!socioTarget) return false;

    setUsers(prev => prev.map(u => u.id === socioId ? { ...u, estadoCuota: 'al_dia' } : u));
    
    const responsable = `${currentUser.nombre} ${currentUser.apellido} (${currentUser.rol})`;
    
    const movData = {
      id: `mov-${Date.now()}`,
      caja: 'cuotas',
      tipo: 'ingreso',
      monto: Number(monto),
      concepto: `${concepto} - Socio: ${socioTarget.nombre} (Efectivo retenido por: ${responsable})`,
      categoria: 'Cuotas Efectivo',
      responsable: responsable,
      fecha: new Date().toLocaleDateString('es-AR')
    };

    setMovimientosFinancieros(prev => [movData, ...prev]);

    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('users').update({ estadoCuota: 'al_dia' }).eq('id', socioId),
        supabase.from('movimientos').insert([movData])
      ]).catch(console.error);
    }

    registrarLog('pago_efectivo_coach', `Cobro en efectivo a ${socioTarget.nombre}`, `Responsable: ${responsable}`);
    return true;
  };

  // Events
  const addEvent = async (eventData) => {
    const newEvt = {
      id: `evt-${Date.now()}`,
      creadoPor: currentUser.nombre,
      ...eventData
    };
    setEvents(prev => [newEvt, ...prev]);
    if (isSupabaseConfigured) {
      await supabase.from('events').insert([newEvt]).catch(console.error);
    }
  };

  // Notices
  const addNotice = async (noticeData) => {
    const newNotice = {
      id: `not-${Date.now()}`,
      autor: `${currentUser.nombre} (${currentUser.rol.toUpperCase()})`,
      fecha: new Date().toISOString().split('T')[0],
      ...noticeData
    };
    setNotices(prev => [newNotice, ...prev]);
    if (isSupabaseConfigured) {
      await supabase.from('notices').insert([newNotice]).catch(console.error);
    }
  };

  const updateCuotaCategoria = (catName, nuevoMonto) => {
    setCuotasPorCategoria(prev => ({ ...prev, [catName]: Number(nuevoMonto) }));
  };

  // Stats calculation
  const totalRecaudado = payments.filter(p => p.estado === 'aprobado').reduce((sum, p) => sum + Number(p.monto), 0);
  const pagosPendientesRev = payments.filter(p => p.estado === 'en_revision');
  const sociosAlDiaCount = users.filter(u => u.estadoCuota === 'al_dia').length;
  const sociosPendientesCount = users.filter(u => u.estadoCuota === 'pendiente').length;
  const sociosMorososCount = users.filter(u => u.estadoCuota === 'moroso').length;

  const ingresosCuotasMov = movimientosFinancieros.filter(m => m.caja === 'cuotas' && m.tipo === 'ingreso').reduce((sum, m) => sum + Number(m.monto), 0);
  const gastosCuotasMov = movimientosFinancieros.filter(m => m.caja === 'cuotas' && m.tipo === 'gasto').reduce((sum, m) => sum + Number(m.monto), 0);
  const ingresosCuotasTotal = totalRecaudado + ingresosCuotasMov;
  const saldoCajaCuotas = ingresosCuotasTotal - gastosCuotasMov;

  const ingresosTorneosTotal = movimientosFinancieros.filter(m => m.caja === 'torneos' && m.tipo === 'ingreso').reduce((sum, m) => sum + Number(m.monto), 0);
  const gastosTorneosTotal = movimientosFinancieros.filter(m => m.caja === 'torneos' && m.tipo === 'gasto').reduce((sum, m) => sum + Number(m.monto), 0);
  const saldoCajaTorneos = ingresosTorneosTotal - gastosTorneosTotal;

  const totalIngresosGlobal = ingresosCuotasTotal + ingresosTorneosTotal;
  const totalGastosGlobal = gastosCuotasMov + gastosTorneosTotal;
  const balanceGeneralTotal = saldoCajaCuotas + saldoCajaTorneos;

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, payments, events, notices, movimientosFinancieros, logs, mercadoPagoTransfers,
      loadingDb, // Expose loading state
      addMovimientoFinanciero, deleteMovimientoFinanciero,
      vincularTransferenciaMP, sincronizarMercadoPago,
      registrarLog, registrarPagoEfectivoCoach,
      cuotasPorCategoria, updateCuotaCategoria,
      clubSettings, setClubSettings,
      roles: MOCK_ROLES,
      uploadPaymentReceipt, updatePaymentStatus,
      addOrUpdateUser, deleteUser,
      addEvent, addNotice,
      stats: {
        totalRecaudado, pagosPendientesRev, sociosAlDiaCount, sociosPendientesCount, sociosMorososCount,
        totalSocios: users.length, ingresosCuotasTotal, gastosCuotasMov, saldoCajaCuotas,
        ingresosTorneosTotal, gastosTorneosTotal, saldoCajaTorneos, totalIngresosGlobal, totalGastosGlobal, balanceGeneralTotal
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
