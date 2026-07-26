import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectLogs() {
  const { data, error } = await supabase.from('logs').select('*').limit(1);
  console.log("Logs SELECT Error:", error);
  if (data && data.length > 0) {
    console.log("Columns in 'logs' table:", Object.keys(data[0]));
    console.log("Sample Log Row:", data[0]);
  }

  const testLog = {
    id: `log-test-${Date.now()}`,
    tipoEvento: 'alta_usuario',
    descripcion: 'Alta de usuario (Test)',
    detalles: 'Rol: SOCIO',
    usuarioNombre: 'Test User',
    usuarioRol: 'socio',
    fechaHora: '26/07/26, 18:27'
  };

  const { data: insertLogData, error: insertLogError } = await supabase.from('logs').insert([testLog]).select();
  console.log("Logs INSERT Error:", insertLogError);
  console.log("Logs INSERT Success Data:", insertLogData);
}

inspectLogs();
