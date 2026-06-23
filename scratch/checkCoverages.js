const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = "sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Fetching coverages from Supabase...');
  const { data, error } = await supabase
    .from('coverages')
    .select('id, title, datetime, date_time')
    .limit(10);

  if (error) {
    console.error('Error fetching coverages:', error.message);
    return;
  }

  console.log(`Success! Fetched ${data.length} coverages:`);
  data.forEach(c => {
    console.log(`- ID: ${c.id}`);
    console.log(`  Title: ${c.title}`);
    console.log(`  datetime: ${c.datetime}`);
    console.log(`  date_time (legacy): ${c.date_time}`);
    console.log('---');
  });
}

main().catch(console.error);
