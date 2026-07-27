import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchMercadoPagoTransfers } from '../services/mercadopago';
import { MOCK_ROLES } from '../mockData/initialData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [movimientosFinancieros, setMovimientosFinancieros] = useState([]);
  const [mercadoPagoTransfers, setMercadoPagoTransfers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Logs are persisted ONLY in Supabase, no localStorage

  // Helper para normalizar claves minúsculas que emite Supabase Realtime (WAL) a las propiedades camelCase de React
  const normalizeKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const normalized = { ...obj };

    // Auto-migrate legacy ADMIN user to WILLY
    if (normalized.id === 'usr-1' || (normalized.usuario && normalized.usuario.trim().toUpperCase() === 'ADMIN')) {
      normalized.usuario = 'WILLY';
      normalized.nombre = 'Willy';
    }

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
      // Notice fields (Supabase uses snake_case)
      if (lower === 'destinatariotipo') normalized.destinatarioTipo = obj[key];
      if (lower === 'destinatariovalor') normalized.destinatarioValor = obj[key];
      if (lower === 'filtroestadocuenta') normalized.filtroEstadoCuenta = obj[key];
      if (lower === 'fechaprogramada') normalized.fechaProgramada = obj[key];
      if (lower === 'categoriadestino') normalized.categoriaDestino = obj[key];
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
    cuentaTitular: 'Club Social y Deportivo Haedo Futsal',
    cbuCvu: '',
    mpAccessToken: '',
    mpPublicKey: ''
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

    const refreshDataSilent = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const [uRes, pRes, mRes, lRes, nRes] = await Promise.all([
          supabase.from('users').select('*').order('created_at', { ascending: true }),
          supabase.from('payments').select('*').order('created_at', { ascending: false }),
          supabase.from('movimientos').select('*').order('created_at', { ascending: false }),
          supabase.from('logs').select('*').order('created_at', { ascending: false }),
          supabase.from('notices').select('*').order('created_at', { ascending: false })
        ]);
        if (uRes.data) {
          const dbUsers = uRes.data.map(normalizeKeys);
          setUsers(prev => {
            const dbIds = new Set(dbUsers.map(u => u.id));
            const localOnly = prev.filter(u => !dbIds.has(u.id));
            return [...dbUsers, ...localOnly];
          });
        }
        if (pRes.data) setPayments(pRes.data.map(normalizeKeys));
        if (mRes.data) setMovimientosFinancieros(mRes.data.map(normalizeKeys));
        if (lRes.data) {
          const dbLogs = lRes.data.map(normalizeKeys);
          setLogs(prev => {
            const combined = [...dbLogs];
            const dbIds = new Set(dbLogs.map(l => l.id));
            for (const localLog of prev) {
              if (!dbIds.has(localLog.id)) combined.push(localLog);
            }
            return combined;
          });
        }
        // Sync notices from Supabase so all devices stay updated
        if (nRes.data && nRes.data.length > 0) {
          setNotices(nRes.data.map(normalizeKeys));
        }
      } catch (e) {}
    };

    loadData();

    // Auto-sincronización en segundo plano cada 5 segundos para actualización instantánea sin F5
    const syncInterval = setInterval(() => {
      refreshDataSilent();
    }, 5000);

    return () => {
      clearInterval(syncInterval);
      if (channel && isSupabaseConfigured && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // All data persisted ONLY in Supabase, no localStorage writes

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

  // Base64 helper for VAPID Key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Register push subscription in Supabase for Push Notifications
  const registerPushSubscription = async (user) => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BNrO1BAPOhrooMRFovIRtRVXGwd9dxgT1ZWyzEVkPIauISEjh-EZl0MwUwaF1Wn7HJ1lOojM7CKt3he8jXvH-MQ';
      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      if (subscription && isSupabaseConfigured && supabase) {
        const subData = {
          id: `sub-${user.id}`,
          user_id: user.id,
          usuario: user.usuario,
          rol: user.rol,
          categoria: user.categoria || 'General',
          estado_cuota: user.estadoCuota || 'al_dia',
          subscription: JSON.stringify(subscription)
        };
        await supabase.from('push_subscriptions').upsert(subData).catch(() => {});
      }
    } catch (err) {
      console.warn('Push subscription notice:', err);
    }
  };

  // Auto register push subscription when user is logged in
  useEffect(() => {
    if (currentUser) {
      registerPushSubscription(currentUser);
    }
  }, [currentUser]);

  // Auth actions
  const login = (usuarioInput, claveInput) => {
    const cleanUserStr = usuarioInput.trim().toUpperCase();

    const targetUser = users.find(u => 
      u.usuario && u.usuario.trim().toUpperCase() === cleanUserStr && String(u.clave) === String(claveInput)
    );

    if (targetUser) {
      setCurrentUser(targetUser);
      registrarLog('login_usuario', `Inicio de sesión exitoso`, `Rol: ${targetUser.rol.toUpperCase()}`, targetUser);
      registerPushSubscription(targetUser);
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
    const now = new Date();
    const timestampNow = now.getTime();
    const isoNow = now.toISOString();
    const newLog = {
      id: `log-${timestampNow}`,
      created_at: isoNow,
      timestamp: timestampNow,
      fechaHora: now.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short', hour12: false }),
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

  const [auditoriaFilterStatus, setAuditoriaFilterStatus] = useState({ status: 'en_revision', ts: Date.now() });
  const [viewedNotifications, setViewedNotifications] = useState({
    aprobado: 0,
    en_revision: 0,
    rechazado: 0
  });

  const openAuditoriaStatus = (status) => {
    const cleanStatus = typeof status === 'object' ? status.status : status;
    setAuditoriaFilterStatus({ status: cleanStatus, ts: Date.now() });
  };

  const markNotificationsAsViewed = (status) => {
    if (!status) return;
    const cleanStatus = typeof status === 'object' ? status.status : status;
    const currentCount = payments.filter(p => p.estado === cleanStatus).length;
    setViewedNotifications(prev => ({
      ...prev,
      [cleanStatus]: currentCount
    }));
  };

  const vincularTransferenciaMP = (mpId, paymentIdOrUser, rawMpTx = null) => {
    let targetMp = mercadoPagoTransfers.find(t => t.id === mpId || t.numeroOperacion === mpId || t.coelsaId === mpId);
    if (!targetMp && rawMpTx) {
      targetMp = rawMpTx;
    }
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

    setMercadoPagoTransfers(prev => {
      const exists = prev.some(t => t.id === targetMp.id || t.numeroOperacion === targetMp.numeroOperacion);
      if (exists) {
        return prev.map(t => (t.id === targetMp.id || t.numeroOperacion === targetMp.numeroOperacion) ? { ...t, estado: 'conciliado', asociadoAPagoId: targetPayment?.id || paymentIdOrUser, socioNombre } : t);
      } else {
        return [{ ...targetMp, estado: 'conciliado', asociadoAPagoId: targetPayment?.id || paymentIdOrUser, socioNombre }, ...prev];
      }
    });

    if (targetPayment) {
      updatePaymentStatus(targetPayment.id, 'aprobado', `Conciliado automáticamente con MP N° ${targetMp.numeroOperacion}`);
    } else if (socioTarget) {
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
      const generatedId = `usr-${Date.now()}`;
      const isSocio = userData.rol === 'socio';
      const cleanNombre = userData.nombre || userData.nombres || '';
      const cleanApellido = userData.apellido || '';
      
      const newUser = {
        ...userData, // Preserva fotoRostro, fechaNacimiento, hinchaDe, nombreContacto, telefonoContacto, disciplinas
        id: generatedId,
        numeroSocio: userData.numeroSocio || (users.length + 201),
        montoCuota: isSocio ? (Number(userData.montoCuota) || 15000) : 0,
        categoria: isSocio ? (userData.categoria || 'BAFI Femenino (1ra)') : 'Staff',
        nombre: cleanNombre,
        nombres: cleanNombre,
        apellido: cleanApellido,
        usuario: userData.usuario || `${cleanNombre.charAt(0)}${cleanApellido.replace(/\s+/g, '')}`.toUpperCase(),
        clave: userData.clave || '1234',
        rol: userData.rol || 'socio',
        telefono: userData.telefono || '',
        dni: userData.dni || '',
        estadoCuota: isSocio ? 'pendiente' : 'al_dia'
      };

      setUsers(prev => [...prev, newUser]);

      if (isSupabaseConfigured && supabase) {
        try {
          const dbUserPayload = {
            id: newUser.id,
            numeroSocio: newUser.numeroSocio || (users.length + 201),
            nombre: newUser.nombre,
            apellido: newUser.apellido,
            usuario: newUser.usuario,
            clave: newUser.clave,
            rol: newUser.rol || 'socio',
            categoria: newUser.categoria || 'BAFI Femenino (1ra)',
            estadoCuota: newUser.estadoCuota || 'pendiente',
            montoCuota: Number(newUser.montoCuota) || 0
          };

          const { error } = await supabase.from('users').insert([dbUserPayload]);
          if (error) {
            console.error("Supabase user insert error:", error);
          }
        } catch (err) {
          console.warn("Supabase user insert catch error:", err);
        }
      }
      registrarLog('alta_usuario', `Alta de usuario (${newUser.nombre} ${newUser.apellido})`, `Rol: ${newUser.rol.toUpperCase()} • Categoría: ${newUser.categoria}`, newUser);
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
    
    // Check if socio already has an approved payment to protect AL DIA status
    const hasApprovedAlready = payments.some(p => p.socioId === currentUser.id && p.estado === 'aprobado');
    const newSocioStatus = hasApprovedAlready 
      ? 'al_dia' 
      : (newPayment.estado === 'aprobado' ? 'al_dia' : (newPayment.estado === 'en_revision' ? 'pendiente' : (currentUser.estadoCuota || 'moroso')));
    
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

    if (newPayment.estado === 'rechazado') {
      registrarLog(
        'comprobante_rechazado_duplicado', 
        `Comprobante rechazado por duplicado (${currentUser.nombre})`,
        `N° Op: ${newPayment.numeroOperacion} - ${newPayment.observaciones}`
      );
    } else {
      registrarLog('comprobante_recibido', `Comprobante subido por ${currentUser.nombre}`, `N° Op: ${newPayment.numeroOperacion}`);
    }
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

  // Notices System with Targeting and Real Push Notifications
  const [readNoticeIds, setReadNoticeIds] = useState([]);

  const addNotice = async (noticeData) => {
    const newNotice = {
      id: `not-${Date.now()}`,
      autor: `${currentUser?.nombre || 'Admin'} (${(currentUser?.rol || 'admin').toUpperCase()})`,
      fecha: new Date().toISOString().split('T')[0],
      destinatarioTipo: noticeData.destinatarioTipo || 'todos',
      destinatarioValor: noticeData.destinatarioValor || 'Todos',
      filtroEstadoCuenta: noticeData.filtroEstadoCuenta || 'todos',
      urgente: Boolean(noticeData.urgente),
      fechaProgramada: noticeData.fechaProgramada || null,
      ...noticeData
    };

    setNotices(prev => [newNotice, ...prev]);

    if (isSupabaseConfigured && supabase) {
      // Map to the exact column names the notices table has in Supabase
      const supabasePayload = {
        id: newNotice.id,
        titulo: newNotice.titulo,
        contenido: newNotice.contenido,
        autor: newNotice.autor,
        fecha: newNotice.fecha,
        urgente: newNotice.urgente,
        destinatario_tipo: newNotice.destinatarioTipo,
        destinatario_valor: newNotice.destinatarioValor,
        filtro_estado_cuenta: newNotice.filtroEstadoCuenta,
        fecha_programada: newNotice.fechaProgramada || null,
        categoria_destino: newNotice.destinatarioValor
      };

      const { error: insertErr } = await supabase.from('notices').insert([supabasePayload]);
      if (insertErr) {
        // Fallback: try inserting with minimal fields in case table has old schema
        await supabase.from('notices').insert([{
          id: newNotice.id,
          titulo: newNotice.titulo,
          contenido: newNotice.contenido,
          autor: newNotice.autor,
          urgente: newNotice.urgente
        }]).catch(() => {});
      }
    }

    if (registrarLog) {
      registrarLog(
        'notificacion_masiva',
        `Nuevo Comunicado: ${newNotice.titulo}`,
        `Destino: ${newNotice.destinatarioValor} (${newNotice.destinatarioTipo}) | Urgente: ${newNotice.urgente ? 'Sí' : 'No'}`,
        newNotice
      );
    }

    // Call Vercel Serverless Function to send Push Notifications
    try {
      const pushRes = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice)
      });
      if (pushRes.ok) {
        const pushResult = await pushRes.json();
        return { success: true, notice: newNotice, pushResult };
      }
    } catch (err) {
      console.warn('Push error:', err);
    }
    return { success: true, notice: newNotice, pushResult: null };
  };

  const deleteNotice = async (noticeId) => {
    setNotices(prev => prev.filter(n => n.id !== noticeId));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notices').delete().eq('id', noticeId).catch(console.error);
    }
  };

  const getNoticesForUser = (user) => {
    const targetUser = user || currentUser;
    if (!targetUser) return notices;
    if (targetUser.rol === 'admin' || targetUser.rol === 'contador' || targetUser.rol === 'coach') return notices;

    const userCat = (targetUser.categoria || '').toLowerCase();
    const userFeeStatus = targetUser.estadoCuota || 'al_dia';

    return notices.filter(n => {
      // Fee status filter check
      if (n.filtroEstadoCuenta === 'al_dia' && userFeeStatus !== 'al_dia') return false;
      if (n.filtroEstadoCuenta === 'pendiente' && userFeeStatus === 'al_dia') return false;

      // Targeting check
      if (!n.destinatarioTipo || n.destinatarioTipo === 'todos' || n.destinatarioValor === 'Todos' || n.categoriaDestino === 'Todos') {
        return true;
      }

      const destVal = (n.destinatarioValor || n.categoriaDestino || '').toLowerCase();
      return userCat.includes(destVal) || destVal.includes(userCat);
    });
  };

  const markNoticeAsRead = (noticeId) => {
    setReadNoticeIds(prev => prev.includes(noticeId) ? prev : [...prev, noticeId]);
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

  // Ficha Personal del Socio Modal State
  const [selectedSocioForModal, setSelectedSocioForModal] = useState(null);

  const openFichaSocio = (socioOrId) => {
    if (!socioOrId) return;
    if (typeof socioOrId === 'object') {
      setSelectedSocioForModal(socioOrId);
    } else {
      const found = users.find(u => u.id === socioOrId || u.numeroSocio === Number(socioOrId));
      if (found) setSelectedSocioForModal(found);
    }
  };

  const closeFichaSocio = () => {
    setSelectedSocioForModal(null);
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, payments, events, notices, movimientosFinancieros, logs, mercadoPagoTransfers,
      loadingDb,
      selectedSocioForModal, openFichaSocio, closeFichaSocio,
      auditoriaFilterStatus, setAuditoriaFilterStatus, openAuditoriaStatus,
      viewedNotifications, markNotificationsAsViewed,
      addMovimientoFinanciero, deleteMovimientoFinanciero,
      vincularTransferenciaMP, sincronizarMercadoPago,
      registrarLog, clearLogs, registrarPagoEfectivoCoach,
      cuotasPorCategoria, updateCuotaCategoria,
      clubSettings, setClubSettings,
      roles: MOCK_ROLES,
      uploadPaymentReceipt, updatePaymentStatus, deletePayment,
      addOrUpdateUser, deleteUser,
      addEvent, addNotice, deleteNotice, getNoticesForUser, readNoticeIds, markNoticeAsRead,
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
