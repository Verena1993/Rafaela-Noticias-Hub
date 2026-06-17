async function inspectGoogleNews() {
  const url = 'https://news.google.com/rss/search?q=site:rafaelainforma.com+when:7d&hl=es-419&gl=AR&ceid=AR:es-419';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const itemsMatch = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
    console.log(`Total items in RSS: ${itemsMatch.length}`);
    
    const validItems: any[] = [];
    itemsMatch.forEach((item, idx) => {
      const title = (item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
      const link = (item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '').trim();
      const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '').trim();
      
      const cleanTitle = title.replace(/\s*-\s*Rafaela\s*Informa$/i, '').trim();
      
      // Filter out generic pages
      if (cleanTitle.toLowerCase() === 'rafaela informa' || cleanTitle.toLowerCase() === 'policiales' || cleanTitle.toLowerCase() === 'locales') {
        return;
      }
      
      validItems.push({
        title: cleanTitle,
        link,
        pubDate,
        date: new Date(pubDate)
      });
    });
    
    // Sort validItems by date descending
    validItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log(`Valid news items count: ${validItems.length}`);
    validItems.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.pubDate}] ${item.title}`);
      console.log(`   Link: ${item.link}`);
    });
  } catch (err: any) {
    console.error(err);
  }
}

inspectGoogleNews();
