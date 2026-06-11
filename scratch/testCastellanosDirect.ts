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
      console.log('Status:', data.status);
      console.log('Feed Metadata:', data.feed);
      console.log('Items Count:', data.items?.length);
      if (data.items && data.items.length > 0) {
        console.log('First 3 items:');
        data.items.slice(0, 3).forEach((item: any, i: number) => {
          console.log(`  ${i+1}. Title: ${item.title}`);
          console.log(`     Link: ${item.link}`);
          console.log(`     Date: ${item.pubDate}`);
        });
      }
    }
  } catch (e: any) {
    console.error('Fetch error:', e);
  }
}

run();
