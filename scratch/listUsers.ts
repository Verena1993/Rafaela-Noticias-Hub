import { supabase } from '../src/lib/supabase';

async function listUsers() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log('Profiles in database:', data);
  }
}

listUsers();
