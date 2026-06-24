import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

// Let's create an admin client exactly like in HubContext
const supabaseAdminClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function run() {
  console.log('Creating temp user...');
  const { data: createData, error: createError } = await supabaseAdminClient.auth.signUp({
    email: 'temp_to_delete@rafaelanoticias.com',
    password: 'password123',
    options: {
      data: {
        nombre: 'Temp User',
        rol: 'editor'
      }
    }
  });

  if (createError) {
    console.error('Error creating user:', createError.message);
    return;
  }

  const userId = createData.user?.id;
  console.log('User created successfully, ID:', userId);

  console.log('Attempting to delete user using auth.admin.deleteUser...');
  try {
    const { error: deleteError } = await supabaseAdminClient.auth.admin.deleteUser(userId!);
    if (deleteError) {
      console.log('deleteUser failed:', deleteError.message);
    } else {
      console.log('deleteUser succeeded!');
    }
  } catch (err: any) {
    console.error('Caught error during delete:', err.message);
  }
}

run().catch(console.error);
