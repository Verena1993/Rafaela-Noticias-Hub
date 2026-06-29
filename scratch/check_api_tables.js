import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const tables = ['profiles', 'coverages', 'categories', 'proposals', 'programs', 'formats'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR`, error.message);
    } else {
      console.log(`Table '${table}': SUCCESS, row count:`, data.length);
    }
  }
}

check();
