import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanUsersData() {
  console.log("Obteniendo usuarios de Supabase...");
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error("Error al obtener usuarios:", error);
    return;
  }

  console.log(`Analizando ${users.length} usuarios...`);
  for (const u of users) {
    const rawAp = u.apellido || '';
    if (rawAp.includes('| META:') || rawAp.includes('| Tel:')) {
      const cleanAp = rawAp.split(' | META:')[0].split(' | Tel:')[0].trim();
      console.log(`Limpiando usuario ID ${u.id} (${u.nombre} ${rawAp}) -> Apellido: "${cleanAp}"`);
      const { error: updateErr } = await supabase
        .from('users')
        .update({ apellido: cleanAp })
        .eq('id', u.id);
      
      if (updateErr) {
        console.error(`Error actualizando usuario ${u.id}:`, updateErr);
      } else {
        console.log(`✓ Usuario ${u.id} actualizado con éxito en Supabase.`);
      }
    }
  }
  console.log("Proceso de limpieza en Supabase completado.");
}

cleanUsersData();
