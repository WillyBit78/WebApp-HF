import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExact() {
  const testUser = {
    id: `usr-test-${Date.now()}`,
    numeroSocio: 999,
    nombre: 'Socio',
    apellido: 'PruebaSync',
    usuario: `WTEST${Date.now().toString().slice(-4)}`,
    clave: '1234',
    rol: 'socio',
    categoria: 'BAFI Femenino (1ra)',
    estadoCuota: 'pendiente',
    montoCuota: 15000
  };

  console.log("Inserting exact user object into Supabase...");
  const { data, error } = await supabase.from('users').insert([testUser]).select();
  console.log("Insert Result Error:", error);
  console.log("Insert Success Data:", data);
}

testExact();
