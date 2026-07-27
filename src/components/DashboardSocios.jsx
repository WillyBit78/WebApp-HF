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

export const DashboardSocios = ({ onOpenModalUser }) => {
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

  // Only socio roles
  const socios = useMemo(() => {
    return users.filter(u => u.rol === 'socio');
  }, [users]);

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

  // Helper stats calculator supporting Al Día, En Revisión, and Morosos
  const getStats = (socioList) => {
    const total = socioList.length;
    const alDia = socioList.filter(s => s.estadoCuota === 'al_dia').length;
    const revision = socioList.filter(s => s.estadoCuota === 'pendiente').length;
    const sinPagar = socioList.filter(s => s.estadoCuota === 'moroso' || !s.estadoCuota).length;
    
    const pctAlDia = total > 0 ? Math.round((alDia / total) * 100) : 0;
    const pctRevision = total > 0 ? Math.round((revision / total) * 100) : 0;
    const pctSinPagar = total > 0 ? Math.max(0, 100 - pctAlDia - pctRevision) : 0;

    return { total, alDia, revision, sinPagar, pctAlDia, pctRevision, pctSinPagar };
  };

  // Global total stats
  const globalStats = useMemo(() => getStats(socios), [socios]);

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
    registrarPagoEfectivoCoach(cashModalSocio.id, cashMonto, cashConcepto);
    setCashModalSocio(null);
  };

  const isSearchActive = Boolean(searchTerm);
  const canManage = currentUser?.rol === 'admin' || currentUser?.rol === 'coach' || currentUser?.rol === 'contador';
  const isStaffAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'contador';

  // Render Visual Percentage Indicator Bar & Badges
  const renderStatusIndicators = (stats) => {
    return (
      <div className="space-y-1.5 w-full sm:w-auto min-w-[220px]">
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {stats.pctAlDia}% Al día
          </span>
          {stats.revision > 0 && (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {stats.pctRevision}% Revisión
            </span>
          )}
          <span className="text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            {stats.pctSinPagar}% Sin pagar
          </span>
        </div>

        {/* Multi-Segment Segmented Bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
          <div 
            style={{ width: `${stats.pctAlDia}%` }} 
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
            title={`Al día: ${stats.alDia} (${stats.pctAlDia}%)`}
          />
          <div 
            style={{ width: `${stats.pctRevision}%` }} 
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500"
            title={`En revisión: ${stats.revision} (${stats.pctRevision}%)`}
          />
          <div 
            style={{ width: `${stats.pctSinPagar}%` }} 
            className="bg-gradient-to-r from-rose-500 to-rose-600 h-full transition-all duration-500"
            title={`Sin pagar: ${stats.sinPagar} (${stats.pctSinPagar}%)`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Top Banner & Stats Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gestión de Socios
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenModalUser && (
              <button
                onClick={onOpenModalUser}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Alta Socio
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-400" /> {copiedLink ? '¡Link Copiado!' : 'Copiar Link Inscripción'}
            </button>

            {isStaffAdmin && onOpenModalStaff && (
              <button
                onClick={onOpenModalStaff}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Alta Staff / Usuario
              </button>
            )}
          </div>
        </div>

        {/* Visual Modern Status Breakdown Panel */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Padrón</span>
                <div className="text-xl font-extrabold text-white mt-0.5">{globalStats.total} socios</div>
              </div>
              <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Socios Al Día</span>
                <div className="text-xl font-extrabold text-emerald-300 mt-0.5">
                  {globalStats.alDia} <span className="text-xs font-bold text-emerald-400/80">({globalStats.pctAlDia}%)</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">En Revisión</span>
                <div className="text-xl font-extrabold text-amber-300 mt-0.5">
                  {globalStats.revision} <span className="text-xs font-bold text-amber-400/80">({globalStats.pctRevision}%)</span>
                </div>
              </div>
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Sin Pagar / Morosos</span>
                <div className="text-xl font-extrabold text-rose-300 mt-0.5">
                  {globalStats.sinPagar} <span className="text-xs font-bold text-rose-400/80">({globalStats.pctSinPagar}%)</span>
                </div>
              </div>
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Visual Percentage Progress Bar Graphic */}
          <div className="bg-slate-950/90 border border-slate-800/90 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Estado de Cuentas General
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {globalStats.alDia} / {globalStats.total} al día
              </span>
            </div>

            <div className="w-full bg-slate-900 h-4 rounded-xl overflow-hidden flex border border-slate-800 p-0.5 shadow-inner">
              <div 
                style={{ width: `${globalStats.pctAlDia}%` }} 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-l-lg transition-all duration-500"
                title={`Al Día: ${globalStats.alDia} socios (${globalStats.pctAlDia}%)`}
              />
              <div 
                style={{ width: `${globalStats.pctRevision}%` }} 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500"
                title={`En Revisión: ${globalStats.revision} socios (${globalStats.pctRevision}%)`}
              />
              <div 
                style={{ width: `${globalStats.pctSinPagar}%` }} 
                className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-r-lg transition-all duration-500"
                title={`Sin Pagar: ${globalStats.sinPagar} socios (${globalStats.pctSinPagar}%)`}
              />
            </div>

            <div className="flex items-center justify-around pt-1 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Al Día ({globalStats.pctAlDia}%)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                En Revisión ({globalStats.pctRevision}%)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                Sin Pagar ({globalStats.pctSinPagar}%)
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-3 py-2 rounded-xl text-xs font-medium focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Responsive Wrapping Filter Buttons (NO horizontal scrollbar) */}
        <div className="flex flex-wrap items-center gap-2 w-full">
          <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <button
            onClick={() => setSelectedDiscFilter('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDiscFilter === 'todas'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            Todas las Disciplinas
          </button>
          {DISCIPLINAS_CONFIG.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDiscFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDiscFilter === d.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {d.nombre}
            </button>
          ))}
        </div>
      </div>

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
              <div
                onClick={() => toggleDisc(discId)}
                className={`p-5 bg-gradient-to-r ${config.color} cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none hover:opacity-95 transition-opacity`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-md shrink-0">
                    <DiscIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                      {config.nombre}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {discStats.total} {discStats.total === 1 ? 'socio en padrón' : 'socios registrados'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  {renderStatusIndicators(discStats)}

                  <div className="p-1.5 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300">
                    {isDiscOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* LEVEL 2: CATEGORÍAS */}
              {isDiscOpen && (
                <div className="p-4 sm:p-6 space-y-4 bg-slate-950/60 border-t border-slate-800/80">
                  {Object.keys(discObj.cats).map(catName => {
                    const subMap = discObj.cats[catName];
                    const catSocios = [];
                    Object.keys(subMap).forEach(s => catSocios.push(...subMap[s]));

                    if (isSearchActive && catSocios.length === 0) return null;

                    const catStats = getStats(catSocios);
                    const catKey = `${discId}-${catName}`;
                    const isCatOpen = isSearchActive || Boolean(expandedCat[catKey]);

                    return (
                      <div 
                        key={catName} 
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                      >
                        {/* CATEGORÍA ROW */}
                        <div
                          onClick={() => toggleCat(catKey)}
                          className="p-4 bg-slate-900 hover:bg-slate-800/60 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors border-b border-slate-800/60 select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                            <div>
                              <h4 className="font-bold text-white text-base">{catName}</h4>
                              <span className="text-[11px] text-slate-400">{catStats.total} socios en categoría</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            {renderStatusIndicators(catStats)}

                            <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                              {isCatOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* LEVEL 3: SUB-CATEGORÍAS */}
                        {isCatOpen && (
                          <div className="p-3 sm:p-4 space-y-3 bg-slate-950/80">
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
                                    className="p-3.5 bg-slate-900 hover:bg-slate-800/40 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors select-none"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                                        Sub: {subName}
                                      </span>
                                      <span className="text-xs text-slate-400 font-medium">({subStats.total} socios)</span>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
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
                                            {subSocios.map(socio => (
                                              <tr key={socio.id} className="hover:bg-slate-900/60 transition-colors">
                                                
                                                {/* Foto Socio */}
                                                <td className="p-2.5">
                                                  <div 
                                                    onClick={() => openFichaSocio(socio)}
                                                    className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0 overflow-hidden cursor-pointer hover:border-amber-400 transition-colors"
                                                    title="Ver Ficha Personal"
                                                  >
                                                    {socio.fotoUrl || socio.foto ? (
                                                      <img src={socio.fotoUrl || socio.foto} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                      (socio.nombre || socio.nombres || 'S').charAt(0).toUpperCase()
                                                    )}
                                                  </div>
                                                </td>

                                                {/* Nombre y Apellido - CLICKABLE TO OPEN FICHA */}
                                                <td className="p-2.5">
                                                  <button
                                                    onClick={() => openFichaSocio(socio)}
                                                    className="text-left font-bold text-white hover:text-amber-400 hover:underline transition-colors cursor-pointer text-xs"
                                                    title="Haz clic para ver Ficha Personal completa"
                                                  >
                                                    {socio.nombre || socio.nombres} {socio.apellido}
                                                  </button>
                                                </td>

                                                {/* Usuario */}
                                                <td className="p-2.5 font-mono text-slate-300 text-xs">
                                                  @{socio.usuario || 'N/A'}
                                                </td>

                                                {/* Teléfono */}
                                                <td className="p-2.5 text-slate-300 text-xs">
                                                  {socio.telefono || 'Sin registrar'}
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
                                            ))}
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

    </div>
  );
};
