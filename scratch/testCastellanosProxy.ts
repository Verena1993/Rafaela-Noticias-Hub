const parseRssXml = (xmlText: string): any[] => {
  try {
    const items: any[] = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    if (!itemMatches) return [];
    
    const extractTag = (xml: string, tag: string) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
      if (match) {
        return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      }
      return '';
    };
    
    itemMatches.forEach(itemXml => {
      const title = extractTag(itemXml, 'title');
      let link = extractTag(itemXml, 'link');
      if (!link) {
        const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (hrefMatch) link = hrefMatch[1];
      }
      const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary');
      const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published') || extractTag(itemXml, 'updated');
      const author = extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'author');
      
      items.push({
        title,
        link,
        pubDate,
        description,
        content: description,
        author
      });
    });
    return items;
  } catch (err: any) {
    console.error("Regex parser failed:", err.message);
  }
  return [];
};

async function run() {
  const url = 'https://diariocastellanos.com.ar/feed/';
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  console.log(`Fetching ${url} via AllOrigins...`);
  
  try {
    const res = await fetch(proxyUrl);
    console.log(`Fetch status: ${res.status}`);
    if (res.ok) {
      const json = await res.json();
      console.log(`JSON keys:`, Object.keys(json));
      const contents = json.contents;
      console.log(`Raw XML length: ${contents?.length}`);
      
      const parsed = parseRssXml(contents);
      console.log(`Parsed items: ${parsed.length}`);
      if (parsed.length > 0) {
        console.log(`First item title: "${parsed[0].title}"`);
      }
    }
  } catch (e: any) {
    console.error(`Error:`, e.message);
  }
}

run();
