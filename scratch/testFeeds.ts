

const FEEDS = [
  { name: 'Rafaela Noticias', url: 'https://rafaelanoticias.com/feed/' },
  { name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/feed/' },
  { name: 'Radio Rafaela', url: 'https://radiorafaela.com.ar/feed/' },
  { name: 'Rafaela Informa', url: 'https://rafaelainforma.com/feed/' },
  { name: 'Móvil Quique', url: 'https://movilquique.com.ar/feed/' },
  { name: 'Sunchales Hoy', url: 'https://sunchaleshoy.com.ar/feed/' },
  { name: 'El Eco de Sunchales', url: 'https://elecodesunchales.com.ar/feed/' },
  { name: 'Municipalidad de Rafaela', url: 'https://www.rafaela.gob.ar/rss' },
  { name: 'Gobierno de Santa Fe', url: 'https://www.santafe.gov.ar/rss' }
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
];

async function testDirectFetch(feed: typeof FEEDS[0], userAgent: string) {
  const start = performance.now();
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(8000)
    });
    const duration = Math.round(performance.now() - start);
    return { ok: res.ok, status: res.status, duration, error: null };
  } catch (err: any) {
    return { ok: false, status: 0, duration: Math.round(performance.now() - start), error: err.message };
  }
}

async function testRss2Json(feed: typeof FEEDS[0]) {
  const start = performance.now();
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`, {
      signal: AbortSignal.timeout(8000)
    });
    const duration = Math.round(performance.now() - start);
    const data: any = await res.json();
    return { ok: data.status === 'ok', status: res.status, duration, error: data.status === 'ok' ? null : data.message };
  } catch (err: any) {
    return { ok: false, status: 0, duration: Math.round(performance.now() - start), error: err.message };
  }
}

async function run() {
  console.log('Starting feed fetch test...\n');
  
  for (const feed of FEEDS) {
    console.log(`=== Testing Feed: ${feed.name} ===`);
    console.log(`URL: ${feed.url}`);
    
    // 1. Direct fetch with chrome user agent
    const directChrome = await testDirectFetch(feed, USER_AGENTS[0]);
    console.log(`  Direct (Chrome UA): ok=${directChrome.ok}, status=${directChrome.status}, time=${directChrome.duration}ms, err=${directChrome.error}`);
    
    // 2. Direct fetch with safari user agent
    const directSafari = await testDirectFetch(feed, USER_AGENTS[1]);
    console.log(`  Direct (Safari UA): ok=${directSafari.ok}, status=${directSafari.status}, time=${directSafari.duration}ms, err=${directSafari.error}`);
    
    // 3. Direct fetch with Googlebot user agent
    const directBot = await testDirectFetch(feed, USER_AGENTS[2]);
    console.log(`  Direct (Googlebot UA): ok=${directBot.ok}, status=${directBot.status}, time=${directBot.duration}ms, err=${directBot.error}`);

    // 4. Rss2Json Proxy
    const rss2json = await testRss2Json(feed);
    console.log(`  Rss2Json Proxy: ok=${rss2json.ok}, status=${rss2json.status}, time=${rss2json.duration}ms, err=${rss2json.error}`);
    
    console.log('--------------------------------------------\n');
  }
}

run();
