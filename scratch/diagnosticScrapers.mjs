/**
 * DIAGNÓSTICO DE SCRAPERS — Fase 1
 * 
 * Reproduce exactamente la lógica de supabaseRadarGateway.ts y rssService.ts
 * para determinar en qué punto exacto fallan los scrapers.
 * 
 * Uso: node scratch/diagnosticScrapers.mjs
 * (Requiere Node 18+ con fetch nativo)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const decodeHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&iacute;/g, 'í').replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([A-Fa-f0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

const isValidJournalisticArticle = (item) => {
  const title = (item.title || '').trim();
  const url = (item.link || item.url || '').trim();

  if (!title || title.length < 10) return { valid: false, reason: `Título muy corto (${title.length} chars): "${title}"` };
  if (/^(https?:\/\/|www\.)/i.test(title)) return { valid: false, reason: `Título es una URL: "${title}"` };
  if (/^\d+$/.test(title)) return { valid: false, reason: `Título puramente numérico: "${title}"` };

  const genericTitles = [
    'home', 'inicio', 'portada', 'contacto', 'about us', 'sobre nosotros',
    'sin titulo', 'no title', 'error', '404', 'rss feed', 'suscripción', 'suscripcion',
    'ingresar', 'login', 'register', 'registrarse'
  ];
  if (genericTitles.includes(title.toLowerCase())) return { valid: false, reason: `Título genérico: "${title}"` };

  if (title.startsWith('Categoría:') || title.startsWith('Etiqueta:') || title.startsWith('Tag:') || title.startsWith('Category:')) {
    return { valid: false, reason: `Título con prefijo de taxonomía: "${title}"` };
  }

  if (url) {
    const invalidUrlPatterns = [
      /\/category\//i, /\/tag\//i, /\/author\//i, /\/archivo\//i,
      /\/contacto/i, /\/about/i, /\/sobre-nosotros/i, /\/politica-de-privacidad/i,
      /\/terms/i, /\/condiciones/i, /\/wp-admin/i, /\/wp-content/i,
      /page\/\d+/i, /\?cat=\d+/i, /\?author=\d+/i, /\?p=\d+/i,
      /\/search\?/i, /\.xml$/i, /\/feed$/i, /\/rss$/i
    ];
    const failedPattern = invalidUrlPatterns.find(p => p.test(url));
    if (failedPattern) return { valid: false, reason: `URL inválida (${failedPattern}): "${url}"` };
  }

  return { valid: true, reason: 'OK' };
};

// ─── Fetch con timeout y múltiples proxies ───────────────────────────────────

const PROXIES = [
  { name: 'Direct', buildUrl: (u) => u },
  { name: 'AllOrigins', buildUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, isJson: true },
  { name: 'CorsProxy', buildUrl: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
];

async function fetchHtml(targetUrl, label) {
  console.log(`\n  📥 [${label}] Descargando HTML desde: ${targetUrl}`);

  for (const proxy of PROXIES) {
    const proxyUrl = proxy.buildUrl(targetUrl);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
        }
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`  ⚠️  [${proxy.name}] HTTP ${res.status} ${res.statusText}`);
        continue;
      }

      let html;
      if (proxy.isJson) {
        const json = await res.json();
        html = json.contents || '';
      } else {
        html = await res.text();
      }

      const isCloudflare = html.includes('Just a moment...') || html.includes('cf-browser-verification') || html.includes('_cf_chl');
      const isErrorPage = html.trim().length < 500;

      console.log(`  ✅ [${proxy.name}] HTTP ${res.status} | HTML length: ${html.length} chars | Cloudflare: ${isCloudflare} | Vacío: ${isErrorPage}`);

      if (isCloudflare) {
        console.log(`  🚫 [${proxy.name}] Bloqueado por Cloudflare — probando siguiente proxy...`);
        continue;
      }
      if (isErrorPage) {
        console.log(`  🚫 [${proxy.name}] HTML muy corto, posible error — probando siguiente proxy...`);
        continue;
      }

      return { html, proxy: proxy.name, length: html.length };
    } catch (err) {
      console.log(`  ❌ [${proxy.name}] Error: ${err.message}`);
    }
  }

  return null;
}

// ─── SCRAPER: Radio Rafaela (lógica actual de supabaseRadarGateway.ts) ───────

function scrapeRadioRafaela_diagnostic(html) {
  console.log('\n  🔍 [Radio Rafaela] Ejecutando selectores actuales...');
  const items = [];
  let match;

  // Selector A: PrimaryNote
  const primaryRegex = /class="[^"]*PrimaryNote_PrimaryNoteLink[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<h\d[^>]*class="[^"]*PrimaryNote_PrimaryNoteTitle[^"]*"[^>]*>([\s\S]*?)<\/h\d>/gi;
  let selectorACount = 0;
  while ((match = primaryRegex.exec(html)) !== null) {
    selectorACount++;
    const link = match[1].startsWith('/') ? 'https://radiorafaela.com.ar' + match[1] : match[1];
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim());
    if (title.length >= 10) items.push({ title, link });
  }
  console.log(`     Selector A (PrimaryNote_PrimaryNoteLink + PrimaryNoteTitle): ${selectorACount} coincidencias regex | ${items.length} ítems válidos`);

  // Selector B: SecondaryNotes
  const secondaryRegex = /<a[^>]*href="([^"]+)"[^>]*aria-label="([^"]+)"[^>]*class="[^"]*SecondaryNotes_SecondaryNotesLink[^"]*"/gi;
  let selectorBCount = 0;
  while ((match = secondaryRegex.exec(html)) !== null) {
    selectorBCount++;
    const link = match[1].startsWith('/') ? 'https://radiorafaela.com.ar' + match[1] : match[1];
    const title = decodeHtmlEntities(match[2].replace(/&quot;/g, '"').trim());
    if (title.length >= 10 && !items.some(x => x.link === link)) {
      items.push({ title, link });
    }
  }
  console.log(`     Selector B (SecondaryNotes_SecondaryNotesLink + aria-label): ${selectorBCount} coincidencias regex`);

  // Selector C: General Notes
  const generalRegex = /<a[^>]*href="([^"]+)"[^>]*class="[^"]*Note_NoteTitleLink[^"]*"[^>]*>\s*<h\d[^>]*class="[^"]*Note_NoteTitle[^"]*"[^>]*>([\s\S]*?)<\/h\d>/gi;
  let selectorCCount = 0;
  while ((match = generalRegex.exec(html)) !== null) {
    selectorCCount++;
    const link = match[1].startsWith('/') ? 'https://radiorafaela.com.ar' + match[1] : match[1];
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim());
    if (title.length >= 10 && !items.some(x => x.link === link)) {
      items.push({ title, link });
    }
  }
  console.log(`     Selector C (Note_NoteTitleLink + Note_NoteTitle): ${selectorCCount} coincidencias regex`);

  console.log(`     Total ítems extraídos por scrapers actuales: ${items.length}`);

  // --- Diagnóstico extra: ¿Qué clases sí existen en el HTML? ---
  const classMatches = html.match(/class="([^"]{0,200})"/g) || [];
  const noteClasses = classMatches
    .map(m => m.replace(/class="/, '').replace(/"$/, ''))
    .filter(c => c.toLowerCase().includes('note') || c.toLowerCase().includes('noticia') || c.toLowerCase().includes('article'))
    .slice(0, 15);
  console.log(`     🔬 Clases CSS que contienen "note/noticia/article" encontradas en el HTML (primeras 15):`);
  noteClasses.forEach(c => console.log(`        • "${c}"`));

  // También buscar <article> tags
  const articleCount = (html.match(/<article/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  console.log(`     🔬 Estructura HTML: <article>: ${articleCount} | <h2>: ${h2Count} | <h3>: ${h3Count}`);

  return { items, selectorACount, selectorBCount, selectorCCount };
}

// ─── SCRAPER: Diario Castellanos (lógica actual) ─────────────────────────────

function scrapeDiarioCastellanos_diagnostic(html) {
  console.log('\n  🔍 [Diario Castellanos] Ejecutando selectores actuales...');
  const items = [];
  let match;

  // Selector principal: clases td Newspaper theme
  const titleRegex = /<(?:h[1-6]|div|span)[^>]*class="[^"]*(?:tdb_module_title|tdb-module-title|td-module-title|entry-title)[^"]*"[^>]*>\s*(?:<style[\s\S]*?<\/style>\s*)*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let selectorACount = 0;
  while ((match = titleRegex.exec(html)) !== null) {
    selectorACount++;
    const link = match[1];
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim());
    if (title.length >= 10 && !/^(https?:\/\/|www\.)/i.test(title) && !items.some(x => x.link === link)) {
      items.push({ title, link });
    }
  }
  console.log(`     Selector A (tdb_module_title|tdb-module-title|td-module-title|entry-title): ${selectorACount} coincidencias regex | ${items.length} ítems`);

  console.log(`     Total ítems extraídos por scrapers actuales: ${items.length}`);

  // --- Diagnóstico extra: clases CSS relacionadas con títulos ---
  const classMatches = html.match(/class="([^"]{0,200})"/g) || [];
  const titleClasses = classMatches
    .map(m => m.replace(/class="/, '').replace(/"$/, ''))
    .filter(c => c.toLowerCase().includes('title') || c.toLowerCase().includes('titulo') || c.toLowerCase().includes('tdb') || c.toLowerCase().includes('entry'))
    .slice(0, 15);
  console.log(`     🔬 Clases CSS con "title/titulo/tdb/entry" (primeras 15):`);
  titleClasses.forEach(c => console.log(`        • "${c}"`));

  const articleCount = (html.match(/<article/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  console.log(`     🔬 Estructura HTML: <article>: ${articleCount} | <h2>: ${h2Count} | <h3>: ${h3Count}`);

  // Buscar links con estructura de fecha en URL (artículos de WP)
  const dateLinks = (html.match(/href="[^"]*\/\d{4}\/\d{2}\/\d{2}\/[^"]+"/gi) || []).slice(0, 5);
  console.log(`     🔬 Links con fecha en URL (/YYYY/MM/DD/): ${dateLinks.length} encontrados`);
  dateLinks.forEach(l => console.log(`        • ${l.replace('href="', '').replace('"', '')}`));

  return { items, selectorACount };
}

// ─── SCRAPER: Minuto Rafaela (lógica actual) ──────────────────────────────────

function scrapeMinutoRafaela_diagnostic(html) {
  console.log('\n  🔍 [Minuto Rafaela] Ejecutando selectores actuales...');
  const items = [];
  let match;

  // Selector principal
  const titleRegex = /<h\d[^>]*class="[^"]*thumb-info-inner[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let selectorACount = 0;
  while ((match = titleRegex.exec(html)) !== null) {
    selectorACount++;
    const link = match[1];
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '').trim());
    if (title.length >= 10 && !/^(https?:\/\/|www\.)/i.test(title) && !items.some(x => x.link === link)) {
      items.push({ title, link });
    }
  }
  console.log(`     Selector A (thumb-info-inner): ${selectorACount} coincidencias regex | ${items.length} ítems`);

  console.log(`     Total ítems extraídos por scrapers actuales: ${items.length}`);

  // --- Diagnóstico extra ---
  const classMatches = html.match(/class="([^"]{0,200})"/g) || [];
  const thumbClasses = classMatches
    .map(m => m.replace(/class="/, '').replace(/"$/, ''))
    .filter(c => c.toLowerCase().includes('thumb') || c.toLowerCase().includes('post') || c.toLowerCase().includes('article') || c.toLowerCase().includes('entry'))
    .slice(0, 15);
  console.log(`     🔬 Clases CSS con "thumb/post/article/entry" (primeras 15):`);
  thumbClasses.forEach(c => console.log(`        • "${c}"`));

  const articleCount = (html.match(/<article/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  console.log(`     🔬 Estructura HTML: <article>: ${articleCount} | <h2>: ${h2Count} | <h3>: ${h3Count}`);

  const dateLinks = (html.match(/href="[^"]*\/\d{4}\/\d{2}\/\d{2}\/[^"]+"/gi) || []).slice(0, 5);
  console.log(`     🔬 Links con fecha en URL (/YYYY/MM/DD/): ${dateLinks.length} encontrados`);
  dateLinks.forEach(l => console.log(`        • ${l.replace('href="', '').replace('"', '')}`));

  return { items, selectorACount };
}

// ─── Validación y consolidación ───────────────────────────────────────────────

function runValidation(items, label) {
  console.log(`\n  ✅ [${label}] Validando ${items.length} artículos con isValidJournalisticArticle()...`);
  const valid = [];
  const discarded = [];

  for (const item of items) {
    const result = isValidJournalisticArticle(item);
    if (result.valid) {
      valid.push(item);
    } else {
      discarded.push({ item, reason: result.reason });
    }
  }

  if (discarded.length > 0) {
    console.log(`     ⛔ ${discarded.length} artículos descartados:`);
    discarded.slice(0, 5).forEach(d => console.log(`        • ${d.reason}`));
    if (discarded.length > 5) console.log(`        ... y ${discarded.length - 5} más`);
  } else {
    console.log(`     Ningún artículo descartado.`);
  }

  console.log(`     Artículos válidos: ${valid.length}`);
  return valid;
}

// ─── Análisis RSS Fallback ────────────────────────────────────────────────────

function analyzeRssFallback(portadaCount, label) {
  console.log(`\n  📊 [${label}] Análisis de uso de RSS Fallback:`);
  console.log(`     Noticias de portada válidas: ${portadaCount}`);
  
  if (portadaCount >= 3) {
    console.log(`     → RSS Fallback: NO NECESARIO (portada tiene ${portadaCount} >= 3 noticias)`);
    console.log(`     → Resultado esperado: PORTADA (3) ó más`);
    return false;
  } else if (portadaCount > 0) {
    console.log(`     → RSS Fallback: ACTIVADO para completar (solo ${portadaCount} de portada < 3)`);
    console.log(`     → Resultado esperado: PORTADA (${portadaCount}) + RSS (${3 - portadaCount})`);
    return true;
  } else {
    console.log(`     → RSS Fallback: ACTIVADO como fuente única (0 noticias de portada)`);
    console.log(`     → Resultado esperado: RSS FALLBACK (3)`);
    return true;
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const TARGETS = [
  {
    label: 'Radio Rafaela',
    url: 'https://radiorafaela.com.ar/',
    scraper: scrapeRadioRafaela_diagnostic,
  },
  {
    label: 'Diario Castellanos',
    url: 'https://diariocastellanos.com.ar/',
    scraper: scrapeDiarioCastellanos_diagnostic,
  },
  {
    label: 'Minuto Rafaela',
    url: 'https://minutorafaela.com.ar/',
    scraper: scrapeMinutoRafaela_diagnostic,
  },
];

const summary = [];

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DIAGNÓSTICO DE SCRAPERS — Fase 1');
  console.log(`  ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
  console.log('═══════════════════════════════════════════════════════════════');

  for (const target of TARGETS) {
    console.log(`\n\n${'─'.repeat(63)}`);
    console.log(`  📰 ${target.label.toUpperCase()}`);
    console.log(`${'─'.repeat(63)}`);

    // 1. Descarga HTML
    const fetchResult = await fetchHtml(target.url, target.label);

    if (!fetchResult) {
      console.log(`\n  ❌ [${target.label}] FALLA TOTAL: No se pudo descargar el HTML por ningún proxy.`);
      summary.push({ label: target.label, stage: 'DESCARGA HTML', result: 'FALLO', portadaCount: 0, rssActivado: true });
      continue;
    }

    console.log(`\n  📄 [${target.label}] HTML descargado correctamente vía ${fetchResult.proxy} (${fetchResult.length} chars)`);

    // 2. Extracción con selectores actuales
    const { items } = target.scraper(fetchResult.html);

    // 3. Validación con isValidJournalisticArticle
    const validItems = runValidation(items, target.label);

    // 4. Consolidación
    console.log(`\n  📦 [${target.label}] Consolidación:`);
    console.log(`     Total portada → extracción: ${items.length}`);
    console.log(`     Total portada → después de validación: ${validItems.length}`);

    // Mostrar los primeros 3 válidos si existen
    if (validItems.length > 0) {
      console.log(`     Primeros ${Math.min(3, validItems.length)} artículos válidos:`);
      validItems.slice(0, 3).forEach((item, i) => {
        console.log(`       ${i + 1}. "${item.title}"`);
        console.log(`          → ${item.link}`);
      });
    }

    // 5. Resultado final y activación RSS Fallback
    const rssActivado = analyzeRssFallback(validItems.length, target.label);

    summary.push({
      label: target.label,
      stage: validItems.length === 0 ? 'EXTRACCIÓN (0 resultados)' : validItems.length < 3 ? 'EXTRACCIÓN (< 3 resultados)' : 'OK',
      result: validItems.length >= 3 ? 'PORTADA OK' : validItems.length > 0 ? 'PORTADA PARCIAL' : 'FALLO',
      portadaCount: validItems.length,
      rssActivado,
    });
  }

  // ─── INFORME FINAL ─────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('  INFORME FINAL — RESUMEN DE DIAGNÓSTICO');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  for (const s of summary) {
    const icon = s.result === 'PORTADA OK' ? '🟢' : s.result === 'PORTADA PARCIAL' ? '🟡' : '🔴';
    console.log(`  ${icon} ${s.label}`);
    console.log(`     Etapa del fallo : ${s.stage}`);
    console.log(`     Noticias portada: ${s.portadaCount}`);
    console.log(`     RSS Fallback    : ${s.rssActivado ? 'ACTIVADO ⚠️' : 'NO NECESARIO ✅'}`);
    console.log('');
  }

  console.log('─── Próximos pasos recomendados ────────────────────────────────');
  const failures = summary.filter(s => s.result !== 'PORTADA OK');
  if (failures.length === 0) {
    console.log('  ✅ Todos los scrapers funcionan correctamente.');
    console.log('     Verificar la lógica de activación de RSS Fallback en rssService.ts.');
  } else {
    failures.forEach(s => {
      if (s.portadaCount === 0) {
        console.log(`  🔴 ${s.label}: Selectores CSS no encuentran nada → revisar clases CSS actuales del sitio.`);
      } else {
        console.log(`  🟡 ${s.label}: Solo ${s.portadaCount} noticia(s) → agregar selectores de backup.`);
      }
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
