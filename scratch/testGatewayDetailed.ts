import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = "sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const url = 'https://diariocastellanos.com.ar/feed/';
  console.log(`Invoking Edge Function for: ${url}`);
  try {
    const { data, error } = await supabase.functions.invoke('radar-feed', {
      body: { targetUrl: url }
    });
    if (error) {
      console.error('Edge Function Error:', error);
    } else {
      console.log('Edge Function Response Keys:', Object.keys(data));
      console.log('Full JSON Response:', JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.error('Fetch error:', e);
  }
}

run();
