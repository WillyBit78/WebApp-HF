const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAll() {
  const [uRes, pRes, eRes, nRes, mRes, lRes] = await Promise.all([
    supabase.from('users').select('*').order('created_at', { ascending: true }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('movimientos').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50)
  ]);

  console.log('users error:', uRes.error, 'count:', uRes.data?.length);
  console.log('payments error:', pRes.error, 'count:', pRes.data?.length);
  console.log('events error:', eRes.error, 'count:', eRes.data?.length);
  console.log('notices error:', nRes.error, 'count:', nRes.data?.length);
  console.log('movimientos error:', mRes.error, 'count:', mRes.data?.length);
  console.log('logs error:', lRes.error, 'count:', lRes.data?.length);

  if (uRes.data) {
    console.log('\nUsers found:');
    uRes.data.forEach(u => console.log(`- ID: ${u.id} | Nombre: ${u.nombre} ${u.apellido} | Rol: ${u.rol}`));
  }
}

testAll();
