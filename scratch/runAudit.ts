import { rssService } from '../src/services/rssService';
import { RSS_FEEDS } from '../src/config/rssFeeds';

async function main() {
  console.log("=== INICIANDO AUDITORÍA DE RADAR RSS ===");
  
  // Paso 1: Listar feeds y obtener noticias
  const result = await rssService.fetchNews();
  
  console.log("\n=== PASO 1: ESTADO DE FEEDS RSS ===");
  result.diagnostics.forEach((d, idx) => {
    console.log(`${idx + 1}. Nombre: ${d.name} | URL: ${d.url} | Estado: ${d.status} | Noticias Obtenidas: ${d.itemCount}`);
  });

  console.log("\n=== PASO 2: CLASIFICACIÓN DE NOTICIAS OBTENIDAS ===");
  result.items.forEach((item, idx) => {
    let expected = 'Desconocido';
    const titleLower = item.title.toLowerCase();
    
    // Determinación burda de lo que se esperaría según reglas del usuario
    if (titleLower.includes('pilar sordo')) {
      expected = 'no local (nombre de persona)';
    } else if (titleLower.includes('harry potter')) {
      expected = 'no alertable (ficción/entretenimiento)';
    } else if (['israel', 'iran', 'ucrania', 'segunda guerra mundial', 'bbc', 'dw'].some(kw => titleLower.includes(kw))) {
      expected = 'international (sin alerta operativa local)';
    } else {
      expected = item.category; // Por defecto dejamos el actual para comparar
    }

    console.log(`Noticia ${idx + 1}:`);
    console.log(`  Título: ${item.title}`);
    console.log(`  Fuente: ${item.source}`);
    console.log(`  Clasificación actual: ${item.category}`);
    console.log(`  Clasificación esperada: ${expected}`);
    console.log("----------------------------------------");
  });

  console.log("\n=== AUDITORÍA FINALIZADA ===");
}

main();
