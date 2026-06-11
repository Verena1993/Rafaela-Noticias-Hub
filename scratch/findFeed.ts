async function run() {
  const url = 'https://www.rafaelanoticias.com/';
  console.log(`Fetching homepage to find RSS feeds: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log(`Homepage fetched: ok=${res.ok}, status=${res.status}, length=${html.length}`);
    
    // Search for feed links
    const regex = /<link[^>]+(?:type="application\/rss\+xml"|type="application\/atom\+xml"|rel="alternate")[^>]*>/gi;
    const matches = html.match(regex);
    if (matches) {
      console.log('\nFound feed link tags:');
      matches.forEach(m => console.log('  ', m));
    } else {
      console.log('\nNo feed link tags found in HTML.');
    }
    
    // Search for any "/feed" or "rss" references in links
    console.log('\nScanning for links containing "feed" or "rss":');
    const hrefRegex = /href="([^"]*(?:feed|rss)[^"]*)"/gi;
    let match;
    const foundHrefs = new Set<string>();
    while ((match = hrefRegex.exec(html)) !== null) {
      foundHrefs.add(match[1]);
    }
    foundHrefs.forEach(href => console.log('  ', href));
  } catch (e: any) {
    console.error('Error fetching homepage:', e.message);
  }
}

run();
