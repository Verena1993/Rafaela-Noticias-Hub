import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function seedUser(email: string, name: string, rol: 'admin' | 'editor') {
  console.log(`Intentando registrar a ${name} (${email}) como ${rol}...`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        nombre: name,
        rol: rol
      }
    }
  });

  if (error) {
    console.error(`Error al registrar ${email}:`, error.message);
  } else {
    console.log(`Usuario ${email} registrado con éxito! ID:`, data.user?.id);
    if (data.session) {
      console.log(`Sesión iniciada automáticamente.`);
    }
  }
}

async function run() {
  console.log('Iniciando seed de usuarios en Supabase Auth...');
  
  // 1. Registrar Admin
  await seedUser('admin@rafaelanoticias.com', 'Admin Test', 'admin');
  
  // 2. Registrar Editor
  await seedUser('editor@rafaelanoticias.com', 'Editor Test', 'editor');
  
  console.log('Seed terminado. Asegúrate de haber ejecutado primero schema.sql en tu SQL Editor de Supabase.');
}

run().catch(console.error);
