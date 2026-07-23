export const MOCK_ROLES = [
  { id: 'admin', name: 'Administrador (Control Total)', description: 'Acceso a configuración, métricas globales, gestión de roles y finanzas.' },
  { id: 'contador', name: 'Contador (Sector Finanzas)', description: 'Auditoría de Mercado Pago, balance financiero, comprobantes y morosidad.' },
  { id: 'coach', name: 'Coach (Cuerpo Técnico)', description: 'ABM de socios por categoría, convocatorias, partidos, entrenamientos y avisos.' },
  { id: 'socio', name: 'Socio / Deportista', description: 'Consulta de cuenta corriente, subida de comprobantes MP y agenda de partidos.' }
];

export const MOCK_CATEGORIES = {
  'BAFI Femenino': ['1ra', 'Reserva'],
  'EDEFI Mayores': ['+30', '+35', '+42'],
  'EDEFI Baby': ['2013', '2014', '2015', '2016', '2017', '2018'],
  'FUTSALA Promo': ['2016', '2017', '2018'],
  'FUTSALA Masculino': ['1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7va', '8va'],
  'BAFI Masculino': ['1ra', 'Reserva', '3ra', '4ta', '5ta']
};

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
  }
];

export const MOCK_PAYMENTS = [];

export const MOCK_EVENTS = [
  {
    id: 'evt-101',
    titulo: 'Partido Liga AFAR: Haedo Futsal vs Ramos Mejía',
    tipo: 'partido',
    categoria: 'FUTSALA Masculino - 1ra',
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
    categoria: 'FUTSALA Masculino - 1ra',
    rival: null,
    lugar: 'Cancha 1 - Haedo Futsal',
    fecha: '2026-07-23 19:30',
    resultado: null,
    detalles: 'Traer zapatillas para parquet y botella de agua.'
  },
  {
    id: 'evt-103',
    titulo: 'Partido Baby: Haedo Futsal vs Morón Futsal',
    tipo: 'partido',
    categoria: 'EDEFI Baby - 2015',
    rival: 'Deportivo Morón',
    lugar: 'Polideportivo Morón',
    fecha: '2026-07-26 15:30',
    resultado: 'Próximo',
    detalles: 'Salida en colectivo desde el club a las 14:00 hs.'
  },
  {
    id: 'evt-104',
    titulo: 'Entrenamiento Promo',
    tipo: 'entrenamiento',
    categoria: 'FUTSALA Promo - 2017',
    rival: null,
    lugar: 'Cancha 2 - Haedo Futsal',
    fecha: '2026-07-24 18:00',
    resultado: null,
    detalles: 'Trabajo de definición e intensidad.'
  }
];

export const MOCK_NOTICES = [];