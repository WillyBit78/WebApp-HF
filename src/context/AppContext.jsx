import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchMercadoPagoTransfers } from '../services/mercadopago';
import { ocrService } from '../services/ocrService';
import { MOCK_ROLES, MOCK_USERS } from '../mockData/initialData';
import { uploadFileToStorage, compressBase64Image } from '../lib/storageUtils';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('haedo_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) {
          localStorage.setItem('haedo_last_user_id', parsed.id);
          const deviceUsers = JSON.parse(localStorage.getItem('haedo_device_users') || '[]');
          if (!deviceUsers.some(u => u.id === parsed.id)) {
            deviceUsers.push({ id: parsed.id, nombre: parsed.nombre, apellido: parsed.apellido });
            localStorage.setItem('haedo_device_users', JSON.stringify(deviceUsers));
          }
          return parsed;
        }
      }
      return null;
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
            supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50),
            supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50),
            supabase.from('movimientos').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50)
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
          if (nRes.data) {
            const loadedNotices = nRes.data.map(normalizeKeys);
            setNotices(loadedNotices);
            try { localStorage.setItem('haedo_notices_cache', JSON.stringify(loadedNotices)); } catch (e) {}
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
          supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('movimientos').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50)
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
        if (nRes.data) {
          setNotices(nRes.data.map(normalizeKeys));
        }
      } catch (e) {}
    };

    // Safety fallback timer for DB loading state (max 3.5s)
    const dbLoadingSafetyTimer = setTimeout(() => {
      setLoadingDb(false);
    }, 3500);

    loadData().finally(() => {
      clearTimeout(dbLoadingSafetyTimer);
    });

    // Smart throttled refresh on window focus (at most once every 2 minutes) instead of aggressive 5s polling
    let lastSyncTimestamp = Date.now();
    const handleWindowFocus = () => {
      if (Date.now() - lastSyncTimestamp > 120000) {
        lastSyncTimestamp = Date.now();
        refreshDataSilent();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleWindowFocus();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
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
        const { error: dbErr } = await supabase.from('push_subscriptions').upsert(subData);
        if (dbErr) {
          console.warn("Supabase push_subscriptions upsert error:", dbErr);
          return { success: false, reason: 'db_error', details: dbErr.message };
        }
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
      try { 
        localStorage.setItem('haedo_current_user', JSON.stringify(targetUser)); 
        localStorage.setItem('haedo_last_user_id', targetUser.id);
        const deviceUsers = JSON.parse(localStorage.getItem('haedo_device_users') || '[]');
        if (!deviceUsers.some(u => u.id === targetUser.id)) {
          deviceUsers.push({ id: targetUser.id, nombre: targetUser.nombre, apellido: targetUser.apellido });
          localStorage.setItem('haedo_device_users', JSON.stringify(deviceUsers));
        }
      } catch (e) {}
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

  // Conciliador automático global entre Payments (Comprobantes) y Transferencias Mercado Pago
  useEffect(() => {
    if (!Array.isArray(payments) || payments.length === 0 || !Array.isArray(mercadoPagoTransfers) || mercadoPagoTransfers.length === 0) return;

    const cleanStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const approvedPayments = payments.filter(p => p.estado === 'aprobado');

    if (approvedPayments.length === 0) return;

    setMercadoPagoTransfers(prevTransfers => {
      let changed = false;
      const nextList = prevTransfers.map(tx => {
        if (tx.estado === 'conciliado' || tx.estado_conciliacion === 'conciliado') return tx;
        if (typeof ocrService.isWithin60Days === 'function' && !ocrService.isWithin60Days(tx.fecha)) return tx;

        const txOp = cleanStr(tx.numeroOperacion);
        const txCoelsa = cleanStr(tx.coelsaId);
        const txMonto = Number(tx.monto);
        const txFechaStr = String(tx.fecha || '');

        const match = approvedPayments.find(p => {
          const pOp = cleanStr(p.numeroOperacion);
          const pCoelsa = cleanStr(p.coelsaId);
          const pMonto = Number(p.monto);

          // 1. Coincidencia por COELSA ID (con tolerancia OCR Z/7) o ID de Operación
          if (p.coelsaId && typeof ocrService.isCoelsaMatch === 'function' && ocrService.isCoelsaMatch(p.coelsaId, tx.coelsaId || tx.numeroOperacion)) return true;
          if (pOp && txOp && (pOp === txOp || pOp.includes(txOp) || txOp.includes(pOp))) return true;
          if (pCoelsa && txCoelsa && (pCoelsa === txCoelsa || pCoelsa.includes(txCoelsa) || txCoelsa.includes(pCoelsa))) return true;
          if (pCoelsa && txOp && (pCoelsa === txOp || pCoelsa.includes(txOp) || txOp.includes(pCoelsa))) return true;
          if (pOp && txCoelsa && (pOp === txCoelsa || pOp.includes(txCoelsa) || txCoelsa.includes(pOp))) return true;

          // 2. Coincidencia por Monto EXACTO + Fecha/Hora (24h / 12h AM-PM)
          if (pMonto > 0 && txMonto > 0 && pMonto === txMonto) {
            const pFullDate = String(p.fechaTransferencia || p.observaciones || '');
            if (typeof ocrService.isSameTransactionDate === 'function' && ocrService.isSameTransactionDate(pFullDate, txFechaStr)) {
              return true;
            }
          }

          return false;
        });

        if (match) {
          changed = true;
          // Sincronizar el monto del pago registrado con el monto real acreditado en la cuenta de Mercado Pago
          if (Number(tx.monto) > 0 && Number(match.monto) !== Number(tx.monto)) {
            setPayments(prevPayments => prevPayments.map(p => p.id === match.id ? { ...p, monto: Number(tx.monto) } : p));
            if (isSupabaseConfigured && supabase) {
              supabase.from('payments').update({ monto: Number(tx.monto) }).eq('id', match.id).then(() => {}).catch(() => {});
            }
          }
          return {
            ...tx,
            estado: 'conciliado',
            estado_conciliacion: 'conciliado',
            asociadoAPagoId: match.id,
            socioId: match.socioId,
            socioNombre: match.socioNombre
          };
        }
        return tx;
      });

      return changed ? nextList : prevTransfers;
    });
  }, [payments, mercadoPagoTransfers]);

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
      montoCuota: Number(userData.montoCuota) || (cuotasPorCategoria[userData.categoria] || 15000),
      numeroSocio: userData.numeroSocio || (users.length + 201)
    };

    let finalPhoto = newUser.fotoRostro || newUser.fotoUrl || newUser.foto || '';
    if (finalPhoto && finalPhoto.startsWith('data:')) {
      try {
        finalPhoto = await uploadFileToStorage(
          finalPhoto,
          'avatars',
          `avatar_${newUser.id || Date.now()}.jpg`
        );
      } catch (e) {}
    }
    const userToSave = { ...newUser, fotoRostro: finalPhoto };

    if (isEdit) {
      setUsers(prev => prev.map(u => u.id === userToSave.id ? userToSave : u));
      if (currentUser && currentUser.id === userToSave.id) setCurrentUser(userToSave);

      if (isSupabaseConfigured && supabase) {
        try {
          const dbUserPayload = {
            id: userToSave.id,
            numeroSocio: userToSave.numeroSocio,
            nombre: userToSave.nombre,
            apellido: `${userToSave.apellido || ''}${userToSave.telefono ? ` | Tel: ${userToSave.telefono}` : ''}`,
            usuario: userToSave.usuario || userToSave.dni || userToSave.id,
            clave: userToSave.clave,
            rol: userToSave.rol || 'socio',
            categoria: userToSave.categoria || 'BAFI Femenino (1ra)',
            estadoCuota: userToSave.estadoCuota || 'pendiente',
            montoCuota: Number(userToSave.montoCuota) || 0,
            foto_rostro: finalPhoto
          };
          await supabase.from('users').upsert([dbUserPayload]).catch(console.warn);
        } catch (err) {
          console.warn("Supabase update catch error:", err);
        }
      }
      registrarLog('modificacion_usuario', `Modificación de usuario (${userToSave.nombre} ${userToSave.apellido})`, `Rol: ${userToSave.rol}`);
    } else {
      setUsers(prev => [...prev, userToSave]);

      if (isSupabaseConfigured && supabase) {
        try {
          const cleanNombre = (userToSave.nombre || userToSave.nombres || 'Socio').trim();
          const cleanApellido = (userToSave.apellido || '').trim();
          const cleanUsuario = (userToSave.usuario || `${cleanNombre.charAt(0)}${cleanApellido.replace(/\s+/g, '')}` || `SOCIO${Date.now().toString().slice(-4)}`).toUpperCase();

          // Respaldo local inquebrantable de metadatos del socio por ID y DNI
          const fullMetadata = {
            fechaNacimiento: userToSave.fechaNacimiento || userToSave.fecha_nacimiento || '',
            hinchaDe: userToSave.hinchaDe || userToSave.hincha_de || 'Haedo Futsal',
            nombreContacto: userToSave.nombreContacto || userToSave.nombre_contacto || '',
            telefonoContacto: userToSave.telefonoContacto || userToSave.telefono_contacto || '',
            fotoRostro: finalPhoto
          };
          
          try {
            const metaKey = `socio_meta_${userToSave.dni || userToSave.usuario || userToSave.id}`;
            localStorage.setItem(metaKey, JSON.stringify(fullMetadata));
          } catch (e) {}

          const dbUserPayload = {
            id: userToSave.id,
            numeroSocio: userToSave.numeroSocio || (users.length + 201),
            nombre: cleanNombre,
            apellido: cleanApellido,
            usuario: cleanUsuario,
            clave: (userToSave.clave || '1234').toString().slice(0, 4),
            rol: userToSave.rol || 'socio',
            categoria: userToSave.categoria || 'BAFI Femenino (1ra)',
            estadoCuota: userToSave.estadoCuota || 'pendiente',
            montoCuota: Number(userToSave.montoCuota) || 0,
            dni: userToSave.dni || '',
            telefono: userToSave.telefono || '',
            fecha_nacimiento: userToSave.fechaNacimiento || userToSave.fecha_nacimiento || '',
            hincha_de: userToSave.hinchaDe || userToSave.hincha_de || 'Haedo Futsal',
            nombre_contacto: userToSave.nombreContacto || userToSave.nombre_contacto || '',
            telefono_contacto: userToSave.telefonoContacto || userToSave.telefono_contacto || '',
            foto_rostro: finalPhoto
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

  // On-demand fetch of heavy payment receipt blob / storage URL
  const fetchPaymentReceiptUrl = async (paymentId) => {
    if (!paymentId) return null;
    const existing = payments.find(p => p.id === paymentId);
    if (existing && existing.comprobanteUrl && existing.comprobanteUrl.length > 0) {
      return existing.comprobanteUrl;
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('payments')
          .select('comprobante_url, comprobanteUrl')
          .eq('id', paymentId)
          .single();
        if (data) {
          const url = data.comprobanteUrl || data.comprobante_url || '';
          if (url) {
            setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, comprobanteUrl: url } : p));
            return url;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch payment receipt URL on-demand:", e);
      }
    }
    return existing?.comprobanteUrl || null;
  };

  // On-demand fetch of heavy user face photo / storage URL
  const fetchUserPhotoUrl = async (userId) => {
    if (!userId) return null;
    const existing = users.find(u => u.id === userId);
    if (existing && existing.fotoRostro && existing.fotoRostro.length > 0) {
      return existing.fotoRostro;
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('foto_rostro, fotoRostro, foto_url')
          .eq('id', userId)
          .single();
        if (data) {
          const photo = data.fotoRostro || data.foto_rostro || data.foto_url || '';
          if (photo) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, fotoRostro: photo } : u));
            return photo;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user photo on-demand:", e);
      }
    }
    return existing?.fotoRostro || null;
  };

  // Payments
  const uploadPaymentReceipt = async (receiptData, targetSocioOverride = null) => {
    const targetUser = targetSocioOverride || currentUser;
    let finalComprobanteUrl = receiptData.comprobanteUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80';
    if (finalComprobanteUrl && finalComprobanteUrl.startsWith('data:')) {
      finalComprobanteUrl = await uploadFileToStorage(
        finalComprobanteUrl,
        'receipts',
        `receipt_${targetUser.id}_${Date.now()}.jpg`
      );
    }
    const newPayment = {
      id: `pay-${Date.now()}`,
      socioId: targetUser.id,
      socioNombre: `${targetUser.nombre} ${targetUser.apellido}`,
      numeroOperacion: receiptData.numeroOperacion || `MANUAL-SYS-${Date.now()}`,
      monto: Number(receiptData.monto) || 15000,
      billeteraOrigen: receiptData.billeteraOrigen || 'Mercado Pago',
      emisorNombre: receiptData.emisorNombre || `${targetUser.nombre}`,
      fechaTransferencia: receiptData.fechaTransferencia || new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      comprobanteUrl: finalComprobanteUrl,
      estado: receiptData.estado || 'en_revision',
      observaciones: receiptData.observaciones || 'Comprobante subido desde app.'
    };

    setPayments(prev => [newPayment, ...prev]);
    
    // Conciliación inmediata en Mercado Pago si el pago está aprobado o matcheado
    const cleanStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const targetOp = cleanStr(newPayment.numeroOperacion);
    const targetCoelsa = cleanStr(newPayment.coelsaId);

    if (newPayment.estado === 'aprobado' || targetOp.length >= 6) {
      setMercadoPagoTransfers(prev => prev.map(t => {
        const opNorm = cleanStr(t.numeroOperacion);
        const coelsaNorm = cleanStr(t.coelsaId);
        const matches = (targetOp && opNorm && (targetOp === opNorm || targetOp.includes(opNorm) || opNorm.includes(targetOp))) ||
                        (targetCoelsa && coelsaNorm && (targetCoelsa === coelsaNorm || targetCoelsa.includes(coelsaNorm) || coelsaNorm.includes(targetCoelsa)));
        if (matches) {
          return {
            ...t,
            estado: 'conciliado',
            estado_conciliacion: 'conciliado',
            asociadoAPagoId: newPayment.id,
            socioId: targetUser.id,
            socioNombre: `${targetUser.nombre} ${targetUser.apellido}`
          };
        }
        return t;
      }));

      if (isSupabaseConfigured && supabase && targetOp) {
        try {
          supabase.from('mp_transfers').update({ 
            estado_conciliacion: 'conciliado', 
            payment_id: newPayment.id, 
            socio_id: targetUser.id 
          }).or(`numero_operacion.eq.${newPayment.numeroOperacion},coelsa_id.eq.${newPayment.numeroOperacion}`);
        } catch (e) {}
      }
    }
    
    // Check if socio already has an approved payment to protect AL DIA status
    const hasApprovedAlready = payments.some(p => p.socioId === targetUser.id && p.estado === 'aprobado');
    const newSocioStatus = hasApprovedAlready 
      ? 'al_dia' 
      : (newPayment.estado === 'aprobado' ? 'al_dia' : (newPayment.estado === 'en_revision' ? 'pendiente' : (targetUser.estadoCuota || 'moroso')));
    
    const updatedUser = { ...targetUser, estadoCuota: newSocioStatus };
    setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === targetUser.id) setCurrentUser(updatedUser);

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('payments').insert([newPayment]),
          supabase.from('users').update({ estadoCuota: newSocioStatus }).eq('id', targetUser.id)
        ]);
      } catch (err) {
        console.warn("Supabase payment insert error:", err);
      }
    }

    if (newPayment.estado === 'rechazado') {
      registrarLog(
        'comprobante_rechazado_duplicado', 
        `Comprobante rechazado por duplicado (${targetUser.nombre})`,
        `N° Op: ${newPayment.numeroOperacion} - ${newPayment.observaciones}`
      );
    } else {
      registrarLog('comprobante_recibido', `Comprobante subido por ${targetUser.nombre}`, `N° Op: ${newPayment.numeroOperacion}`);
    }
    return newPayment;
  };

  const updatePaymentStatus = async (paymentId, newStatus, obs = '') => {
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetPayment) return;

    const newSocioStatus = newStatus === 'aprobado' ? 'al_dia' : (newStatus === 'rechazado' ? 'moroso' : 'pendiente');
    
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, estado: newStatus, observaciones: obs || p.observaciones } : p));
    setUsers(userList => userList.map(u => u.id === targetPayment.socioId ? { ...u, estadoCuota: newSocioStatus } : u));

    // Conciliar automáticamente transferencia de Mercado Pago al aprobar
    if (newStatus === 'aprobado') {
      const cleanStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const targetOp = cleanStr(targetPayment.numeroOperacion);
      const targetCoelsa = cleanStr(targetPayment.coelsaId);

      setMercadoPagoTransfers(prev => prev.map(t => {
        const opNorm = cleanStr(t.numeroOperacion);
        const coelsaNorm = cleanStr(t.coelsaId);
        const txMonto = Number(t.monto);
        const pMonto = Number(targetPayment.monto);
        const txFechaStr = String(t.fecha || '');
        const pFullDate = String(targetPayment.fechaTransferencia || targetPayment.observaciones || '');

        let matchesDate = false;
        if (pMonto > 0 && txMonto > 0 && pMonto === txMonto) {
          if (typeof ocrService.isSameTransactionDate === 'function' && ocrService.isSameTransactionDate(pFullDate, txFechaStr)) {
            matchesDate = true;
          }
        }

        const matches = t.asociadoAPagoId === paymentId ||
                        (targetPayment.coelsaId && typeof ocrService.isCoelsaMatch === 'function' && ocrService.isCoelsaMatch(targetPayment.coelsaId, t.coelsaId || t.numeroOperacion)) ||
                        (targetOp && opNorm && (targetOp === opNorm || targetOp.includes(opNorm) || opNorm.includes(targetOp))) ||
                        (targetCoelsa && coelsaNorm && (targetCoelsa === coelsaNorm || targetCoelsa.includes(coelsaNorm) || coelsaNorm.includes(targetCoelsa))) ||
                        matchesDate;
        if (matches) {
          if (txMonto > 0 && pMonto !== txMonto) {
            setPayments(pList => pList.map(p => p.id === paymentId ? { ...p, monto: txMonto } : p));
            if (isSupabaseConfigured && supabase) {
              supabase.from('payments').update({ monto: txMonto }).eq('id', paymentId).then(() => {}).catch(() => {});
            }
          }
          return { ...t, estado: 'conciliado', estado_conciliacion: 'conciliado', asociadoAPagoId: paymentId, socioId: targetPayment.socioId, socioNombre: targetPayment.socioNombre };
        }
        return t;
      }));

      if (isSupabaseConfigured && supabase && targetOp) {
        try {
          await supabase.from('mp_transfers').update({ 
            estado_conciliacion: 'conciliado', 
            payment_id: paymentId, 
            socio_id: targetPayment.socioId 
          }).or(`numero_operacion.eq.${targetPayment.numeroOperacion},coelsa_id.eq.${targetPayment.numeroOperacion}`);
        } catch (e) {}
      }
    }

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

    // Deshacer la conciliación en mercadoPagoTransfers
    const cleanStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const targetOp = cleanStr(targetPayment.numeroOperacion);
    const targetCoelsa = cleanStr(targetPayment.coelsaId);

    setMercadoPagoTransfers(prev => prev.map(t => {
      const isAssociated = t.asociadoAPagoId === paymentId;
      const opNorm = cleanStr(t.numeroOperacion);
      const coelsaNorm = cleanStr(t.coelsaId);
      const matches = isAssociated ||
                      (targetOp && opNorm && (targetOp === opNorm || targetOp.includes(opNorm) || opNorm.includes(targetOp))) ||
                      (targetCoelsa && coelsaNorm && (targetCoelsa === coelsaNorm || targetCoelsa.includes(coelsaNorm) || coelsaNorm.includes(targetCoelsa)));
      if (matches) {
        return {
          ...t,
          estado: 'sin_vincular',
          estado_conciliacion: 'sin_vincular',
          asociadoAPagoId: null,
          socioId: null,
          socioNombre: null
        };
      }
      return t;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('payments').delete().eq('id', paymentId),
          targetOp ? supabase.from('mp_transfers').update({ 
            estado_conciliacion: 'sin_vincular', 
            payment_id: null, 
            socio_id: null 
          }).eq('payment_id', paymentId) : Promise.resolve()
        ]);
      } catch (err) {
        console.error('Supabase Delete Error:', err);
      }
    }
    
    registrarLog('comprobante_eliminado', `Comprobante N° ${targetPayment.numeroOperacion} de ${targetPayment.socioNombre} eliminado y des-conciliado`);
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
      autor: currentUser?.nombre || 'Admin',
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

    // 2. Persistencia en Supabase DB + Broadcast + Push Notification
    let pushResult = null;
    try {
      if (isSupabaseConfigured && supabase) {
        const supabasePayload = {
          id: newNotice.id,
          tipo: newNotice.tipo || 'general',
          titulo: newNotice.titulo,
          mensaje: newNotice.contenido || newNotice.mensaje || '',
          contenido: newNotice.contenido || newNotice.mensaje || '',
          autor: newNotice.autor,
          fecha: newNotice.fecha || new Date().toISOString().split('T')[0],
          destinatario_tipo: newNotice.destinatarioTipo || 'todos',
          destinatario_valor: newNotice.destinatarioValor || 'Todos',
          filtro_estado_cuenta: newNotice.filtroEstadoCuenta || 'todos',
          categoria_destino: newNotice.destinatarioValor || 'Todos',
          urgente: newNotice.urgente || false
        };
        
        const { error: insErr } = await supabase.from('notices').insert([supabasePayload]);
        if (insErr) {
          console.error("CRITICAL: Supabase insert notice failed:", insErr);
          throw new Error(`Error en base de datos: ${insErr.message}`);
        }

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'notice_created',
            payload: newNotice
          }).catch(() => {});
        }
      }

      // Dispatch Push notifications to mobile devices
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
        })
      }).catch(err => {
        console.warn('Push dispatch error:', err);
        return null;
      });

      if (pushRes && pushRes.ok) {
        pushResult = await pushRes.json().catch(() => null);
      }
    } catch (err) {
      console.warn("Notice dispatch warning:", err);
    }

    return { success: true, pushResult, notice: newNotice };
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
      uploadPaymentReceipt, updatePaymentStatus, deletePayment, fetchPaymentReceiptUrl, fetchUserPhotoUrl,
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
