-- ======================================================
-- MIGRACIÓN SQL PARA HAEDO FUTSAL - SISTEMA DE AVISOS
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ======================================================

-- 1. Actualizar tabla NOTICES con columnas nuevas para targeting
-- (El ALTER COLUMN solo agrega lo que falta sin borrar datos existentes)

ALTER TABLE IF EXISTS public.notices 
  ADD COLUMN IF NOT EXISTS fecha TEXT,
  ADD COLUMN IF NOT EXISTS destinatario_tipo TEXT DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS destinatario_valor TEXT DEFAULT 'Todos',
  ADD COLUMN IF NOT EXISTS filtro_estado_cuenta TEXT DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS fecha_programada TEXT,
  ADD COLUMN IF NOT EXISTS categoria_destino TEXT DEFAULT 'Todos';

-- Si la tabla notices no existe, créala completa
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  autor TEXT NOT NULL,
  fecha TEXT,
  urgente BOOLEAN DEFAULT FALSE,
  destinatario_tipo TEXT DEFAULT 'todos',
  destinatario_valor TEXT DEFAULT 'Todos',
  filtro_estado_cuenta TEXT DEFAULT 'todos',
  fecha_programada TEXT,
  categoria_destino TEXT DEFAULT 'Todos',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Política RLS para notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura general de notices" ON public.notices;
CREATE POLICY "Permitir lectura general de notices" ON public.notices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion de notices" ON public.notices;
CREATE POLICY "Permitir insercion de notices" ON public.notices FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir eliminacion de notices" ON public.notices;
CREATE POLICY "Permitir eliminacion de notices" ON public.notices FOR DELETE USING (true);

-- Habilitar realtime para notices (necesario para sincronización entre dispositivos)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;

-- 2. Crear tabla PUSH_SUBSCRIPTIONS para notificaciones push al celular
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  usuario TEXT,
  rol TEXT,
  categoria TEXT,
  estado_cuota TEXT,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Política RLS para push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir gestion de push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Permitir gestion de push_subscriptions" 
  ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- ✅ FIN DE LA MIGRACIÓN
-- Después de ejecutar, todos los dispositivos verán los mismos avisos.
