"# Guía de Configuración de Base de Datos - Haedo Futsal

Este documento contiene la estructura necesaria para que el sistema de finanzas y conciliación automática funcione correctamente.

## 1. Tablas Financieras (Cajas)
Para que el Dashboard del Contador muestre datos, se deben ejecutar los siguientes scripts en el SQL Editor de Supabase:

```sql
-- Crear tabla de Cajas principales
CREATE TABLE IF NOT EXISTS public.cajas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_sector TEXT UNIQUE NOT NULL,
  saldo_actual DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de Sub-Cajas (para Campeonatos)
CREATE TABLE IF NOT EXISTS public.sub_cajas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caja_id UUID REFERENCES public.cajas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  saldo_actual DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de Movimientos Contables (Libro Diario)
CREATE TABLE IF NOT EXISTS public.movimientos_contables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('ingreso', 'egreso')),
  monto DECIMAL(12,2) NOT NULL,
  categoria TEXT NOT NULL, -- 'Cuotas' o 'Campeonatos'
  sub_categoria TEXT,      -- Nombre del campeonato
  concepto TEXT,
  comprobante_id UUID REFERENCES public.pagos_comprobantes(id),
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- Datos Iniciales (Seed)
INSERT INTO public.cajas (nombre_sector, saldo_actual) VALUES 
('Cuotas', 0.00),
('Campeonatos', 0.00);

INSERT INTO public.sub_cajas (nombre, caja_id) VALUES 
('Torneo Apertura Primera', (SELECT id FROM public.cajas WHERE nombre_sector = 'Campeonatos')),
('Copa Haedo Sub-17', (SELECT id FROM public.cajas WHERE nombre_sector = 'Campeonatos'));
```

## 2. Políticas de Seguridad (RLS)
Asegurarse de que el rol `contador` y `admin` tengan acceso total a estas tablas:
- `profiles`
- `pagos_comprobantes`
- `cajas`
- `sub_cajas`
- `movimientos_contables`
"