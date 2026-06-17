async function testDirectFetchHeaders() {
  const url = 'https://www.rafaelainforma.com/';
  console.log(`Direct fetch with browser headers to: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Length: ${text.length}`);
    const isChallenge = text.includes('Just a moment...') || text.includes('cloudflare');
    console.log(`Is Cloudflare Challenge: ${isChallenge}`);
  } catch (err: any) {
    console.log(`Error: ${err.message}`);
  }
}

testDirectFetchHeaders();
