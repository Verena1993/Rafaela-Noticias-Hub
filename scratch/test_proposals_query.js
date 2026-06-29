import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = 'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- 1. Simple select on proposals ---');
  const { data: simpleData, error: simpleError } = await supabase
    .from('proposals')
    .select('*')
    .limit(1);
  console.log('Simple select error:', simpleError);
  console.log('Simple select data:', simpleData);

  console.log('--- 2. Select with author profile ---');
  // Let's test with 'profiles!author_id(nombre)' or 'profiles!proposals_author_id_fkey(nombre)'
  const { data: authorData, error: authorError } = await supabase
    .from('proposals')
    .select('*, author:profiles!author_id(nombre)')
    .limit(1);
  console.log('Author join error:', authorError);
  console.log('Author join data:', authorData);

  console.log('--- 3. Select with programs/formats and decisions ---');
  const { data: fullData, error: fullError } = await supabase
    .from('proposals')
    .select(`
      *,
      author:profiles!author_id(nombre),
      proposal_programs(programs(name)),
      proposal_formats(formats(name)),
      proposal_decisions(
        status,
        note,
        timestamp,
        decider:profiles!decider_id(nombre)
      )
    `)
    .limit(1);
  console.log('Full join error:', fullError);
  console.log('Full join data:', fullData);
}

check();
