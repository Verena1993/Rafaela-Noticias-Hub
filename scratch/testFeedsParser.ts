async function run() {
  const feeds = [
    { name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/feed/' },
    { name: 'Sunchales Hoy', url: 'https://sunchaleshoy.com.ar/feed/' }
  ];

  for (const feed of feeds) {
    console.log(`\n=== Fetching Raw RSS for: ${feed.name} ===`);
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const xml = await res.text();
      console.log(`Status: ${res.status}, Length: ${xml.length}`);
      console.log('XML Header (first 1000 chars):');
      console.log(xml.substring(0, 1000));
    } catch (e: any) {
      console.error(`Error:`, e.message);
    }
  }
}

run();
