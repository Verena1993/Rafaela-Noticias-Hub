async function testGoogleNews() {
  const url = 'https://news.google.com/rss/search?q=site:rafaelainforma.com&hl=es-419&gl=AR&ceid=AR:es-419';
  console.log(`Fetching Google News RSS: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Length: ${text.length}`);
    const isXml = text.trim().startsWith('<?xml') || text.trim().startsWith('<rss') || text.trim().startsWith('<feed');
    console.log(`Is XML: ${isXml}`);
    if (isXml) {
      const itemsMatch = text.match(/<item>([\s\S]*?)<\/item>/g);
      console.log(`Items count: ${itemsMatch ? itemsMatch.length : 0}`);
      if (itemsMatch && itemsMatch.length > 0) {
        for (let i = 0; i < Math.min(3, itemsMatch.length); i++) {
          const item = itemsMatch[i];
          const title = item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'None';
          const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || 'None';
          const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || 'None';
          console.log(`Item ${i + 1}:`);
          console.log(`  Title: ${title.trim()}`);
          console.log(`  Link: ${link.trim()}`);
          console.log(`  PubDate: ${pubDate.trim()}`);
        }
      }
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

testGoogleNews();
