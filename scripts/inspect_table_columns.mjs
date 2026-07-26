import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log("Error:", error);
  if (data && data.length > 0) {
    console.log("Columns in 'users' table:", Object.keys(data[0]));
    console.log("Sample Row:", data[0]);
  } else {
    console.log("No rows in 'users' table, trying insert with minimal fields...");
    const { error: err1 } = await supabase.from('users').insert([{ id: 'test1', nombre: 'a', apellido: 'b' }]);
    console.log("Insert minimal error:", err1);
  }
}

inspectTable();
