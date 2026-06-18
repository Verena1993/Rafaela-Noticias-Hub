import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMoreColumns() {
  const columns = [
    'date',
    'created_at',
    'updated_at',
    'user_id',
    'assignee_id',
    'program',
    'format',
    'logistics',
    'observation',
    'metadata'
  ];

  for (const col of columns) {
    const { data, error } = await supabase.from('coverages').select(col).limit(1);
    if (error) {
      console.log(`Column '${col}': FAILED`, error.message);
    } else {
      console.log(`Column '${col}': SUCCESS`);
    }
  }
}

testMoreColumns();
