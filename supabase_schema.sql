-- ======================================================
-- ESQUEMA DE BASE DE DATOS PARA HAEDO FUTSAL (SUPABASE)
-- ======================================================

-- 1. Tabla de Usuarios y Perfiles (Con Roles RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  rol TEXT CHECK (rol IN ('admin', 'contador', 'coach', 'socio')) DEFAULT 'socio',
  categoria TEXT CHECK (categoria IN ('Sub-13', 'Sub-15', 'Sub-17', 'Reserva', 'Primera', 'Femenino', 'Senior', 'Todos')) DEFAULT 'Primera',
  numero_socio INT UNIQUE,
  estado_cuota TEXT CHECK (estado_cuota IN ('al_dia', 'pendiente', 'moroso')) DEFAULT 'al_dia',
  monto_cuota DECIMAL(10,2) DEFAULT 15000.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Comprobantes de Mercado Pago y Pagos
CREATE TABLE IF NOT EXISTS public.pagos_comprobantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  socio_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  socio_nombre TEXT NOT NULL,
  numero_operacion TEXT UNIQUE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  billetera_origen TEXT DEFAULT 'Mercado Pago',
  emisor_nombre TEXT,
  fecha_transferencia TIMESTAMPTZ DEFAULT NOW(),
  comprobante_url TEXT,
  estado TEXT CHECK (estado IN ('aprobado', 'en_revision', 'rechazado')) DEFAULT 'en_revision',
  observaciones TEXT,
  creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Calendario (Entrenamientos y Partidos)
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('entrenamiento', 'partido', 'evento')) NOT NULL,
  categoria TEXT NOT NULL,
  rival TEXT,
  lugar TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL,
  resultado TEXT,
  detalles TEXT,
  creado_por UUID REFERENCES public.profiles(id),
  creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Comunicados del Club
CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria_destino TEXT DEFAULT 'Todos',
  urgente BOOLEAN DEFAULT FALSE,
  autor TEXT NOT NULL,
  creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS (Lectura/Escritura)
CREATE POLICY "Permitir lectura general a usuarios autenticados" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de eventos" ON public.eventos_calendario FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de comunicados" ON public.comunicados FOR SELECT USING (true);
CREATE POLICY "Permitir lectura general de comprobantes" ON public.pagos_comprobantes FOR SELECT USING (true);

CREATE POLICY "Socios pueden subir sus comprobantes" ON public.pagos_comprobantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Administradores y Contadores pueden actualizar comprobantes" ON public.pagos_comprobantes FOR UPDATE USING (true);
