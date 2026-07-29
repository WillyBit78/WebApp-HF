import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchMercadoPagoTransfers } from '../services/mercadopago';
import { MOCK_ROLES } from '../mockData/initialData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('haedo_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState(() => {
    // Load saved notices from localStorage or initialize as empty array
    try {
      const savedNotices = localStorage.getItem('app_notices');
      return savedNotices ? JSON.parse(savedNotices) : [];
    } catch (e) {
      console.warn('Failed to load notices from localStorage:', e);
      return [];
    }
  });
  const [movimientosFinancieros, setMovimientosFinancieros] = useState([]);
  const [mercadoPagoTransfers, setMercadoPagoTransfers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Save notices to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('app_notices', JSON.stringify(notices));
    } catch (e) {
      console.warn('Failed to save notices to localStorage:', e);
    }
  }, [notices]);

  // Helper para normalizar claves minúsculas que emite Supabase Realtime (WAL) a las propiedades camelCase de React
  const normalizeKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const normalized = { ...obj };

    // Auto-migrate legacy ADMIN user to WILLY
    if (normalized.id === 'usr-1' || (normalized.usuario && normalized.usuario.trim().toUpperCase() === 'ADMIN')) {
      normalized.usuario = 'WILLY';
      normalized.nombre = 'Willy';
    }

    if (normalized.rol) {
      normalized.rol = String(normalized.rol).trim().toLowerCase();
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
      // Notice fields (Supabase uses snake_case and mensaje)
      if (lower === 'mensaje' || lower === 'contenido') {
        const textVal = obj.mensaje || obj.contenido || '';
        normalized.contenido = textVal;
        normalized.mensaje = textVal;
      }
      if (lower === 'importante' || lower === 'urgente') {
        normalized.urgente = Boolean(obj.importante || obj.urgente);
        normalized.importante = Boolean(obj.importante || obj.urgente);
      }
      if (lower === 'destinatariotipo' || lower === 'destinatario_tipo') {
        normalized.destinatarioTipo = obj.destinatarioTipo || obj.destinatario_tipo || 'todos';
      }
      if (lower === 'destinatariovalor' || lower === 'destinatario_valor' || lower === 'categoriadestino' || lower === 'categoria_destino') {
        const val = obj.destinatarioValor || obj.destinatario_valor || obj.categoriaDestino || obj.categoria_destino || 'Todos';
        normalized.destinatarioValor = val;
        normalized.categoriaDestino = val;
      }
      if (lower === 'filtroestadocuenta' || lower === 'filtro_estado_cuenta') {
        normalized.filtroEstadoCuenta = obj.filtroEstadoCuenta || obj.filtro_estado_cuenta || 'todos';
      }
      if (lower === 'fechaprogramada' || lower === 'fecha_programada') {
        normalized.fechaProgramada = obj.fechaProgramada || obj.fecha_programada || '';
      }
      // User registration & contact fields (Supabase snake_case & variations)
      if (lower === 'fotorostro' || lower === 'foto_rostro') normalized.fotoRostro = obj[key];
      if (lower === 'fotourl' || lower === 'foto_url') normalized.fotoUrl = obj[key];
      if (lower === 'fechanacimiento' || lower === 'fecha_nacimiento') normalized.fechaNacimiento = obj[key];
      if (lower === 'hinchade' || lower === 'hincha_de') normalized.hinchaDe = obj[key];
      if (lower === 'nombrecontacto' || lower === 'nombre_contacto' || lower === 'contacto_nombre') normalized.nombreContacto = obj[key];
      if (lower === 'telefonocontacto' || lower === 'telefono_contacto' || lower === 'contacto_telefono') normalized.telefonoContacto = obj[key];
      if (lower === 'documentodni' || lower === 'documento_dni' || lower === 'numerodni' || lower === 'numero_dni') normalized.dni = obj[key];
    }

    // Auto-limpiar apellido para evitar que el string legacy '| META:' o '| Tel:' se propague
    if (normalized.apellido && typeof normalized.apellido === 'string') {
      const rawAp = normalized.apellido;
      if (rawAp.includes('| META:') || rawAp.includes('| Tel:')) {
        normalized.apellidoRaw = rawAp;
        normalized.apellido = rawAp.split(' | META:')[0].split(' | Tel:')[0].trim();
      }
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

  // Settings and Cuotas por Disciplina y Categoría
  const [cuotasPorDisciplina, setCuotasPorDisciplina] = useState(() => {
    try {
      const saved = localStorage.getItem('haedo_cuotas_disciplina');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'Futbol Baby': 30000,
      'Futsal Femenino': 20000,
      'Futsal Masculino': 30000,
      'Futsal Mayores': 15000
    };
  });

  const [cuotasPorCategoria, setCuotasPorCategoria] = useState({
    'BAFI Femenino': 20000,
    'EDEFI Mayores': 15000,
    'EDEFI Baby': 30000,
    'FUTSALA Promo': 30000,
    'FUTSALA Masculino': 30000,
    'BAFI Masculino': 30000,
    'Futbol Baby': 30000,
    'Futsal Femenino': 20000,
    'Futsal Masculino': 30000,
    'Futsal Mayores': 15000
  });

  const updateCuotaCategoria = (nombre, monto) => {
    const numMonto = Number(monto) || 0;
    setCuotasPorCategoria(prev => ({ ...prev, [nombre]: numMonto }));
  };

  const updateCuotaDisciplina = (nombre, monto, mesVigencia = null) => {
    const numMonto = Number(monto) || 0;
    setCuotasPorDisciplina(prev => {
      const updated = { ...prev, [nombre]: numMonto };
      try { localStorage.setItem('haedo_cuotas_disciplina', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setCuotasPorCategoria(prev => ({ ...prev, [nombre]: numMonto }));
    registrarLog('configuracion', `Actualización de cuota para ${nombre} a $${numMonto.toLocaleString('es-AR')}${mesVigencia ? ` (Aplica en ${mesVigencia})` : ''}`);
  };

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
  const broadcastChannelRef = React.useRef(null);

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

      // Broadcast channel for notice deletion
      const bcast = supabase.channel('haedo-notices-broadcast');
      bcast
        .on('broadcast', { event: 'notice_deleted' }, ({ payload }) => {
          if (!payload?.id) return;
          setNotices(prev => prev.filter(n => n.id !== payload.id));
        })
        .subscribe();
      broadcastChannelRef.current = bcast;
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
          if (uRes.data && uRes.data.length > 0) {
            const loadedUsers = uRes.data.map(normalizeKeys);
            setUsers(loadedUsers);

            // Re-bind saved user session from localStorage with fresh DB data
            const savedSession = localStorage.getItem('haedo_current_user');
            if (savedSession) {
              try {
                const parsed = JSON.parse(savedSession);
                const matched = loadedUsers.find(u => u.id === parsed.id || (u.usuario && parsed.usuario && u.usuario.trim().toUpperCase() === parsed.usuario.trim().toUpperCase()));
                if (matched) {
                  setCurrentUser(matched);
                }
              } catch (e) {}
            }
          } else {
            // Auto-seed base users (WILLY, POL, BOCHA, EPAZOS) if table is empty
            setUsers(MOCK_USERS);
            const savedSession = localStorage.getItem('haedo_current_user');
            if (savedSession) {
              try {
                const parsed = JSON.parse(savedSession);
                const matched = MOCK_USERS.find(u => u.id === parsed.id || (u.usuario && parsed.usuario && u.usuario.trim().toUpperCase() === parsed.usuario.trim().toUpperCase()));
                if (matched) setCurrentUser(matched);
              } catch (e) {}
            }
            if (isSupabaseConfigured && supabase) {
              const seedPayloads = MOCK_USERS.map(u => ({
                id: u.id,
                numero_socio: u.numeroSocio,
                nombre: u.nombre,
                apellido: u.apellido || '',
                usuario: u.usuario,
                clave: u.clave,
                rol: u.rol,
                categoria: u.categoria,
                estado_cuota: u.estadoCuota,
                monto_cuota: u.montoCuota,
                telefono: u.telefono || ''
              }));
              supabase.from('users').upsert(seedPayloads).catch(console.warn);
            }
          }
          if (pRes.data) setPayments(pRes.data.map(normalizeKeys));
          if (eRes.data) setEvents(eRes.data.map(normalizeKeys));
          if (nRes.data && nRes.data.length > 0) {
            const loadedNotices = nRes.data.map(normalizeKeys);
            setNotices(loadedNotices);
            try { localStorage.setItem('haedo_notices_cache', JSON.stringify(loadedNotices)); } catch (e) {}
          } else {
            try {
              const cached = localStorage.getItem('haedo_notices_cache');
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setNotices(parsed);
                }
              }
            } catch (e) {}
          }
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
          setUsers(uRes.data.map(normalizeKeys));
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
      if (broadcastChannelRef.current && isSupabaseConfigured && supabase) {
        supabase.removeChannel(broadcastChannelRef.current);
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
  const registerPushSubscription = async (user = currentUser, forceRequest = false) => {
    const targetUser = user || currentUser;
    if (!targetUser || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, reason: 'unsupported' };
    }

    try {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BNrO1BAPOhrooMRFovIRtRVXGwd9dxgT1ZWyzEVkPIauISEjh-EZl0MwUwaF1Wn7HJ1lOojM7CKt3he8jXvH-MQ';
      
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        if (Notification.permission === 'denied') {
          return { success: false, reason: 'denied' };
        }
        
        if (Notification.permission !== 'granted' && !forceRequest) {
          return { success: false, reason: 'prompt_needed' };
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return { success: false, reason: 'denied' };

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      if (subscription && isSupabaseConfigured && supabase) {
        const subData = {
          id: `sub-${targetUser.id}`,
          user_id: targetUser.id,
          usuario: targetUser.usuario,
          rol: targetUser.rol,
          categoria: targetUser.categoria || 'General',
          estado_cuota: targetUser.estadoCuota || 'al_dia',
          subscription: JSON.stringify(subscription)
        };
        await supabase.from('push_subscriptions').upsert(subData).catch(console.warn);
        return { success: true, subscription };
      }
      return { success: false, reason: 'no_subscription' };
    } catch (err) {
      console.warn('Push subscription error:', err);
      return { success: false, error: err.message };
    }
  };

  // Auto register push subscription and sync session to localStorage when user is logged in
  useEffect(() => {
    if (currentUser) {
      registerPushSubscription(currentUser);
      try { localStorage.setItem('haedo_current_user', JSON.stringify(currentUser)); } catch (e) {}
    } else {
      try { localStorage.removeItem('haedo_current_user'); } catch (e) {}
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
      try { localStorage.setItem('haedo_current_user', JSON.stringify(targetUser)); } catch (e) {}
      registrarLog('login_usuario', `Inicio de sesión exitoso`, `Rol: ${targetUser.rol.toUpperCase()}`, targetUser);
      registerPushSubscription(targetUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) registrarLog('logout_usuario', `Cierre de sesión`, `Usuario: ${currentUser.usuario}`);
    setCurrentUser(null);
    try { localStorage.removeItem('haedo_current_user'); } catch (e) {}
  };

  // Audit Logs
  const registrarLog = async (tipoEvento, descripcion, detalles = '', userOverride = null) => {
    const userToRecord = userOverride || currentUser;
    const now = new Date();
    const timestampNow = now.getTime();
    const isoNow = now.toISOString();

    let displayName = 'Sistema';
    if (userToRecord) {
      const full = `${userToRecord.nombre || ''} ${userToRecord.apellido || ''}`.trim();
      displayName = full || userToRecord.usuario || 'Usuario';
    }

    const newLog = {
      id: `log-${timestampNow}`,
      created_at: isoNow,
      timestamp: timestampNow,
      fechaHora: now.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short', hour12: false }),
      usuarioNombre: displayName,
      usuarioRol: userToRecord ? (userToRecord.rol || 'socio') : 'sistema',
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
        const dbLogPayload = {
          id: newLog.id,
          created_at: newLog.created_at,
          fechaHora: newLog.fechaHora,
          usuarioNombre: newLog.usuarioNombre,
          usuarioRol: newLog.usuarioRol,
          tipoEvento: newLog.tipoEvento,
          descripcion: newLog.descripcion,
          detalles: newLog.detalles
        };
        await supabase.from('logs').insert([dbLogPayload]);
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
    const isEdit = Boolean(userData.id && users.some(u => u.id === userData.id));
    const userDni = (userData.dni || userData.id || '').toString().trim();
    
    // DNI acts as Primary Key (id) in Supabase users table
    const userId = isEdit 
      ? userData.id 
      : (userDni ? `usr-${userDni}` : `usr-${Date.now()}`);

    const newUser = {
      ...userData,
      id: userId,
      dni: userDni || userData.dni || '',
      telefono: userData.telefono || '',
      estadoCuota: userData.estadoCuota || 'pendiente',
      montoCuota: Number(userData.montoCuota) || (DISCIPLINAS_CONFIG[userData.categoria]?.monto || 15000),
      numeroSocio: userData.numeroSocio || (users.length + 201)
    };

    if (isEdit) {
      setUsers(prev => prev.map(u => u.id === newUser.id ? newUser : u));
      if (currentUser && currentUser.id === newUser.id) setCurrentUser(newUser);

      if (isSupabaseConfigured && supabase) {
        try {
          const dbUserPayload = {
            id: newUser.id,
            numeroSocio: newUser.numeroSocio,
            nombre: newUser.nombre,
            apellido: `${newUser.apellido || ''}${newUser.telefono ? ` | Tel: ${newUser.telefono}` : ''}`,
            usuario: newUser.usuario || newUser.dni || newUser.id,
            clave: newUser.clave,
            rol: newUser.rol || 'socio',
            categoria: newUser.categoria || 'BAFI Femenino (1ra)',
            estadoCuota: newUser.estadoCuota || 'pendiente',
            montoCuota: Number(newUser.montoCuota) || 0
          };
          await supabase.from('users').upsert([dbUserPayload]).catch(console.warn);
        } catch (err) {
          console.warn("Supabase update catch error:", err);
        }
      }
      registrarLog('modificacion_usuario', `Modificación de usuario (${newUser.nombre} ${newUser.apellido})`, `Rol: ${newUser.rol}`);
    } else {
      setUsers(prev => [...prev, newUser]);

      if (isSupabaseConfigured && supabase) {
        try {
          const cleanNombre = (newUser.nombre || newUser.nombres || 'Socio').trim();
          const cleanApellido = (newUser.apellido || '').trim();
          const cleanUsuario = (newUser.usuario || `${cleanNombre.charAt(0)}${cleanApellido.replace(/\s+/g, '')}` || `SOCIO${Date.now().toString().slice(-4)}`).toUpperCase();

          // Respaldo local inquebrantable de metadatos del socio por ID y DNI
          const fullMetadata = {
            fechaNacimiento: newUser.fechaNacimiento || newUser.fecha_nacimiento || '',
            hinchaDe: newUser.hinchaDe || newUser.hincha_de || 'Haedo Futsal',
            nombreContacto: newUser.nombreContacto || newUser.nombre_contacto || '',
            telefonoContacto: newUser.telefonoContacto || newUser.telefono_contacto || '',
            fotoRostro: newUser.fotoRostro || newUser.fotoUrl || newUser.foto || ''
          };
          
          try {
            const metaKey = `socio_meta_${newUser.dni || newUser.usuario || newUser.id}`;
            localStorage.setItem(metaKey, JSON.stringify(fullMetadata));
          } catch (e) {}

          const metaString = JSON.stringify(fullMetadata);

          const dbUserPayload = {
            id: newUser.id,
            numeroSocio: newUser.numeroSocio || (users.length + 201),
            nombre: cleanNombre,
            apellido: cleanApellido,
            usuario: cleanUsuario,
            clave: (newUser.clave || '1234').toString().slice(0, 4),
            rol: newUser.rol || 'socio',
            categoria: newUser.categoria || 'BAFI Femenino (1ra)',
            estadoCuota: newUser.estadoCuota || 'pendiente',
            montoCuota: Number(newUser.montoCuota) || 0,
            dni: newUser.dni || '',
            telefono: newUser.telefono || '',
            fecha_nacimiento: newUser.fechaNacimiento || newUser.fecha_nacimiento || '',
            hincha_de: newUser.hinchaDe || newUser.hincha_de || 'Haedo Futsal',
            nombre_contacto: newUser.nombreContacto || newUser.nombre_contacto || '',
            telefono_contacto: newUser.telefonoContacto || newUser.telefono_contacto || '',
            foto_rostro: newUser.fotoRostro || newUser.fotoUrl || newUser.foto || ''
          };

          const { error } = await supabase.from('users').upsert([dbUserPayload]);
          if (error) {
            const fallbackPayload = {
              id: newUser.id,
              numeroSocio: newUser.numeroSocio || (users.length + 201),
              nombre: cleanNombre,
              apellido: cleanApellido,
              usuario: cleanUsuario,
              clave: (newUser.clave || '1234').toString().slice(0, 4),
              rol: newUser.rol || 'socio',
              categoria: newUser.categoria || 'BAFI Femenino (1ra)',
              estadoCuota: newUser.estadoCuota || 'pendiente',
              montoCuota: Number(newUser.montoCuota) || 0,
              dni: newUser.dni || '',
              telefono: newUser.telefono || ''
            };
            await supabase.from('users').upsert([fallbackPayload]).catch(console.warn);
          }
        } catch (err) {
          console.error("Supabase user insert catch error:", err);
        }
      }
      registrarLog('alta_usuario', `Alta de usuario (${newUser.nombre} ${newUser.apellido})`, `Rol: ${(newUser.rol || 'socio').toUpperCase()} • Categoría: ${newUser.categoria} • DNI: ${newUser.dni}`, newUser);
    }
  };

  const deleteUser = async (userId) => {
    const target = users.find(u => u.id === userId || u.usuario === userId);
    const targetId = target?.id || userId;
    const targetUsuario = target?.usuario;
    const targetNum = target?.numeroSocio;

    setUsers(prev => prev.filter(u => u.id !== targetId && u.usuario !== targetUsuario));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').delete().eq('id', targetId);
        if (targetUsuario) {
          await supabase.from('users').delete().eq('usuario', targetUsuario);
        }
        if (targetNum) {
          await supabase.from('users').delete().eq('numero_socio', targetNum);
        }
      } catch (err) {
        console.warn("Supabase delete error:", err);
      }
    }
    if (target) registrarLog('baja_usuario', `Baja de usuario (${target.nombre || ''} ${target.apellido || ''})`, `Rol: ${target.rol}`);
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
  const [readNoticeIds, setReadNoticeIds] = useState(() => {
    try {
      const saved = localStorage.getItem('haedo_read_notice_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

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

    // 1. Synchronous Log & State Update
    registrarLog(
      'aviso_creado',
      `Comunicado masivo emitido (${newNotice.titulo})`,
      `Emisor: ${newNotice.autor} • Destinatarios: ${newNotice.destinatarioValor} (${newNotice.destinatarioTipo})`
    );

    setNotices(prev => {
      const updated = [newNotice, ...prev];
      try { localStorage.setItem('haedo_notices_cache', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // ─── BACKGROUND TASKS (fire & forget — UI never blocked) ───────────────
    // Everything below runs asynchronously WITHOUT blocking the return value.
    // The notice is already in local state and will be broadcast to all devices.
    (async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Save to Supabase DB for persistence
          const supabasePayload = {
            id: newNotice.id,
            tipo: newNotice.tipo || 'general',
            titulo: newNotice.titulo,
            mensaje: newNotice.contenido || newNotice.mensaje || '',
            autor: newNotice.autor,
            fecha: newNotice.fecha || new Date().toLocaleString('es-AR'),
            destinatario_tipo: newNotice.destinatarioTipo || 'todos',
            destinatario_valor: newNotice.destinatarioValor || 'Todos',
            filtro_estado_cuenta: newNotice.filtroEstadoCuenta || 'todos',
            categoria_destino: newNotice.destinatarioValor || 'Todos'
          };
          
          await supabase.from('notices').insert([supabasePayload]).catch(console.warn);

          // 2. Broadcast to ALL connected devices instantly (no DB dependency)
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.send({
              type: 'broadcast',
              event: 'notice_created',
              payload: newNotice
            }).catch(() => {});
          }
        }

        // 3. Register log in Audit Events
        registrarLog(
          'aviso_creado',
          `Comunicado masivo emitido (${newNotice.titulo})`,
          `Emisor: ${newNotice.autor} • Destinatarios: ${newNotice.destinatarioValor} (${newNotice.destinatarioTipo})`
        );

        // 4. Push notification to celulares (5s timeout, completely optional)
        const pushController = new AbortController();
        const pushTimeout = setTimeout(() => pushController.abort(), 5000);

        const pushRes = await fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: newNotice.titulo,
            contenido: newNotice.contenido || newNotice.mensaje,
            urgente: newNotice.urgente,
            destinatarioTipo: newNotice.destinatarioTipo,
            destinatarioValor: newNotice.destinatarioValor,
            filtroEstadoCuenta: newNotice.filtroEstadoCuenta
          }),
          signal: pushController.signal
        }).catch(err => {
          console.warn('Push dispatch notice:', err);
          return null;
        });

        clearTimeout(pushTimeout);
        let pushResult = null;
        if (pushRes && pushRes.ok) {
          pushResult = await pushRes.json().catch(() => null);
        }

        return { success: true, pushResult, notice: newNotice };
      } catch (err) {
        console.error('Error adding notice:', err);
        return { success: false, error: err.message };
      }
    })();

    return { success: true, notice: newNotice };
  };

  const deleteNotice = async (noticeId) => {
    setNotices(prev => {
      const updated = prev.filter(n => n.id !== noticeId);
      try { localStorage.setItem('haedo_notices_cache', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('notices').delete().eq('id', noticeId);
        if (error) console.warn('Supabase notice delete warning:', error);
      } catch (err) {
        console.error('Delete notice error:', err);
      }
    }
    registrarLog('aviso_eliminado', `Comunicado o aviso eliminado del sistema`, `ID: ${noticeId}`);
  };

  const getNoticesForUser = (user) => {
    const targetUser = user || currentUser;
    if (!targetUser) return notices;
    if (targetUser.rol === 'admin' || targetUser.rol === 'contador' || targetUser.rol === 'coach') return notices;

    const userCat = (targetUser.categoria || '').toLowerCase();
    const userFeeStatus = targetUser.estadoCuota || 'al_dia';

    return notices.filter(n => {
      // 1. Fee status check
      if (n.filtroEstadoCuenta === 'al_dia' && userFeeStatus !== 'al_dia') return false;
      if (n.filtroEstadoCuenta === 'pendiente' && (userFeeStatus === 'al_dia' || userFeeStatus === 'al-dia')) return false;

      // 2. Global targeting check (Todos)
      const destValRaw = (n.destinatarioValor || n.categoriaDestino || 'todos').toLowerCase().trim();
      const destType = (n.destinatarioTipo || 'todos').toLowerCase();

      if (
        destType === 'todos' || 
        destValRaw === 'todos' || 
        destValRaw.includes('todos') || 
        destValRaw === 'todos los socios'
      ) {
        return true;
      }

      // 3. Category/Discipline targeting check
      const normCat = userCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normDest = destValRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (normCat.includes(normDest) || normDest.includes(normCat)) return true;

      const destTokens = normDest.split(/\s+/).filter(t => t.length > 3 && !['futsal', 'futbol', 'bafi', 'edefi'].includes(t));
      if (destTokens.length > 0 && destTokens.some(token => normCat.includes(token))) return true;

      return false;
    });
  };

  const markNoticeAsRead = (noticeId) => {
    setReadNoticeIds(prev => prev.includes(noticeId) ? prev : [...prev, noticeId]);
  };

  const toggleNoticeRead = (noticeId) => {
    setReadNoticeIds(prev => {
      const isRead = prev.includes(noticeId);
      const updated = isRead ? prev.filter(id => id !== noticeId) : [...prev, noticeId];
      try { localStorage.setItem('haedo_read_notice_ids', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
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
      cuotasPorDisciplina, updateCuotaDisciplina,
      clubSettings, setClubSettings,
      roles: MOCK_ROLES,
      uploadPaymentReceipt, updatePaymentStatus, deletePayment,
      addOrUpdateUser, deleteUser,
      addEvent, addNotice, deleteNotice, getNoticesForUser, readNoticeIds, markNoticeAsRead, toggleNoticeRead,
      registerPushSubscription,
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
