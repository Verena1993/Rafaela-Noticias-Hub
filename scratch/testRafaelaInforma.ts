async function testEndpoint(url: string) {
  console.log(`Testing URL: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, application/json, text/xml, */*'
      }
    });
    console.log(`  Status: ${res.status}`);
    console.log(`  Content-Type: ${res.headers.get('content-type')}`);
    const text = await res.text();
    console.log(`  Length: ${text.length}`);
    const preview = text.substring(0, 300).replace(/\s+/g, ' ');
    console.log(`  Preview: ${preview}`);
    
    // Check if it's XML or JSON
    const isXml = text.trim().startsWith('<?xml') || text.trim().startsWith('<rss') || text.trim().startsWith('<feed') || text.trim().startsWith('<sitemap');
    const isJson = text.trim().startsWith('{') || text.trim().startsWith('[');
    console.log(`  Is XML: ${isXml} | Is JSON: ${isJson}`);
    
    if (isXml) {
      const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
      console.log(`  XML Title: ${titleMatch ? titleMatch[1].trim() : 'None'}`);
    } else if (isJson) {
      try {
        const obj = JSON.parse(text);
        if (Array.isArray(obj)) {
          console.log(`  JSON Array Size: ${obj.length}`);
          if (obj.length > 0) {
            console.log(`  First item title: ${obj[0].title?.rendered || obj[0].title || 'None'}`);
          }
        } else {
          console.log(`  JSON Object Keys: ${Object.keys(obj).join(', ')}`);
        }
      } catch (err: any) {
        console.log(`  JSON Parse Error: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
  }
  console.log('-----------------------------------------------------\n');
}

async function main() {
  const urls = [
    'https://www.rafaelainforma.com/feed/',
    'https://rafaelainforma.com/feed/',
    'https://www.rafaelainforma.com/feed',
    'https://rafaelainforma.com/feed',
    'https://www.rafaelainforma.com/sitemap.xml',
    'https://www.rafaelainforma.com/sitemap_index.xml',
    'https://www.rafaelainforma.com/wp-json/wp/v2/posts?per_page=5',
    'https://www.rafaelainforma.com/wp-json/wp/v2/posts'
  ];
  for (const url of urls) {
    await testEndpoint(url);
  }
}

main();
