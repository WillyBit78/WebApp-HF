import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDb() {
  console.log("Testing Supabase SELECT from 'users'...");
  const { data: selectData, error: selectError } = await supabase.from('users').select('*');
  console.log("SELECT Error:", selectError);
  console.log("SELECT Count:", selectData ? selectData.length : 0);

  console.log("Testing Supabase INSERT into 'users'...");
  const testUser = {
    id: `usr-test-${Date.now()}`,
    nombre: 'Test',
    apellido: 'Device',
    usuario: `TEST${Date.now()}`,
    clave: '1234',
    rol: 'socio',
    telefono: '1122334455',
    dni: '99999999',
    categoria: 'BAFI Femenino (1ra)',
    montoCuota: 15000,
    estadoCuota: 'pendiente',
    numeroSocio: 999
  };

  const { data: insertData, error: insertError } = await supabase.from('users').insert([testUser]);
  console.log("INSERT Error:", insertError);
}

testDb();
