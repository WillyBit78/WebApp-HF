import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.jmfxxqbtmyzslkrslpvk:HaedoFutsal.2026@aws-0-ca-central-1.pooler.supabase.com:5432/postgres';

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Conectando a Supabase PostgreSQL Pooler...");
    await client.connect();
    
    console.log("Agregando columnas de perfil a la tabla public.users...");
    const sql = `
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fecha_nacimiento TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hincha_de TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nombre_contacto TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono_contacto TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS foto_rostro TEXT;

      UPDATE public.users 
      SET apellido = TRIM(SPLIT_PART(SPLIT_PART(apellido, ' | META:', 1), ' | Tel:', 1))
      WHERE apellido LIKE '%| META:%' OR apellido LIKE '%| Tel:%';
    `;

    await client.query(sql);
    console.log("✅ Columnas creadas con éxito y apellidos limpiados en Supabase!");
  } catch (error) {
    console.error("❌ Error ejecutando migración SQL:", error);
  } finally {
    await client.end();
  }
}

applyMigration();
