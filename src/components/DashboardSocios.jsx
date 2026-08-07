import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Search, 
  Trophy, 
  Heart, 
  Shield, 
  Baby, 
  Banknote, 
  Trash2, 
  Eye, 
  Phone, 
  Filter, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Share2
} from 'lucide-react';

export const DISCIPLINAS_CONFIG = [
  {
    id: 'baby',
    nombre: 'Futbol Baby',
    icon: Baby,
    color: 'from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/30 text-amber-400',
    categorias: {
      'EDEFI Baby': ['2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020']
    }
  },
  {
    id: 'futsal_masculino',
    nombre: 'Futsal Masculino',
    icon: Trophy,
    color: 'from-blue-500/20 via-slate-900 to-slate-900 border-blue-500/30 text-blue-400',
    categorias: {
      'FUTSALA Promo': ['2016', '2017', '2018'],
      'FUTSALA Masculino': ['1ra', '3ra', '4ta', '5ta', '6ta', '7ma', '8va'],
      'BAFI Masculino': ['1ra', 'Reserva', '3ra', '4ta', '5ta']
    }
  },
  {
    id: 'futsal_femenino',
    nombre: 'Futsal Femenino',
    icon: Heart,
    color: 'from-purple-500/20 via-slate-900 to-slate-900 border-purple-500/30 text-purple-400',
    categorias: {
      'BAFI Femenino': ['1ra', 'Reserva']
    }
  },
  {
    id: 'futsal_mayores',
    nombre: 'Futsal Mayores',
    icon: Shield,
    color: 'from-emerald-500/20 via-slate-900 to-slate-900 border-emerald-500/30 text-emerald-400',
    categorias: {
      'EDEFI Mayores': ['+30', '+35', '+42']
    }
  }
];

export function matchSocioToHierarchy(socio) {
  const userCat = socio.categoria || '';

  let madre = userCat;
  let sub = '';

  const parenMatch = userCat.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    madre = parenMatch[1].trim();
    sub = parenMatch[2].trim();
  }

  for (const disc of DISCIPLINAS_CONFIG) {
    for (const [catName, subList] of Object.entries(disc.categorias)) {
      if (
        madre.toLowerCase() === catName.toLowerCase() ||
        userCat.toLowerCase().includes(catName.toLowerCase())
      ) {
        let matchedSub = subList.find(s => s.toLowerCase() === sub.toLowerCase());
        if (!matchedSub) {
          matchedSub = subList.find(s => userCat.toLowerCase().includes(s.toLowerCase())) || subList[0] || 'General';
        }
        return { discId: disc.id, catName, subName: matchedSub };
      }
    }
  }

  return { discId: 'otras', catName: 'Otras Categorías', subName: 'General' };
}

