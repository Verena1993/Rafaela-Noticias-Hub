async function testProxy(name: string, proxyUrl: string) {
  const start = performance.now();
  try {
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    const duration = Math.round(performance.now() - start);
    let text = '';
    let preview = '';
    if (res.ok) {
      text = await res.text();
      preview = text.substring(0, 300);
    }
    console.log(`  Proxy [${name}]: ok=${res.ok}, status=${res.status}, time=${duration}ms, len=${text.length}, preview=${preview.replace(/\s+/g, ' ')}`);
  } catch (err: any) {
    console.log(`  Proxy [${name}]: error=${err.message}`);
  }
}

async function run() {
  const feedUrl = 'https://www.rafaelanoticias.com/feed/';
  console.log(`Testing feed fetch for ${feedUrl} via multiple proxies...\n`);

  // 1. AllOrigins
  await testProxy('AllOrigins', `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`);

  // 2. Corsproxy.io
  await testProxy('Corsproxy.io', `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`);

  // 3. CodeTabs
  await testProxy('CodeTabs', `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`);
  
  // 4. Direct fetch (just to compare)
  await testProxy('Direct', feedUrl);
}

run();
