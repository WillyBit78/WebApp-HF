export const MOCK_ROLES = [
  { id: 'admin', name: 'Administrador (Control Total)', description: 'Acceso a configuración, métricas globales, gestión de roles y finanzas.' },
  { id: 'contador', name: 'Contador (Sector Finanzas)', description: 'Auditoría de Mercado Pago, balance financiero, comprobantes y morosidad.' },
  { id: 'coach', name: 'Coach (Cuerpo Técnico)', description: 'ABM de socios por categoría, convocatorias, partidos, entrenamientos y avisos.' },
  { id: 'socio', name: 'Socio / Deportista', description: 'Consulta de cuenta corriente, subida de comprobantes MP y agenda de partidos.' }
];

export const MOCK_USERS = [
  {
    id: 'usr-1',
    nombre: 'Gonzalo',
    apellido: 'Martínez',
    email: 'admin@haedofutsal.com.ar',
    telefono: '11-4567-8901',
    rol: 'admin',
    categoria: 'Todos',
    numeroSocio: 100,
    estadoCuota: 'al_dia',
    montoCuota: 15000
  },
  {
    id: 'usr-2',
    nombre: 'Mariana',
    apellido: 'López (Contadora)',
    email: 'finanzas@haedofutsal.com.ar',
    telefono: '11-3322-1100',
    rol: 'contador',
    categoria: 'Todos',
    numeroSocio: 101,
    estadoCuota: 'al_dia',
    montoCuota: 15000
  },
  {
    id: 'usr-3',
    nombre: 'Diego',
    apellido: 'Santi (DT Primera)',
    email: 'coach@haedofutsal.com.ar',
    telefono: '11-6655-4433',
    rol: 'coach',
    categoria: 'Primera',
    numeroSocio: 102,
    estadoCuota: 'al_dia',
    montoCuota: 15000
  },
  {
    id: 'usr-4',
    nombre: 'Lucas',
    apellido: 'Rossi (Jugador)',
    email: 'lucas.rossi@email.com',
    telefono: '11-9876-5432',
    rol: 'socio',
    categoria: 'Primera',
    numeroSocio: 204,
    estadoCuota: 'al_dia',
    montoCuota: 15000
  },
  {
    id: 'usr-5',
    nombre: 'Joaquín',
    apellido: 'Gómez',
    email: 'joaco.gomez@email.com',
    telefono: '11-2244-6688',
    rol: 'socio',
    categoria: 'Sub-17',
    numeroSocio: 205,
    estadoCuota: 'pendiente',
    montoCuota: 15000
  },
  {
    id: 'usr-6',
    nombre: 'Mateo',
    apellido: 'Fernández',
    email: 'mateo.fer@email.com',
    telefono: '11-7788-9900',
    rol: 'socio',
    categoria: 'Sub-15',
    numeroSocio: 206,
    estadoCuota: 'moroso',
    montoCuota: 15000
  },
  {
    id: 'usr-7',
    nombre: 'Sofia',
    apellido: 'Alvarez',
    email: 'sofi.alvarez@email.com',
    telefono: '11-5544-3322',
    rol: 'socio',
    categoria: 'Femenino',
    numeroSocio: 207,
    estadoCuota: 'al_dia',
    montoCuota: 15000
  }
];

export const MOCK_PAYMENTS = [];

export const MOCK_EVENTS = [
  {
    id: 'evt-101',
    titulo: 'Partido Liga AFAR: Haedo Futsal vs Ramos Mejía',
    tipo: 'partido',
    categoria: 'Primera',
    rival: 'Ramos Mejía Futsal',
    lugar: 'Sede Central - Microestadio Haedo',
    fecha: '2026-07-25 21:00',
    resultado: 'Próximo',
    detalles: 'Convocatoria 20:00 hs. Camiseta Azul Titular.'
  },
  {
    id: 'evt-102',
    titulo: 'Entrenamiento Táctico y Físico',
    tipo: 'entrenamiento',
    categoria: 'Primera',
    rival: null,
    lugar: 'Cancha 1 - Haedo Futsal',
    fecha: '2026-07-23 19:30',
    resultado: null,
    detalles: 'Traer zapatillas para parquet y botella de agua.'
  },
  {
    id: 'evt-103',
    titulo: 'Partido Sub-17: Haedo Futsal vs Morón Futsal',
    tipo: 'partido',
    categoria: 'Sub-17',
    rival: 'Deportivo Morón',
    lugar: 'Polideportivo Morón',
    fecha: '2026-07-26 15:30',
    resultado: 'Próximo',
    detalles: 'Salida en colectivo desde el club a las 14:00 hs.'
  },
  {
    id: 'evt-104',
    titulo: 'Entrenamiento Sub-15 & Sub-13',
    tipo: 'entrenamiento',
    categoria: 'Sub-15',
    rival: null,
    lugar: 'Cancha 2 - Haedo Futsal',
    fecha: '2026-07-24 18:00',
    resultado: null,
    detalles: 'Trabajo de definición e intensidad.'
  }
];

export const MOCK_NOTICES = [];