const LOCAL_FEEDS = [
  { name: 'Rafaela Noticias', url: 'https://www.rafaelanoticias.com/feed/' },
  { name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/feed/' },
  { name: 'Rafaela Informa', url: 'https://www.rafaelainforma.com/feed/' },
  { name: 'Radio Rafaela', url: 'https://www.radiorafaela.com.ar/feed/' },
  { name: 'La Opinión de Rafaela', url: 'https://www.diariolaopinion.com.ar/feed/' },
  { name: 'Móvil Quique', url: 'https://movilquique.com/feed/' },
  { name: 'Sunchales Hoy', url: 'https://sunchaleshoy.com.ar/feed/' },
  { name: 'El Eco de Sunchales', url: 'https://elecodesunchales.com.ar/feed/' },
  { name: 'Esperanza Día por Día', url: 'https://www.esperanzadiapordia.com.ar/feed/' },
  { name: 'Reconquista Hoy', url: 'https://www.reconquistahoy.com/rss/' },
  { name: 'Municipalidad de Rafaela', url: 'https://www.rafaela.gob.ar/rss' }
];

async function run() {
  console.log('Testing direct HTTP fetch on all local feeds...\n');
  for (const feed of LOCAL_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });
      const text = await res.text();
      const isXml = text.trim().startsWith('<?xml') || text.trim().startsWith('<rss') || text.trim().startsWith('<feed');
      console.log(`Feed: ${feed.name}`);
      console.log(`  URL: ${feed.url}`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
      console.log(`  Length: ${text.length}`);
      console.log(`  Is XML: ${isXml}`);
      if (isXml) {
        console.log(`  Feed Title match: ${text.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'None'}`);
      } else {
        console.log(`  Preview (first 150 chars): ${text.substring(0, 150).replace(/\s+/g, ' ')}`);
      }
    } catch (e: any) {
      console.log(`Feed: ${feed.name} -> error: ${e.message}`);
    }
    console.log('--------------------------------------------\n');
  }
}

run();
