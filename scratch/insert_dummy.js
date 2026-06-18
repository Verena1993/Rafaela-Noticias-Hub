import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const dummyCoverage = {
    id: 'test_cov_' + Date.now(),
    title: 'Test Title',
    description: 'Test Description',
    dateTime: new Date().toISOString(),
    location: 'Test Location',
    status: 'pending_confirmation',
    assignees: [],
    comments: [],
    multimedia: [],
    sharedLinks: [],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: [],
    programs: [],
    formats: [],
    logisticsInfo: '',
    observations: '',
    attachments: []
  };

  const { data, error } = await supabase
    .from('coverages')
    .insert([dummyCoverage])
    .select();

  console.log('Insert Data:', data);
  console.log('Insert Error:', error);
}

testInsert();