export const DashboardSocios = ({ onOpenModalUser = () => {}, onOpenModalStaff = () => {} }) => {
  const { users, openFichaSocio, deleteUser, registrarPagoEfectivoCoach, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscFilter, setSelectedDiscFilter] = useState('todas');

  // Expanded states for drill-down accordion
  const [expandedDisc, setExpandedDisc] = useState({});
  const [expandedCat, setExpandedCat] = useState({});
  const [expandedSub, setExpandedSub] = useState({});

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState(null);

  // Cash payment modal state
  const [cashModalSocio, setCashModalSocio] = useState(null);
  const [cashMonto, setCashMonto] = useState(15000);
  const [cashConcepto, setCashConcepto] = useState('Pago de cuota social en efectivo');
  const [cashPeriodo, setCashPeriodo] = useState('2026-08');

  // Only socio roles (case-insensitive)
  const socios = useMemo(() => {
    return users.filter(u => {
      const r = (u.rol || 'socio').toString().toLowerCase().trim();
      return r === 'socio' || !r;
    });
  }, [users]);

  // Direct search results for immediate rendering right under search input
  const directSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return socios.filter(s => {
      const full = `${s.nombre || ''} ${s.apellido || ''} ${s.dni || ''} ${s.numeroSocio || ''} ${s.usuario || ''} ${s.categoria || ''}`.toLowerCase();
      return full.includes(q);
    });
  }, [socios, searchTerm]);

  // Group socios into hierarchy
  const hierarchyData = useMemo(() => {
    const map = {};

    DISCIPLINAS_CONFIG.forEach(d => {
      map[d.id] = {
        config: d,
        cats: {}
      };
      Object.keys(d.categorias).forEach(cName => {
        map[d.id].cats[cName] = {};
        d.categorias[cName].forEach(sName => {
          map[d.id].cats[cName][sName] = [];
        });
      });
    });

    // Fallback for non-standard categories
    map['otras'] = {
      config: {
        id: 'otras',
        nombre: 'Otras Categorías / Socios Activos',
        icon: Users,
        color: 'from-slate-800 via-slate-900 to-slate-900 border-slate-700 text-slate-300',
        categorias: { 'Otras Categorías': ['General'] }
      },
      cats: {
        'Otras Categorías': { 'General': [] }
      }
    };

    socios.forEach(s => {
      // Check search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const full = `${s.nombre || ''} ${s.apellido || ''} ${s.dni || ''} ${s.numeroSocio || ''} ${s.categoria || ''}`.toLowerCase();
        if (!full.includes(q)) return;
      }

      const { discId, catName, subName } = matchSocioToHierarchy(s);
      const targetDisc = map[discId] || map['otras'];
      
      if (!targetDisc.cats[catName]) {
        targetDisc.cats[catName] = {};
      }
      if (!targetDisc.cats[catName][subName]) {
        targetDisc.cats[catName][subName] = [];
      }

      targetDisc.cats[catName][subName].push(s);
    });

    return map;
  }, [socios, searchTerm]);

  // 2-Color Stats calculator (Verde = Al día, Rojo = Pendiente)
  const getStats = (socioList) => {
    const total = socioList.length;
    const alDia = socioList.filter(s => s.estadoCuota === 'al_dia').length;
    const pendiente = total - alDia;
    
    const pctAlDia = total > 0 ? Math.round((alDia / total) * 100) : 0;
    const pctPendiente = total > 0 ? (100 - pctAlDia) : 0;

    return { total, alDia, pendiente, pctAlDia, pctPendiente };
  };

  // Global total stats
  const globalStats = useMemo(() => getStats(socios), [socios]);

  // Staff members list (Coach, Contador, Staff, Admin - excluding Willy)
  const staffMembers = useMemo(() => {
    return users.filter(u => (u.rol === 'admin' || u.rol === 'contador' || u.rol === 'coach' || u.rol === 'staff') && u.usuario !== 'WILLY' && u.nombre !== 'Willy');
  }, [users]);

  // Obtener coaches asignados a una disciplina o categoría
  const getCoachesForCategory = (targetName) => {
    if (!targetName) return [];
    const normTarget = targetName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return users.filter(u => {
      if (u.rol !== 'coach') return false;
      const userCat = (u.categoria || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (userCat === 'todas las categorias' || userCat === 'todas') return true;
      return userCat.includes(normTarget) || normTarget.includes(userCat);
    });
  };

  const [showStaffSection, setShowStaffSection] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '#registro';
    const shareText = `Haedo Futsal App\nInscribite en la App Oficial del Club!\n${url}`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Accordion Toggles
  const toggleDisc = (id) => {
    setExpandedDisc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCat = (key) => {
    setExpandedCat(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSub = (key) => {
    setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Cash payment handler
  const handleConfirmCashPayment = (e) => {
    e.preventDefault();
    if (!cashModalSocio) return;
    registrarPagoEfectivoCoach(cashModalSocio.id, cashMonto, cashConcepto, cashPeriodo);
    setCashModalSocio(null);
  };

  const isSearchActive = Boolean(searchTerm);
  const canManage = currentUser?.rol === 'admin' || currentUser?.rol === 'coach' || currentUser?.rol === 'contador';
  const isStaffAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'contador';

  // Render Circular Donut Gauge & Status Breakdown
  const renderStatusIndicators = (stats) => {
    const pct = stats.pctAlDia || 0;
    const radius = 14;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (circ * pct) / 100;

    return (
      <div className="flex items-center gap-3 shrink-0">
        {/* Mini Circular Donut Chart */}
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_4px_8px_rgba(16,185,129,0.25)]" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={radius} className="text-slate-950" strokeWidth="4" stroke="currentColor" fill="transparent" />
            <circle cx="18" cy="18" r={radius} className="text-slate-800/90" strokeWidth="3" stroke="currentColor" fill="transparent" />
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke={stats.pctAlDia === 100 ? '#10b981' : stats.pctAlDia === 0 ? '#f43f5e' : '#3b82f6'}
              strokeWidth="3.5"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center select-none text-[8.5px] font-black text-white leading-none">
            {pct}%
          </div>
        </div>

        {/* Text Counts */}
        <div className="hidden sm:flex flex-col justify-center text-[10px] font-bold space-y-0.5 leading-tight">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {stats.alDia} Al día
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {stats.pendiente} Pendiente
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Top Banner & Stats Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Gestión de Socios
            </h2>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {onOpenModalUser && (
              <button
                onClick={onOpenModalUser}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" /> + Socio
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-700 transition-all cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {copiedLink ? 'Link Copiado' : 'Link'}
            </button>

            {isStaffAdmin && onOpenModalStaff && (
              <button
                onClick={onOpenModalStaff}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-700 transition-all cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" /> + Staff
              </button>
            )}
          </div>
        </div>

        {/* Modern 3D Donut Chart & Breakdown Panel */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-amber-500/30 p-6 rounded-3xl shadow-2xl transition-all flex flex-col items-center justify-center gap-5">
            
            {/* Agrandado Gráfico Donut 3D Centrado */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0 my-1">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_10px_20px_rgba(16,185,129,0.35)]" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="donutGradSociosMain" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <filter id="shadowSociosMain" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* Inner tracks */}
                <circle cx="50" cy="50" r="38" className="text-slate-950" strokeWidth="10" stroke="currentColor" fill="transparent" />
                <circle cx="50" cy="50" r="38" className="text-slate-800/80" strokeWidth="8" stroke="currentColor" fill="transparent" />

                {/* Animated 3D Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="url(#donutGradSociosMain)"
                  strokeWidth="9.5"
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 - (238.76 * (globalStats.pctAlDia || 0)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  filter="url(#shadowSociosMain)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center percentage badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className="text-2xl font-black text-white leading-none tracking-tight">{globalStats.pctAlDia}%</span>
                <span className="text-[10px] font-black text-emerald-400 uppercase mt-1 tracking-wider">AL DÍA</span>
              </div>
            </div>

            {/* Details panel at bottom */}
            <div className="w-full max-w-sm bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2.5 text-xs font-bold shadow-inner">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  Al Día:
                </span>
                <strong className="text-emerald-400 font-extrabold text-sm">{globalStats.alDia}</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                  Pendientes:
                </span>
                <strong className="text-rose-400 font-extrabold text-sm">{globalStats.pendiente}</strong>
              </div>

              <div className="text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-800/80 flex justify-between items-center">
                <span>Padrón Total:</span>
                <span className="text-white font-extrabold">{globalStats.total} socios</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-8 py-2 rounded-xl text-xs font-medium focus:border-amber-400 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Direct Search Results Panel (Directamente debajo de la casilla de búsqueda) */}
      {searchTerm.trim() !== '' && (
        <div className="bg-slate-900 border border-amber-500/40 p-4 sm:p-5 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="font-extrabold text-white text-sm sm:text-base">
                Resultados de Búsqueda
              </h3>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-black">
                {directSearchResults.length} {directSearchResults.length === 1 ? 'socio encontrado' : 'socios encontrados'}
              </span>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Limpiar búsqueda ✕
            </button>
          </div>

          {directSearchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Foto</th>
                    <th className="p-2.5">Nombre y Apellido</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5">Usuario / DNI</th>
                    <th className="p-2.5">Teléfono</th>
                    <th className="p-2.5">Estado Cuenta</th>
                    <th className="p-2.5 text-right rounded-r-lg">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {directSearchResults.map(socio => {
                    const rawAp = socio.apellido || '';
                    const cleanNoMeta = rawAp.split(' | META:')[0] || rawAp;
                    const apParts = cleanNoMeta.split(' | Tel: ');
                    const cleanApellido = (apParts[0] || cleanNoMeta).trim();
                    const embeddedTel = apParts[1] || '';
                    const displayTel = socio.telefono || embeddedTel || '';

                    const formattedApellido = cleanApellido.toUpperCase();
                    const rawNombre = (socio.nombre || socio.nombres || '').trim();
                    const formattedNombre = rawNombre
                      .split(' ')
                      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
                      .join(' ');

                    return (
                      <tr key={socio.id} className="hover:bg-slate-800/50 transition-colors">
                        {/* Foto */}
                        <td className="p-2.5">
                          <div 
                            onClick={() => openFichaSocio(socio)}
                            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0 overflow-hidden cursor-pointer hover:border-amber-400 transition-colors"
                            title="Ver Ficha Personal"
                          >
                            {socio.fotoRostro || socio.fotoUrl || socio.foto ? (
                              <img src={socio.fotoRostro || socio.fotoUrl || socio.foto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (formattedNombre || 'S').charAt(0).toUpperCase()
                            )}
                          </div>
                        </td>

                        {/* Nombre y Apellido (SIN COMA entre Apellido y Nombre) */}
                        <td className="p-2.5">
                          <button
                            onClick={() => openFichaSocio(socio)}
                            className="text-left font-bold text-white hover:text-amber-400 hover:underline transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                            title="Haz clic para ver Ficha Personal completa"
                          >
                            <span className="font-extrabold tracking-wide text-white">{formattedApellido}</span>{' '}
                            <span className="font-semibold text-slate-200">{formattedNombre}</span>
                          </button>
                        </td>

                        {/* Categoría (Requerido: visibilidad fuera de disciplina/categoria) */}
                        <td className="p-2.5">
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-block whitespace-nowrap shadow-sm">
                            {socio.categoria || 'General'}
                          </span>
                        </td>

                        {/* Usuario y DNI */}
                        <td className="p-2.5 font-mono text-slate-300 text-xs">
                          <div className="font-semibold text-slate-200">@{socio.usuario || 'N/A'}</div>
                          {socio.dni && <div className="text-[10px] text-slate-400">DNI: {socio.dni}</div>}
                        </td>

                        {/* Teléfono */}
                        <td className="p-2.5 text-slate-300 text-xs">
                          {displayTel ? (
                            <a
                              href={`https://wa.me/${displayTel.replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!54)/, '549')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                              title="Abrir chat de WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {displayTel}
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">Sin registrar</span>
                          )}
                        </td>

                        {/* Estado Cuenta */}
                        <td className="p-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            socio.estadoCuota === 'al_dia'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : socio.estadoCuota === 'pendiente'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {socio.estadoCuota === 'al_dia' ? 'Al Día' : socio.estadoCuota === 'pendiente' ? 'En Revisión' : 'Sin Pagar'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage && (
                              <button
                                onClick={() => {
                                  setCashModalSocio(socio);
                                  setCashMonto(socio.montoCuota || 15000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                title="Cobrar cuota en efectivo"
                              >
                                <Banknote className="w-3.5 h-3.5" /> Efectivo
                              </button>
                            )}

                            {canManage && (
                              <button
                                onClick={() => setUserToDelete(socio)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                title="Dar de baja socio (pide confirmación)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              No se encontraron socios que coincidan con "<span className="text-amber-400 font-semibold">{searchTerm}</span>".
            </div>
          )}
        </div>
      )}

      {/* Main Hierarchy List (Disciplinas -> Categorías -> Sub-categorías -> Socios) */}
      <div className="space-y-4">
        {Object.keys(hierarchyData).map(discId => {
          if (selectedDiscFilter !== 'todas' && selectedDiscFilter !== discId) return null;

          const discObj = hierarchyData[discId];
          const config = discObj.config;
          const DiscIcon = config.icon || Users;

          // Flatten all socios in this disciplina for stats
          const discSocios = [];
          Object.keys(discObj.cats).forEach(catName => {
            Object.keys(discObj.cats[catName]).forEach(subName => {
              discSocios.push(...discObj.cats[catName][subName]);
            });
          });

          // Skip empty disciplina if search filter is active
          if (isSearchActive && discSocios.length === 0) return null;
          if (discId === 'otras' && discSocios.length === 0) return null;

          const discStats = getStats(discSocios);
          const isDiscOpen = isSearchActive || Boolean(expandedDisc[discId]);

          return (
            <div 
              key={discId} 
              className={`bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl transition-all`}
            >
              {/* LEVEL 1: DISCIPLINA HEADER */}
              {(() => {
                const discCoaches = getCoachesForCategory(config.nombre);
                return (
                  <div
                    onClick={() => toggleDisc(discId)}
                    className={`p-4 sm:p-5 bg-gradient-to-r ${config.color} cursor-pointer flex flex-row items-center justify-between gap-3 select-none hover:opacity-95 transition-opacity`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-md shrink-0">
                        <DiscIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight truncate">
                          {config.nombre}
                        </h3>
                        {discCoaches.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-black text-amber-300">
                              {discCoaches.length === 1 ? 'Coach:' : 'Coaches:'}
                            </span>
                            {discCoaches.map(c => (
                              <span key={c.id} className="bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-sm">
                                {c.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                          {discStats.total} {discStats.total === 1 ? 'socio en padrón' : 'socios registrados'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {renderStatusIndicators(discStats)}

                      <div className="p-1.5 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300">
                        {isDiscOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* LEVEL 2: CATEGORÍAS */}
              {isDiscOpen && (
                <div className="p-3 sm:p-5 space-y-3 bg-slate-950/60 border-t border-slate-800/80">
                  {Object.keys(discObj.cats).map(catName => {
                    const subMap = discObj.cats[catName];
                    const catSocios = [];
                    Object.keys(subMap).forEach(s => catSocios.push(...subMap[s]));

                    if (isSearchActive && catSocios.length === 0) return null;

                    const catStats = getStats(catSocios);
                    const catKey = `${discId}-${catName}`;
                    const isCatOpen = isSearchActive || Boolean(expandedCat[catKey]);
                    const catCoaches = getCoachesForCategory(catName);

                    return (
                      <div 
                        key={catName} 
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                      >
                        {/* CATEGORÍA ROW */}
                        <div
                          onClick={() => toggleCat(catKey)}
                          className="p-3.5 bg-slate-900 hover:bg-slate-800/60 cursor-pointer flex flex-row items-center justify-between gap-3 transition-colors border-b border-slate-800/60 select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm sm:text-base truncate">{catName}</h4>
                              {catCoaches.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  <span className="text-[10px] font-black text-amber-300">
                                    {catCoaches.length === 1 ? 'DT:' : 'DTs:'}
                                  </span>
                                  {catCoaches.map(c => (
                                    <span key={c.id} className="bg-purple-500/30 text-purple-200 border border-purple-400/40 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                                      {c.nombre}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <span className="text-[11px] text-slate-400 block">{catStats.total} socios en categoría</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {renderStatusIndicators(catStats)}

                            <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                              {isCatOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* LEVEL 3: SUB-CATEGORÍAS */}
                        {isCatOpen && (
                          <div className="p-2.5 sm:p-4 space-y-2.5 bg-slate-950/80">
                            {Object.keys(subMap).map(subName => {
                              const subSocios = subMap[subName];
                              if (isSearchActive && subSocios.length === 0) return null;

                              const subStats = getStats(subSocios);
                              const subKey = `${catKey}-${subName}`;
                              const isSubOpen = isSearchActive || Boolean(expandedSub[subKey]);

                              return (
                                <div 
                                  key={subName}
                                  className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden"
                                >
                                  {/* SUB-CATEGORÍA ROW */}
                                  <div
                                    onClick={() => toggleSub(subKey)}
                                    className="p-3 bg-slate-900 hover:bg-slate-800/40 cursor-pointer flex flex-row items-center justify-between gap-3 transition-colors select-none"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black shrink-0">
                                        Sub: {subName}
                                      </span>
                                      <span className="text-xs text-slate-400 font-medium truncate">({subStats.total} socios)</span>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0">
                                      {renderStatusIndicators(subStats)}
                                      <div className="text-slate-400">
                                        {isSubOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                      </div>
                                    </div>
                                  </div>

                                  {/* LEVEL 4: SOCIOS LIST TABLE */}
                                  {isSubOpen && (
                                    <div className="p-3 bg-slate-950 border-t border-slate-800/80 overflow-x-auto">
                                      {subSocios.length > 0 ? (
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                                            <tr>
                                              <th className="p-2.5 rounded-l-lg">Foto</th>
                                              <th className="p-2.5">Nombre y Apellido</th>
                                              <th className="p-2.5">Usuario</th>
                                              <th className="p-2.5">Teléfono</th>
                                              <th className="p-2.5">Estado Cuenta</th>
                                              <th className="p-2.5 text-right rounded-r-lg">Acciones</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                            {subSocios.map(socio => {
                                              const rawAp = socio.apellido || '';
                                              const cleanNoMeta = rawAp.split(' | META:')[0] || rawAp;
                                              const apParts = cleanNoMeta.split(' | Tel: ');
                                              const cleanApellido = (apParts[0] || cleanNoMeta).trim();
                                              const embeddedTel = apParts[1] || '';
                                              const displayTel = socio.telefono || embeddedTel || '';

                                              // Format: APELLIDO EN MAYUSCULAS, Nombre con 1ra letra mayuscula
                                              const formattedApellido = cleanApellido.toUpperCase();
                                              const rawNombre = (socio.nombre || socio.nombres || '').trim();
                                              const formattedNombre = rawNombre
                                                .split(' ')
                                                .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
                                                .join(' ');

                                              return (
                                                <tr key={socio.id} className="hover:bg-slate-900/60 transition-colors">
                                                  
                                                  {/* Foto Socio */}
                                                  <td className="p-2.5">
                                                    <div 
                                                      onClick={() => openFichaSocio(socio)}
                                                      className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0 overflow-hidden cursor-pointer hover:border-amber-400 transition-colors"
                                                      title="Ver Ficha Personal"
                                                    >
                                                      {socio.fotoRostro || socio.fotoUrl || socio.foto ? (
                                                        <img src={socio.fotoRostro || socio.fotoUrl || socio.foto} alt="" className="w-full h-full object-cover" />
                                                      ) : (
                                                        (formattedNombre || 'S').charAt(0).toUpperCase()
                                                      )}
                                                    </div>
                                                  </td>

                                                  {/* Nombre y Apellido - APELLIDO (MAYUSCULAS), Nombre (Capitalizado) */}
                                                  <td className="p-2.5">
                                                    <button
                                                      onClick={() => openFichaSocio(socio)}
                                                      className="text-left font-bold text-white hover:text-amber-400 hover:underline transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                                                      title="Haz clic para ver Ficha Personal completa"
                                                    >
                                                      <span className="font-extrabold tracking-wide text-white">{formattedApellido}</span>{' '}
                                                      <span className="font-semibold text-slate-200">{formattedNombre}</span>
                                                    </button>
                                                  </td>

                                                  {/* Usuario */}
                                                  <td className="p-2.5 font-mono text-slate-300 text-xs">
                                                    @{socio.usuario || 'N/A'}
                                                  </td>

                                                  {/* Teléfono / WA Link */}
                                                  <td className="p-2.5 text-slate-300 text-xs">
                                                    {displayTel ? (
                                                      <a
                                                        href={`https://wa.me/${displayTel.replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!54)/, '549')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                                                        title="Abrir chat de WhatsApp"
                                                      >
                                                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                        {displayTel}
                                                      </a>
                                                    ) : (
                                                      <span className="text-slate-500 italic">Sin registrar</span>
                                                    )}
                                                  </td>

                                                {/* Estado Cuenta */}
                                                <td className="p-2.5">
                                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    socio.estadoCuota === 'al_dia'
                                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                      : socio.estadoCuota === 'pendiente'
                                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                  }`}>
                                                    {socio.estadoCuota === 'al_dia' ? 'Al Día' : socio.estadoCuota === 'pendiente' ? 'En Revisión' : 'Sin Pagar'}
                                                  </span>
                                                </td>

                                                {/* Acciones: Boton Efectivo y Boton Eliminar */}
                                                <td className="p-2.5 text-right">
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    {canManage && (
                                                      <button
                                                        onClick={() => {
                                                          setCashModalSocio(socio);
                                                          setCashMonto(socio.montoCuota || 15000);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                                        title="Cobrar cuota en efectivo"
                                                      >
                                                        <Banknote className="w-3.5 h-3.5" /> Efectivo
                                                      </button>
                                                    )}

                                                    {canManage && (
                                                      <button
                                                        onClick={() => setUserToDelete(socio)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                        title="Dar de baja socio (pide confirmación)"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>

                                              </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <p className="text-xs text-slate-500 italic p-3 text-center">
                                          No hay socios registrados en la sub-categoría {subName} aún.
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* STAFF SECTION ACCORDION (Ubicado debajo de todas las disciplinas) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all">
        <button
          onClick={() => setShowStaffSection(!showStaffSection)}
          className="w-full p-4 bg-slate-900 hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-white text-sm sm:text-base">Staff e Integrantes del Club</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black">
              {staffMembers.length} Miembros
            </span>
            {showStaffSection ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {showStaffSection && (
          <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {staffMembers.map(member => (
                <div 
                  key={member.id} 
                  className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 hover:border-amber-500/50 transition-all shadow-md cursor-pointer group"
                  onClick={() => openFichaSocio(member)}
                  title="Haz clic para ver Ficha / Modificar Datos"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm shrink-0 overflow-hidden group-hover:border-amber-400 transition-colors">
                    {member.fotoUrl || member.foto ? (
                      <img src={member.fotoUrl || member.foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (member.nombre || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-white text-xs truncate group-hover:text-amber-400 transition-colors">
                      {member.nombre} {member.apellido}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        member.rol === 'admin' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : member.rol === 'contador' 
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                          : member.rol === 'coach'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {member.rol === 'contador' ? 'Adm.Club' : member.rol}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold truncate">@{member.usuario}</span>
                    </div>
                    {member.categoria && member.categoria !== 'Staff' && (
                      <div className="text-[10px] text-amber-300/90 font-semibold truncate mt-0.5">
                        Cat: {member.categoria}
                      </div>
                    )}
                    {member.telefono && (
                      <a 
                        href={`https://wa.me/${member.telefono.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                      >
                        <Phone className="w-3 h-3" /> {member.telefono}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Confirmar Eliminación</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer accidentalmente.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 text-[11px] font-semibold">Socio a dar de baja:</div>
              <div className="font-extrabold text-white text-base">{userToDelete.nombre} {userToDelete.apellido}</div>
              <div className="text-amber-400 font-mono text-[11px]">N° Socio: #{userToDelete.numeroSocio} • Categoría: {userToDelete.categoria}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {cashModalSocio && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Cobrar Cuota en Efectivo
              </h3>
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
                <label className="block text-slate-400 mb-1 font-semibold">Período / Mes a Imputar</label>
                <select
                  value={cashPeriodo}
                  onChange={(e) => setCashPeriodo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-extrabold cursor-pointer"
                >
                  <option value="2026-07">Julio 2026 (Cuota Anterior)</option>
                  <option value="2026-08">Agosto 2026 (Cuota Actual)</option>
                  <option value="2026-09">Septiembre 2026 (Adelantado)</option>
                  <option value="2026-10">Octubre 2026 (Adelantado)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Concepto / Notas</label>
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

    </div>
  );
};
