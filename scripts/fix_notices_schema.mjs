import pg from 'pg';
const { Client } = pg;
const connectionString = 'postgresql://postgres.jmfxxqbtmyzslkrslpvk:HaedoFutsal.2026@aws-0-ca-central-1.pooler.supabase.com:5432/postgres';

async function fixNoticesSchema() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Conectado a PostgreSQL Supabase...');

  // 1. Asegurar tabla notices y eliminar restriccion NOT NULL en tipo
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.notices (
      id TEXT PRIMARY KEY,
      tipo TEXT DEFAULT 'general',
      titulo TEXT NOT NULL,
      contenido TEXT,
      mensaje TEXT,
      autor TEXT NOT NULL,
      fecha TEXT,
      urgente BOOLEAN DEFAULT FALSE,
      destinatario_tipo TEXT DEFAULT 'todos',
      destinatario_valor TEXT DEFAULT 'Todos',
      filtro_estado_cuenta TEXT DEFAULT 'todos',
      categoria_destino TEXT DEFAULT 'Todos',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE public.notices ALTER COLUMN tipo DROP NOT NULL;
    ALTER TABLE public.notices ALTER COLUMN tipo SET DEFAULT 'general';
    ALTER TABLE public.notices ALTER COLUMN fecha DROP NOT NULL;
    ALTER TABLE public.notices ALTER COLUMN fecha SET DEFAULT CURRENT_DATE::text;
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS contenido TEXT;
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS mensaje TEXT;
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS urgente BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS destinatario_tipo TEXT DEFAULT 'todos';
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS destinatario_valor TEXT DEFAULT 'Todos';
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS filtro_estado_cuenta TEXT DEFAULT 'todos';
    ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS categoria_destino TEXT DEFAULT 'Todos';
  `);
  console.log('✅ Esquema de public.notices actualizado correctamente.');

  // 2. Habilitar Realtime
  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;`);
    console.log('✅ Realtime habilitado para public.notices');
  } catch (e) {
    console.log('Status Realtime notices:', e.message);
  }

  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;`);
    console.log('✅ Realtime habilitado para public.push_subscriptions');
  } catch (e) {
    console.log('Status Realtime push_subscriptions:', e.message);
  }

  // 3. Probar insert directo
  const res = await client.query(`
    INSERT INTO public.notices (id, titulo, contenido, mensaje, autor, urgente)
    VALUES ('not-test-db-1', 'Aviso de prueba sistema', 'Prueba contenido', 'Prueba contenido', 'Admin (ADMIN)', true)
    ON CONFLICT (id) DO NOTHING
    RETURNING *;
  `);
  console.log('Aviso insertado en DB Supabase:', res.rows[0]);

  await client.end();
}

fixNoticesSchema().catch(console.error);
