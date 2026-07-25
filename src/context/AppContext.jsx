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
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('hf_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    if (logs && logs.length > 0) {
      try {
        localStorage.setItem('hf_audit_logs', JSON.stringify(logs.slice(0, 200)));
      } catch (e) {}
    }
  }, [logs]);

  // Helper para normalizar claves minúsculas que emite Supabase Realtime (WAL) a las propiedades camelCase de React
  const normalizeKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const normalized = { ...obj };

    for (const key of Object.keys(obj)) {
      const lower = key.toLowerCase();
      if (lower === 'socioid') normalized.socioId = obj[key];
      if (lower === 'socionombre') normalized.socioNombre = obj[key];
      if (lower === 'numerooperacion') normalized.numeroOperacion = obj[key];
      if (lower === 'billeteraorigen') normalized.billeteraOrigen = obj[key];
      if (lower === 'emisornombre') normalized.emisorNombre = obj[key];
      if (lower.startsWith('fechatransfe') || lower.startsWith('fechatansfe')) normalized.fechaTransferencia = obj[key];
      if (lower === 'comprobanteurl') normalized.comprobanteUrl = obj[key];
      if (lower === 'fechahora') normalized.fechaHora = obj[key];
      if (lower === 'usuarionombre') normalized.usuarioNombre = obj[key];
      if (lower === 'usuariorol') normalized.usuarioRol = obj[key];
      if (lower === 'tipoevento') normalized.tipoEvento = obj[key];
      if (lower === 'numerosocio') normalized.numeroSocio = obj[key];
      if (lower === 'estadocuota') normalized.estadoCuota = obj[key];
      if (lower === 'montocuota') normalized.montoCuota = obj[key];
      if (lower === 'creadopor') normalized.creadoPor = obj[key];
      if (lower === 'coelsaid') normalized.coelsaId = obj[key];
    }

    return normalized;
  };

  const mergeSafeRows = (oldItem, newItem) => {
    const merged = { ...oldItem };
    for (const key in newItem) {
      if (newItem[key] !== undefined && newItem[key] !== null) {
        merged[key] = newItem[key];
      }
    }
    return merged;
  };

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

  // Load from Supabase on mount and setup Realtime subscriptions
  useEffect(() => {
    let channel = null;

    const handleRealtimeChange = (table, payload, setter, appendAtEnd = false) => {
      const { eventType, new: rawNew, old: rawOld } = payload;
      const newRow = normalizeKeys(rawNew);
      const oldRow = normalizeKeys(rawOld);

      if (eventType === 'INSERT') {
        setter(prev => {
          if (prev.some(item => item.id === newRow.id)) {
            return prev.map(item => item.id === newRow.id ? mergeSafeRows(item, newRow) : item);
          }
          return appendAtEnd ? [...prev, newRow] : [newRow, ...prev];
        });
      } else if (eventType === 'UPDATE') {
        setter(prev => prev.map(item => item.id === newRow.id ? mergeSafeRows(item, newRow) : item));
      } else if (eventType === 'DELETE') {
        setter(prev => prev.filter(item => item.id !== oldRow.id));
      }
    };

    const setupRealtime = () => {
      if (!isSupabaseConfigured || !supabase) return;
      channel = supabase
        .channel('app_realtime_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments' },
          (payload) => handleRealtimeChange('payments', payload, setPayments)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          (payload) => {
            handleRealtimeChange('users', payload, setUsers, true);
            if (payload.eventType === 'UPDATE' && payload.new) {
              const norm = normalizeKeys(payload.new);
              setCurrentUser(curr => curr && curr.id === norm.id ? { ...curr, ...norm } : curr);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'logs' },
          (payload) => handleRealtimeChange('logs', payload, setLogs)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'movimientos' },
          (payload) => handleRealtimeChange('movimientos', payload, setMovimientosFinancieros)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notices' },
          (payload) => handleRealtimeChange('notices', payload, setNotices)
        )
        .subscribe();
    };

    const loadData = async () => {
      setLoadingDb(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const [uRes, pRes, eRes, nRes, mRes, lRes] = await Promise.all([
            supabase.from('users').select('*').order('created_at', { ascending: true }),
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('events').select('*').order('created_at', { ascending: false }),
            supabase.from('notices').select('*').order('created_at', { ascending: false }),
            supabase.from('movimientos').select('*').order('created_at', { ascending: false }),
            supabase.from('logs').select('*').order('created_at', { ascending: false })
          ]);
          if (uRes.data) setUsers(uRes.data.map(normalizeKeys));
          if (pRes.data) setPayments(pRes.data.map(normalizeKeys));
          if (eRes.data) setEvents(eRes.data.map(normalizeKeys));
          if (nRes.data) setNotices(nRes.data.map(normalizeKeys));
          if (mRes.data) setMovimientosFinancieros(mRes.data.map(normalizeKeys));
          if (lRes.data) {
            const dbLogs = lRes.data.map(normalizeKeys);
            setLogs(prev => {
              const combined = [...dbLogs];
              const dbIds = new Set(dbLogs.map(l => l.id));
              for (const localLog of prev) {
                if (!dbIds.has(localLog.id)) {
                  combined.push(localLog);
                }
              }
              return combined;
            });
          }

          setupRealtime();
        } catch (error) {
          console.error("Error loading data from Supabase:", error);
        }
      }
      setLoadingDb(false);
    };

    loadData();

    return () => {
      if (channel && isSupabaseConfigured && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hf_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hf_current_user');
    }
  }, [currentUser]);

  // Captura global de errores de cliente en cualquier dispositivo
  useEffect(() => {
    const handleGlobalError = (event) => {
      const msg = event.message || (event.reason ? String(event.reason?.message || event.reason) : '');
      if (msg && !msg.includes('ResizeObserver')) {
        registrarLog('error_sistema', 'Error de cliente en dispositivo', msg);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, [currentUser]);

  // Login / Logout
  const login = (usuario, clave) => {
    const userMatch = users.find(u => 
      u.usuario?.toLowerCase() === usuario.toLowerCase() && 
      u.clave === clave
    );
    if (userMatch) {
      setCurrentUser(userMatch);
      registrarLog('login_usuario', `Inicio de sesión exitoso`, `Usuario: ${userMatch.usuario} • Rol: ${userMatch.rol}`, userMatch);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) registrarLog('logout_usuario', `Cierre de sesión`, `Usuario: ${currentUser.usuario}`);
    setCurrentUser(null);
  };

  // Audit Logs
  const registrarLog = async (tipoEvento, descripcion, detalles = '', userOverride = null) => {
    const userToRecord = userOverride || currentUser;
    const newLog = {
      id: `log-${Date.now()}`,
      fechaHora: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      usuarioNombre: userToRecord ? `${userToRecord.nombre} ${userToRecord.apellido}` : 'Sistema',
      usuarioRol: userToRecord ? userToRecord.rol : 'sistema',
      tipoEvento,
      descripcion,
      detalles
    };
    setLogs(prev => {
      if (prev.some(l => l.id === newLog.id)) return prev;
      return [newLog, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('logs').insert([newLog]);
      } catch (err) {
        console.warn("Supabase log insert error:", err);
      }
    }
  };

  const clearLogs = async () => {
    setLogs([]);
    try {
      localStorage.removeItem('hf_audit_logs');
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('logs').delete().neq('id', 'clear_sentinel');
      } catch (err) {
        console.warn("Supabase clear logs error:", err);
      }
    }

    registrarLog('limpieza_logs', 'Se purgaron todos los logs de auditoría anteriores');
  };

  // Mercado Pago
  const mpAccessToken = import.meta.env.VITE_MP_ACCESS_TOKEN || 'APP_USR-3322444120483456-072316-c328d2ad7cb6de93a33a94812589756e-43153257';
  const sincronizarMercadoPago = async () => {
    if (!mpAccessToken) return [];
    try {
      const realTransfers = await fetchMercadoPagoTransfers(mpAccessToken);
      if (Array.isArray(realTransfers) && realTransfers.length > 0) {
        let updatedList = [];
        setMercadoPagoTransfers(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArray.map(t => t.numeroOperacion));
          const newItems = realTransfers.filter(t => !existingIds.has(t.numeroOperacion));
          updatedList = [...newItems, ...prevArray];
          return updatedList;
        });
        return updatedList.length > 0 ? updatedList : realTransfers;
      }
      return mercadoPagoTransfers;
    } catch (err) {
      console.warn('Sincronización MP:', err);
      return mercadoPagoTransfers;
    }
  };

  useEffect(() => {
    sincronizarMercadoPago();
  }, []);

  const vincularTransferenciaMP = (mpId, paymentIdOrUser) => {
    const targetMp = mercadoPagoTransfers.find(t => t.id === mpId);
    if (!targetMp) return false;

    let targetPayment = payments.find(p => p.id === paymentIdOrUser);
    let socioTarget = null;

    if (!targetPayment) {
      const cleanUserId = String(paymentIdOrUser).replace('pay-manual-', '');
      socioTarget = users.find(u => u.id === cleanUserId || u.id === paymentIdOrUser);
    } else {
      socioTarget = users.find(u => u.id === targetPayment.socioId);
    }

    const socioNombre = targetPayment?.socioNombre || (socioTarget ? `${socioTarget.nombre} ${socioTarget.apellido}` : targetMp.emisorNombre);

    setMercadoPagoTransfers(prev => prev.map(t => 
      t.id === mpId ? { ...t, estado: 'conciliado', asociadoAPagoId: targetPayment?.id || paymentIdOrUser, socioNombre } : t
    ));

    if (targetPayment) {
      updatePaymentStatus(targetPayment.id, 'aprobado', `Conciliado con MP N° ${targetMp.numeroOperacion}`);
    } else if (socioTarget) {
      // Marcar al socio al día si se vincula la transferencia directamente
      setUsers(userList => userList.map(u => u.id === socioTarget.id ? { ...u, estadoCuota: 'al_dia' } : u));
      if (isSupabaseConfigured && supabase) {
        try {
          supabase.from('users').update({ estadoCuota: 'al_dia' }).eq('id', socioTarget.id);
        } catch (e) {}
      }
    }

    registrarLog('conciliacion_mp', `Transferencia MP N° ${targetMp.numeroOperacion} vinculada a ${socioNombre}`);
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('movimientos').insert([newMov]);
      } catch (err) {
        console.warn("Supabase insert error:", err);
      }
    }

    registrarLog(
      movData.tipo === 'ingreso' ? 'ingreso_manual' : 'gasto_manual',
      `${movData.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado en ${movData.caja}`,
      `Monto: $${newMov.monto} • Concepto: ${newMov.concepto}`
    );
  };

  const deleteMovimientoFinanciero = async (movId) => {
    const targetMovimiento = movimientosFinancieros.find(m => m.id === movId);
    if (!targetMovimiento) return;

    setMovimientosFinancieros(prev => prev.filter(m => m.id !== movId));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('movimientos').delete().eq('id', movId);
      } catch (err) {
        console.warn("Supabase delete error:", err);
      }
    }
    
    registrarLog('movimiento_eliminado', `Movimiento eliminado por administrador`);
  };

  // Users / Socios
  const addOrUpdateUser = async (userData) => {
    if (userData.id) {
      setUsers(prev => prev.map(u => u.id === userData.id ? { ...u, ...userData } : u));
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('users').update(userData).eq('id', userData.id);
        } catch (err) {
          console.warn("Supabase update error:", err);
        }
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
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('users').insert([newUser]);
        } catch (err) {
          console.warn("Supabase insert error:", err);
        }
      }
      registrarLog('alta_usuario', `Alta de usuario (${newUser.nombre})`, `Rol: ${newUser.rol}`);
    }
  };

  const deleteUser = async (userId) => {
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').delete().eq('id', userId);
      } catch (err) {
        console.warn("Supabase delete error:", err);
      }
    }
    if (target) registrarLog('baja_usuario', `Baja de usuario (${target.nombre})`, `Rol: ${target.rol}`);
  };

  // Payments
  const uploadPaymentReceipt = async (receiptData) => {
    const newPayment = {
      id: `pay-${Date.now()}`,
      socioId: currentUser.id,
      socioNombre: `${currentUser.nombre} ${currentUser.apellido}`,
      numeroOperacion: receiptData.numeroOperacion || `MANUAL-SYS-${Date.now()}`,
      monto: Number(receiptData.monto) || 15000,
      billeteraOrigen: receiptData.billeteraOrigen || 'Mercado Pago',
      emisorNombre: receiptData.emisorNombre || `${currentUser.nombre}`,
      fechaTransferencia: receiptData.fechaTransferencia || new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      comprobanteUrl: receiptData.comprobanteUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
      estado: receiptData.estado || 'en_revision',
      observaciones: receiptData.observaciones || 'Comprobante subido desde app.'
    };

    setPayments(prev => [newPayment, ...prev]);
    
    // Optimistic user state update
    const newSocioStatus = newPayment.estado === 'aprobado' ? 'al_dia' : 'pendiente';
    const updatedUser = { ...currentUser, estadoCuota: newSocioStatus };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('payments').insert([newPayment]),
          supabase.from('users').update({ estadoCuota: newSocioStatus }).eq('id', currentUser.id)
        ]);
      } catch (err) {
        console.warn("Supabase payment insert error:", err);
      }
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

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('payments').update({ estado: newStatus, observaciones: obs || targetPayment.observaciones }).eq('id', paymentId),
          supabase.from('users').update({ estadoCuota: newSocioStatus }).eq('id', targetPayment.socioId)
        ]);
      } catch (err) {
        console.warn("Supabase update payment status error:", err);
      }
    }

    registrarLog(
      newStatus === 'aprobado' ? 'comprobante_aprobado' : 'comprobante_rechazado',
      `Comprobante N° ${targetPayment.numeroOperacion} marcado como ${newStatus.toUpperCase()}`
    );
  };

  const deletePayment = async (paymentId) => {
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetPayment) return;
    
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('payments').delete().eq('id', paymentId);
      if (error) {
        console.error('Supabase Delete Error:', error);
        alert('Error al borrar de la base de datos: ' + JSON.stringify(error));
      }
    }
    
    registrarLog('comprobante_eliminado', `Comprobante de ${targetPayment.socioNombre} eliminado por administrador`);
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
      registrarLog, clearLogs, registrarPagoEfectivoCoach,
      cuotasPorCategoria, updateCuotaCategoria,
      clubSettings, setClubSettings,
      roles: MOCK_ROLES,
      uploadPaymentReceipt, updatePaymentStatus, deletePayment,
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
