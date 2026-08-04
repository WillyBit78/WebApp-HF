const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogs() {
  const testLog = {
    id: `log-test-${Date.now()}`,
    created_at: new Date().toISOString(),
    fechaHora: new Date().toLocaleString(),
    usuarioNombre: 'Test User',
    usuarioRol: 'admin',
    tipoEvento: 'test_event',
    descripcion: 'Test log description',
    detalles: 'Test log details'
  };

  console.log('Testing logs insert with camelCase fields...');
  const res1 = await supabase.from('logs').insert([testLog]);
  console.log('res1 Error:', res1.error);

  console.log('\nFetching last 5 logs...');
  const res2 = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('res2 Error:', res2.error);
  console.log('Last logs:', res2.data);
}

testLogs();
