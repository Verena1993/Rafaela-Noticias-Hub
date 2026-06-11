const ENDPOINTS = [
  'https://www.rafaelanoticias.com/feed/',
  'https://www.rafaelanoticias.com/rss.xml',
  'https://www.rafaelanoticias.com/feed.xml',
  'https://www.rafaelanoticias.com/rss/',
  'https://www.rafaelanoticias.com/index.xml',
  'https://rafaelanoticias.com/feed/',
  'https://rafaelanoticias.com/rss.xml',
  'https://rafaelanoticias.com/feed.xml',
  'https://rafaelanoticias.com/rss/',
  'https://rafaelanoticias.com/index.xml',
  'https://www.rafaelanoticias.com/xml/rss.xml',
  'https://www.rafaelanoticias.com/suplementos/rss.xml'
];

async function run() {
  console.log('Scanning Rafaela Noticias feed endpoints...\n');
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`URL: ${url} -> status=${res.status}, ok=${res.ok}, type=${res.headers.get('content-type')}`);
    } catch (e: any) {
      console.log(`URL: ${url} -> error=${e.message}`);
    }
  }
}

run();
