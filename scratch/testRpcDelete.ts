import { supabase } from '../src/lib/supabase';

async function run() {
  console.log('Testing RPC delete_user_by_id with a fake UUID...');
  const { data, error } = await supabase.rpc('delete_user_by_id', {
    user_id: '00000000-0000-0000-0000-000000000000'
  });

  if (error) {
    console.log('RPC failed:', error.message);
  } else {
    console.log('RPC succeeded, result:', data);
  }
}

run().catch(console.error);
