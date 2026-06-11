const ENDPOINTS = [
  'https://www.radiorafaela.com.ar/feed/',
  'https://www.radiorafaela.com.ar/rss.xml',
  'https://www.radiorafaela.com.ar/feed.xml',
  'https://www.radiorafaela.com.ar/rss/',
  'https://www.radiorafaela.com.ar/index.xml',
  'https://radiorafaela.com.ar/feed/',
  'https://radiorafaela.com.ar/rss.xml',
  'https://radiorafaela.com.ar/feed.xml',
  'https://radiorafaela.com.ar/rss/',
  'https://radiorafaela.com.ar/index.xml'
];

async function run() {
  console.log('Scanning Radio Rafaela feed endpoints...\n');
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
