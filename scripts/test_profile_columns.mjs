import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZnh4cWJ0bXl6c2xrcnNscHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjgzMTYsImV4cCI6MjEwMDM0NDMxNn0.4gqnpHimGI3au7ztEiSU38aLaSpxfr3f9doihkgDz6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullProfileUpsert() {
  console.log("Probando guardar perfil de socio completo con columnas nativas...");
  const { error } = await supabase.from('users').upsert([{
    id: 'usr-test-full',
    nombre: 'SocioTest',
    apellido: 'Prueba',
    usuario: 'SOCIOTEST',
    clave: '1234',
    rol: 'socio',
    categoria: 'Mayores',
    estadoCuota: 'al_dia',
    montoCuota: 15000,
    dni: '99.999.999',
    telefono: '11 1111-2222',
    fecha_nacimiento: '14/08/1982',
    hincha_de: 'Haedo Futsal',
    nombre_contacto: 'Tutor Guillermo',
    telefono_contacto: '11 5544-3322',
    foto_rostro: ''
  }]);

  if (error) {
    console.error("❌ Error en upsert:", error);
  } else {
    console.log("✅ ÉXITO TOTAL: Registro insertado correctamente con todas las columnas de perfil en Supabase!");
    const { data } = await supabase.from('users').select('*').eq('id', 'usr-test-full');
    console.log("Fila recuperada de Supabase:", data[0]);
    await supabase.from('users').delete().eq('id', 'usr-test-full');
  }
}

testFullProfileUpsert();
