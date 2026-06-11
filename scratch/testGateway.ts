import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = "sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_FEEDS = [
  { id: 'rafaela_noticias', name: 'Rafaela Noticias', url: 'https://www.rafaelanoticias.com/feed/' },
  { id: 'castellanos', name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/feed/' },
  { id: 'radiorafaela', name: 'Radio Rafaela', url: 'https://www.radiorafaela.com.ar/feed/' },
  { id: 'rafaelainforma', name: 'Rafaela Informa', url: 'https://www.rafaelainforma.com/feed/' },
  { id: 'movil_quique', name: 'Móvil Quique', url: 'https://movilquique.com/feed/' },
  { id: 'sunchales_hoy', name: 'Sunchales Hoy', url: 'https://sunchaleshoy.com.ar/feed/' }
];

async function run() {
  console.log('Testing feeds through Supabase Edge Function...\n');
  for (const feed of LOCAL_FEEDS) {
    console.log(`=== Testing feed: ${feed.name} ===`);
    console.log(`URL: ${feed.url}`);
    
    try {
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('radar-feed', {
        body: { targetUrl: feed.url }
      });
      const duration = Math.round(performance.now() - start);
      
      if (error) {
        console.log(`  Edge Function Error: ${error.message} (took ${duration}ms)`);
      } else {
        console.log(`  Edge Function Success: status=${data.status}, itemsCount=${data.items?.length || 0} (took ${duration}ms)`);
        if (data.status !== 'ok') {
          console.log(`  Message: ${data.message}`);
        }
      }
    } catch (e: any) {
      console.log(`  Request Failed: ${e.message}`);
    }
    console.log('-------------------------------------------\n');
  }
}

run();
