import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const columns = [
    'id',
    'title',
    'description',
    'status',
    'date_time',
    'assignees',
    'comments',
    'multimedia',
    'shared_links',
    'publications',
    'activities',
    'programs',
    'formats',
    'logistics_info',
    'observations',
    'attachments',
    'proposal_id',
    'category_id'
  ];

  console.log('--- Checking column presence on coverages table ---');
  for (const col of columns) {
    const { error } = await supabase.from('coverages').select(col).limit(1);
    if (error) {
      console.log(`Column '${col}': MISSING (${error.message})`);
    } else {
      console.log(`Column '${col}': EXISTS`);
    }
  }
}

check();
