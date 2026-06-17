async function testRss2Json() {
  const rssUrl = 'https://news.google.com/rss/search?q=site:rafaelainforma.com+when:7d&hl=es-419&gl=AR&ceid=AR:es-419';
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  console.log(`Fetching via rss2json: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Status from json: ${data.status}`);
    if (data.status === 'ok') {
      console.log(`Items count: ${data.items?.length}`);
      if (data.items?.length > 0) {
        console.log(`First item title: ${data.items[0].title}`);
        console.log(`First item pubDate: ${data.items[0].pubDate}`);
      }
    } else {
      console.log(`Error message: ${data.message}`);
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

testRss2Json();
