-- ======================================================
-- TABLA DE SUSCRIPCIONES PUSH PARA HAEDO FUTSAL
-- ======================================================

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

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Permitir lectura y escritura general
CREATE POLICY "Permitir gestion de push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
