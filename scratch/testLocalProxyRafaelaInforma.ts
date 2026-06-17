async function testLocalProxy() {
  const url = 'http://localhost:5173/rss-local-proxy?url=https://www.rafaelainforma.com/';
  console.log(`Fetching via local proxy: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Length: ${text.length}`);
    const isXml = text.trim().startsWith('<?xml');
    console.log(`Is XML: ${isXml}`);
    const isChallenge = text.includes('Just a moment...') || text.includes('cloudflare');
    console.log(`Is Cloudflare Challenge: ${isChallenge}`);
    
    // Find headers/h3
    const headers: string[] = [];
    const headerRegex = /<(h[23])[^>]*>([\s\S]*?)<\/h[23]>/gi;
    let match;
    while ((match = headerRegex.exec(text)) !== null && headers.length < 10) {
      headers.push(`[${match[1]}] ${match[2].replace(/<[^>]+>/g, '').trim().substring(0, 100)}`);
    }
    console.log(`Headers found:\n`, headers.join('\n'));
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

testLocalProxy();
