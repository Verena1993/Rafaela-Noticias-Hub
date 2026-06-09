import { rssService } from './src/services/rssService';

async function test() {
  console.log('Fetching RSS feeds...');
  const start = performance.now();
  const { items, alerts, diagnostics } = await rssService.fetchNews();
  const end = performance.now();

  console.log(`\nFinished in ${((end - start) / 1000).toFixed(2)}s`);
  console.log(`Total items: ${items.length}`);
  console.log(`Total alerts: ${alerts.length}`);
  console.log('\n--- DIAGNOSTICS ---');
  diagnostics.forEach(d => {
    console.log(`[${d.status}] ${d.name}`);
    console.log(`  URL: ${d.url}`);
    console.log(`  Items: ${d.itemCount}`);
    console.log(`  Type: ${d.connectionType}`);
    console.log(`  Time: ${d.responseTimeMs}ms`);
    if (d.message) console.log(`  Error: ${d.message}`);
    console.log('-------------------------');
  });
}

test();
