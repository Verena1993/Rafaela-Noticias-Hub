import { rssService } from '../src/services/rssService';

async function main() {
  console.log("Iniciando diagnóstico completo de feeds RSS...");
  const start = Date.now();
  try {
    const result = await rssService.fetchNews();
    const duration = (Date.now() - start) / 1000;
    console.log(`\n=== DIAGNÓSTICO FINALIZADO EN ${duration.toFixed(2)}s ===`);
    console.log(`Noticias totales obtenidas: ${result.items.length}`);
    console.log(`Alertas totales obtenidas: ${result.alerts.length}`);
    console.log(`Diagnósticos totales: ${result.diagnostics.length}`);
    
    console.log("\nDetalle por feed:");
    result.diagnostics.forEach(d => {
      console.log(`- [${d.status}] ${d.name} (${d.connectionType}): ${d.itemCount} items, ${d.responseTimeMs}ms. Msg: ${d.message || 'ok'}`);
    });
  } catch (error) {
    console.error("Error en la ejecución del diagnóstico:", error);
  }
}

main();
