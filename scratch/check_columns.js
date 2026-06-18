import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumns() {
  const columns = [
    'id',
    'title',
    'description',
    'dateTime',
    'date_time',
    'location',
    'status',
    'assignees',
    'comments',
    'multimedia',
    'shared_links',
    'sharedLinks',
    'publications',
    'activities',
    'programs',
    'formats',
    'logistics_info',
    'logisticsInfo',
    'observations',
    'attachments'
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

testColumns();
