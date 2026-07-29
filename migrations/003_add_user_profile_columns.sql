-- ======================================================
-- MIGRACIÓN 003: COLUMNAS DE PERFIL DE SOCIO Y LIMPIEZA META
-- ======================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fecha_nacimiento TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hincha_de TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nombre_contacto TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono_contacto TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS foto_rostro TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dni TEXT;

-- Limpieza de la columna apellido para remover el string legacy '| META:{...}' y '| Tel:'
UPDATE public.users 
SET apellido = TRIM(SPLIT_PART(SPLIT_PART(apellido, ' | META:', 1), ' | Tel:', 1))
WHERE apellido LIKE '%| META:%' OR apellido LIKE '%| Tel:%';
