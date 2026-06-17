
async function testFetch(url: string) {
  console.log(`=== FETCHING ${url} ===`);
  const proxies = [
    { name: 'Direct', url: url },
    { name: 'AllOrigins', url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}` },
    { name: 'CorsProxy', url: `https://corsproxy.io/?${encodeURIComponent(url)}` }
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`Proxy: ${proxy.name} -> Status: ${res.status}`);
      let text = await res.text();
      if (proxy.name === 'AllOrigins' && res.status === 200) {
        const json = JSON.parse(text);
        text = json.contents || '';
      }
      console.log(`  Length: ${text.length}`);
      const isChallenge = text.includes('Just a moment...') || text.includes('cloudflare');
      console.log(`  Is Cloudflare Challenge: ${isChallenge}`);
      if (text.length > 500 && !isChallenge) {
        // Print first few headers/links
        const headers: string[] = [];
        const headerRegex = /<(h[23])[^>]*>([\s\S]*?)<\/h[23]>/gi;
        let match;
        while ((match = headerRegex.exec(text)) !== null && headers.length < 5) {
          headers.push(`[${match[1]}] ${match[2].replace(/<[^>]+>/g, '').trim().substring(0, 100)}`);
        }
        console.log(`  Headers found:\n`, headers.join('\n'));
        break; // found a working one
      }
    } catch (e: any) {
      console.log(`Proxy: ${proxy.name} -> Error: ${e.message}`);
    }
  }
}

async function main() {
  await testFetch('https://www.rafaelainforma.com/');
  await testFetch('https://adn979.com/');
  await testFetch('https://www.diariolaopinion.com.ar/');
}

main();
