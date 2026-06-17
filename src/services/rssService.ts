import { RSS_FEEDS } from '../config/rssFeeds';
import { EDITORIAL_SOURCES } from '../config/editorialSources';
import type { NewsRadarItem, RssDiagnostic, RadarCategory, ConnectionType } from '../types';

import { supabaseRadarGateway } from './supabaseRadarGateway';

export const getDomainFromUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
};

export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const hasExactWordMatch = (text: string, keywords: string[]): boolean => {
  const cleanText = removeAccents(text).toLowerCase();
  return keywords.some(kw => {
    const cleanKw = removeAccents(kw).toLowerCase();
    const escapedKw = cleanKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
    return regex.test(cleanText);
  });
};

export const isSimilarTitle = (title1: string, title2: string): boolean => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
  const words1 = normalize(title1);
  const words2 = normalize(title2);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length >= 3; 
};

export const calculateEditorialScore = (
  title: string, 
  summary: string, 
  category: RadarCategory, 
  _source: string
): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  const text = `${title} ${summary}`;

  const hasMatch = (keywords: string[]) => hasExactWordMatch(text, keywords);

  // 1. Keyword Prioritization
  const maxKeywords = [
    'accidente', 'choque', 'colisión', 'colision', 'vuelco', 'falleció', 'fallecio', 
    'murió', 'murio', 'muerte', 'asesinato', 'homicidio', 'allanamiento', 'detenido', 
    'prisión', 'prision', 'robo', 'asalto', 'incendio', 'explosión', 'explosion', 
    'emergencia', 'búsqueda', 'busqueda', 'desaparecido', 'rescate', 'inundación', 
    'inundacion', 'temporal', 'catástrofe', 'catastrofe', 'evacuación', 'evacuacion', 'crisis'
  ];

  const highKeywords = [
    'economía', 'economia', 'inflación', 'inflacion', 'salud', 'educación', 'educacion', 
    'seguridad', 'justicia', 'servicios', 'paro', 'corte', 'energía', 'energia', 
    'gas', 'agua', 'transporte'
  ];

  const lowKeywords = [
    'deportes', 'deporte', 'fútbol', 'futbol', 'tenis', 'automovilismo', 'espectáculos', 
    'espectaculo', 'celebridades', 'celebridad', 'show', 'cine', 'televisión', 'television', 
    'streaming', 'moda', 'curiosidades', 'curiosidad', 'viral', 'redes sociales'
  ];

  if (hasMatch(maxKeywords)) {
    score += 20;
    reasons.push('+20: Temas de prioridad máxima');
  } else if (hasMatch(highKeywords)) {
    score += 10;
    reasons.push('+10: Temas de prioridad alta');
  }

  if (hasMatch(lowKeywords)) {
    score -= 15;
    reasons.push('-15: Temas de prioridad baja');
  }

  // 2. Geographic Prioritization based on static category
  if (category === 'local') {
    score += 30;
    reasons.push('+30: Cobertura principal local');
  } else if (category === 'regional') {
    score += 20;
    reasons.push('+20: Cobertura regional');
  } else if (category === 'provincial') {
    score += 15;
    reasons.push('+15: Cobertura provincial');
  } else if (category === 'national') {
    score += 5;
    reasons.push('+5: Cobertura nacional');
  } else if (category === 'international') {
    score -= 20;
    reasons.push('-20: Cobertura internacional');
  }

  return { score, reasons };
};

export const classifyAlert = (title: string, summary: string, category: RadarCategory): 'critical' | 'urgent' | 'high' | 'medium' | 'normal' | null => {
  const text = `${title} ${summary}`;
  const hasWord = (kws: string[]) => hasExactWordMatch(text, kws);

  // ── ALWAYS EXCLUDED ─────────────────────────────────────────────────────
  const NEVER_ALERT = [
    'deportes', 'deporte', 'fútbol', 'futbol', 'tenis', 'automovilismo',
    'espectáculos', 'espectaculos', 'farándula', 'farandula',
    'opinión', 'opinion', 'columna', 'columnas', 'análisis', 'analisis',
    'entrevista', 'entrevistas', 'ranking', 'viral',
    'turismo', 'cultura', 'cine', 'televisión', 'television', 'streaming',
    'moda', 'curiosidades', 'celebridades', 'instagram', 'tiktok',
    'twitter', 'facebook', 'inflación', 'inflacion', 'tarifas', 'precios',
    'economía', 'economia', 'dólar', 'dolar', 'aumento de precios',
    'historia', 'histórico', 'historico', 'efeméride', 'efemeride',
    'migración', 'migracion', 'turista', 'turistas'
  ];
  if (hasWord(NEVER_ALERT)) return null;

  const EMERGENCY_CRITICAL = [
    'incendio', 'explosión', 'explosion', 'homicidio', 'femicidio',
    'asesinato', 'mataron', 'tiroteo', 'balacera', 'secuestro',
    'allanamiento', 'desaparición de persona', 'desaparicion de persona',
    'búsqueda de menor', 'busqueda de menor', 'amenaza de bomba',
    'emergencia policial', 'emergencia sanitaria', 'evacuación masiva', 'evacuacion masiva',
    'derrumbe', 'temporal severo', 'inundación', 'inundacion',
    'accidente fatal', 'choque fatal', 'falleció', 'fallecio',
    'víctima fatal', 'victima fatal', 'cuerpo sin vida', 'policía asesinado', 'policia asesinado'
  ];

  const EMERGENCY_URGENT = [
    'accidente grave', 'choque grave', 'choque múltiple', 'choque multiple',
    'incendio importante', 'heridos graves', 'entradera violenta',
    'robo a mano armada', 'robo violento', 'emergencia climática', 'emergencia climatica',
    'corte total de ruta', 'corte masivo', 'búsqueda', 'busqueda', 'evacuación', 'evacuacion'
  ];

  if (category === 'local' || category === 'regional') {
    if (hasWord(EMERGENCY_CRITICAL)) return 'critical';
    if (hasWord(EMERGENCY_URGENT)) return 'urgent';
    return null;
  }

  if (category === 'provincial') {
    const PROVINCIAL_CRITICAL = [
      'homicidio', 'femicidio', 'asesinato', 'mataron', 'tiroteo', 'balacera',
      'policía asesinado', 'policia asesinado', 'tragedia', 'catástrofe', 'catastrofe',
      'accidente fatal', 'desastre', 'enfrentamiento armado', 'secuestro',
      'incendio con víctimas', 'incendio con victimas', 'explosión', 'explosion'
    ];
    if (hasWord(PROVINCIAL_CRITICAL)) return 'critical';
    const PROVINCIAL_HIGH = [
      'emergencia provincial', 'inundación severa', 'inundacion severa',
      'temporal severo', 'evacuación masiva', 'evacuacion masiva',
      'accidente grave múltiple', 'varias víctimas', 'varias victimas'
    ];
    if (hasWord(PROVINCIAL_HIGH)) return 'high';
    return 'normal';
  }

  if (category === 'national') {
    const NATIONAL_CRITICAL = [
      'atentado', 'tragedia masiva', 'accidente masivo', 'crisis institucional',
      'catástrofe nacional', 'catastrofe nacional', 'golpe de estado',
      'muerte de presidente', 'estado de sitio', 'intervención federal',
      'accidente con múltiples víctimas', 'accidente con multiples victimas',
      'desastre nacional', 'emergencia nacional'
    ];
    if (hasWord(NATIONAL_CRITICAL)) return 'critical';
    return 'normal';
  }

  if (category === 'international') {
    const INTL_CRITICAL = [
      'guerra', 'invasión', 'invasion', 'atentado masivo', 'terrorismo',
      'terremoto', 'sismo devastador', 'tsunami', 'huracán', 'huracan',
      'catástrofe mundial', 'catastrofe mundial',
      'accidente aéreo masivo', 'accidente aereo masivo',
      'pandemia', 'epidemia global',
      'muerte de jefe de estado', 'muerte de presidente',
      'golpe de estado'
    ];
    if (hasWord(INTL_CRITICAL)) return 'critical';
    return 'normal';
  }

  return 'normal';
};

export const detectTrueCategory = (
  _title: string, 
  _summary: string, 
  source: string, 
  defaultCategory: RadarCategory,
  itemUrl?: string
): { category: RadarCategory; reason: string; priority: number; region: string } => {
  if (itemUrl) {
    const domain = getDomainFromUrl(itemUrl);
    const matched = EDITORIAL_SOURCES.find(s => domain === s.domain || domain.endsWith('.' + s.domain));
    if (matched) {
      const reason = 'Fuente configurada manualmente';
      console.log(`[MANUAL] Fuente configurada manualmente: "${matched.name}" (Dominio: "${domain}") | Territorio: ${matched.category}`);
      return { 
        category: matched.category, 
        reason,
        priority: matched.priority,
        region: matched.region
      };
    }
  }

  const finalCategory = defaultCategory || 'national';
  const reason = `Clasificación fija por defaultCategory de la fuente (${source})`;
  console.log(`[MANUAL - FALLBACK] Fuente: "${source}" | Territorio: ${finalCategory}`);
  
  const region = finalCategory;
  const priority = finalCategory === 'local' ? 100 : finalCategory === 'regional' ? 80 : finalCategory === 'provincial' ? 50 : finalCategory === 'national' ? 30 : 10;

  return { 
    category: finalCategory, 
    reason,
    priority,
    region
  };
};

export const isValidJournalisticArticle = (item: any): boolean => {
  const title = (item.title || '').trim();
  const url = (item.link || item.url || '').trim();

  // 1. Título periodístico válido
  if (!title || title.length < 10) {
    return false;
  }

  // Nunca usar una URL como título
  if (/^(https?:\/\/|www\.)/i.test(title)) {
    return false;
  }

  // Descartar títulos puramente numéricos o genéricos/de navegación
  if (/^\d+$/.test(title)) {
    return false;
  }

  const genericTitles = [
    'home', 'inicio', 'portada', 'contacto', 'about us', 'sobre nosotros', 
    'sin titulo', 'no title', 'error', '404', 'rss feed', 'suscripción', 'suscripcion',
    'ingresar', 'login', 'register', 'registrarse'
  ];
  if (genericTitles.includes(title.toLowerCase())) {
    return false;
  }

  // Títulos que contienen prefijos de taxonomías
  if (
    title.startsWith('Categoría:') || 
    title.startsWith('Etiqueta:') || 
    title.startsWith('Archivo:') || 
    title.startsWith('Tag:') ||
    title.startsWith('Category:')
  ) {
    return false;
  }

  // 2. URLs inválidas (páginas de archivo, categorías, etiquetas, legales, admin, rss)
  if (url) {
    const invalidUrlPatterns = [
      /\/category\//i, /\/tag\//i, /\/author\//i, /\/archivo\//i,
      /\/contacto/i, /\/about/i, /\/sobre-nosotros/i, /\/politica-de-privacidad/i,
      /\/terms/i, /\/condiciones/i, /\/wp-admin/i, /\/wp-content/i,
      /page\/\d+/i, /\?cat=\d+/i, /\?author=\d+/i, /\?p=\d+/i,
      /\/search\?/i, /\.xml$/i, /\/feed$/i, /\/rss$/i
    ];
    if (invalidUrlPatterns.some(pattern => pattern.test(url))) {
      return false;
    }
  }

  return true;
};

export const parseRobustDate = (rawDate: string, connectionType?: ConnectionType): Date => {
  if (!rawDate) return new Date();
  
  let dateStr = rawDate.trim();

  // 1. Handle rss2json date format: "YYYY-MM-DD HH:mm:ss" or similar space-separated formats from proxy
  if (connectionType === 'rss2json_proxy' || connectionType === 'google_news') {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      // rss2json returns UTC dates but drops the timezone suffix. Append 'Z' to treat as UTC.
      return new Date(dateStr + ' Z');
    }
  }

  // 2. Check if the string has a timezone indicator.
  // Timezone indicators: 'Z', 'GMT', 'UTC', '+XX:XX', '-XX:XX', '+XXXX', '-XXXX'
  const hasTimezone = /Z|GMT|UTC|[+-]\d{2}:?\d{2}$/i.test(dateStr);

  if (!hasTimezone) {
    // If it has no timezone, and it's a local/regional/provincial feed, it's Argentine time (UTC-3).
    // Append '-03:00' to it.
    if (/T\d{2}:\d{2}/.test(dateStr) || /\s\d{2}:\d{2}/.test(dateStr)) {
      return new Date(dateStr + '-03:00');
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  return d;
};

export const rssService = {
  fetchNews: async (): Promise<{ items: NewsRadarItem[]; alerts: { title: string; severity: 'critical' | 'urgent' | 'high' | 'medium' | 'normal'; sourceName?: string; sourceUrl?: string; publishedAt?: string; category?: string; region?: string; classificationReason?: string; priority?: number }[]; diagnostics: RssDiagnostic[] }> => {
    const allItems: NewsRadarItem[] = [];
    const alerts: { title: string; severity: 'critical' | 'urgent' | 'high' | 'medium' | 'normal'; sourceName?: string; sourceUrl?: string; publishedAt?: string; category?: string; region?: string; classificationReason?: string; priority?: number }[] = [];
    const diagnostics: RssDiagnostic[] = [];

    const promises = RSS_FEEDS.map(async (feed) => {
      const diag: RssDiagnostic = {
        id: feed.id,
        name: feed.name,
        url: feed.url || 'URL NO CONFIGURADA',
        status: feed.connectionType === 'pending' ? 'PENDING' : 'OK',
        itemCount: 0,
        reason: feed.connectionType === 'pending' ? 'Pendiente' : undefined,
        lastChecked: new Date().toISOString(),
        connectionType: feed.connectionType,
        responseTimeMs: 0
      };

      if (feed.connectionType === 'pending') {
        diag.message = 'Pendiente de configuración';
        diag.reason = 'Pendiente';
        return { items: [], diag };
      }

      const feedItems: NewsRadarItem[] = [];

      try {
        let coverItems: any[] = [];
        let fallbackItems: any[] = [];
        let coverError: any = null;
        let coverStatus = 'OK';
        let methodUsed: ConnectionType = feed.connectionType;
        let responseTimeMs = 0;

        if (feed.connectionType === 'html_scraping') {
          try {
            const fetchResult = await supabaseRadarGateway.fetchFromSupabaseGateway(feed.url, 'html_scraping');
            responseTimeMs = fetchResult.responseTimeMs;
            methodUsed = fetchResult.methodUsed as ConnectionType;
            if (fetchResult.data && Array.isArray(fetchResult.data.items)) {
              coverItems = fetchResult.data.items;
            }
          } catch (err: any) {
            coverError = err;
            coverStatus = 'ERROR';
          }
        }

        // Fetch fallback RSS if we need more items
        if ((coverItems.length < 3 || coverStatus === 'ERROR') && feed.rssFallbackUrl) {
          try {
            const fallbackType = feed.rssFallbackUrl.includes('google.com') ? 'google_news' : 'rss2json_proxy';
            const fetchResult = await supabaseRadarGateway.fetchFromSupabaseGateway(feed.rssFallbackUrl, fallbackType);
            if (coverItems.length === 0) {
              methodUsed = fetchResult.methodUsed as ConnectionType;
              responseTimeMs = fetchResult.responseTimeMs;
            } else {
              responseTimeMs += fetchResult.responseTimeMs;
            }
            if (fetchResult.data && Array.isArray(fetchResult.data.items)) {
              fallbackItems = fetchResult.data.items;
            }
          } catch (errFallback: any) {
            if (coverItems.length === 0 && coverStatus === 'ERROR') {
              throw coverError || errFallback;
            }
          }
        } else if (coverStatus === 'ERROR') {
          throw coverError;
        }

        // For non-scraping channels (like standard national RSS)
        if (feed.connectionType !== 'html_scraping') {
          const fetchResult = await supabaseRadarGateway.fetchFromSupabaseGateway(feed.url, feed.connectionType);
          methodUsed = fetchResult.methodUsed as ConnectionType;
          responseTimeMs = fetchResult.responseTimeMs;
          if (fetchResult.data && Array.isArray(fetchResult.data.items)) {
            coverItems = fetchResult.data.items;
          }
        }

        diag.connectionType = methodUsed as ConnectionType;
        diag.responseTimeMs = responseTimeMs;
        let addedItems = 0;

        // Deduplicate and combine
        const combinedRawItems: { item: any; sourceTag: 'portada' | 'rss' }[] = [];

        coverItems.forEach(item => {
          combinedRawItems.push({ item, sourceTag: 'portada' });
        });

        fallbackItems.forEach(item => {
          const isDuplicate = coverItems.some(coverItem => {
            const sameUrl = (coverItem.link && item.link && coverItem.link.trim() === item.link.trim());
            const sameTitle = isSimilarTitle(coverItem.title || '', item.title || '');
            return sameUrl || sameTitle;
          });

          if (!isDuplicate) {
            combinedRawItems.push({ item, sourceTag: 'rss' });
          }
        });

        if (combinedRawItems.length > 0) {
          const scoredItems: {
            item: any;
            cleanSummary: string;
            parsedDate: Date;
            smartCategory: RadarCategory;
            regionDetectada: string;
            editorialScore: number;
            reasons: string[];
            classificationReason: string;
            priority: number;
            detectedAt: string;
            sourceTag: 'portada' | 'rss';
          }[] = [];

          const detectedAt = new Date().toISOString();

          combinedRawItems.forEach(({ item, sourceTag }) => {
            if (!isValidJournalisticArticle(item)) {
              console.log(`[DESCARTADA: Artículo inválido] ${item.title || 'Sin título'} | ${feed.name}`);
              return;
            }

            const cleanSummary = (item.description || item.content || '').replace(/<[^>]+>/g, '').trim();
            
            // Validate date
            const rawDate = item.pubDate || item.date;
            if (!rawDate) {
              console.log(`[DESCARTADA: Sin fecha] ${item.title} | ${feed.name}`);
              return;
            }

            const parsedDate = parseRobustDate(rawDate, feed.connectionType);
            if (isNaN(parsedDate.getTime())) {
              console.log(`[DESCARTADA: Fecha inválida] ${item.title} | ${feed.name} | fecha: ${rawDate}`);
              return;
            }

            const now = new Date();
            const diffMs = parsedDate.getTime() - now.getTime();
            if (diffMs > 24 * 60 * 60 * 1000) {
              console.log(`[DESCARTADA: Fecha futura >24hs] ${item.title} | ${feed.name}`);
              return;
            }

            // Category is ALWAYS the feed's fixed defaultCategory — no content-based reclassification
            const smartCategory: RadarCategory = feed.defaultCategory;
            const priorityVal = smartCategory === 'local' ? 100
              : smartCategory === 'regional' ? 80
              : smartCategory === 'provincial' ? 50
              : smartCategory === 'national' ? 30 : 10;

            // Score is kept only for logging, does NOT affect selection
            const { score, reasons } = calculateEditorialScore(item.title, cleanSummary, smartCategory, feed.name);

            // Chronological safety guard: detectedAt can never be before parsedDate
            let itemDetectedAt = detectedAt;
            if (parsedDate.getTime() > new Date(detectedAt).getTime()) {
              itemDetectedAt = parsedDate.toISOString();
            }

            scoredItems.push({
              item,
              cleanSummary,
              parsedDate,
              smartCategory,
              regionDetectada: smartCategory,
              editorialScore: score,
              reasons,
              classificationReason: `Categoría fija del medio: ${feed.defaultCategory}`,
              priority: priorityVal,
              detectedAt: itemDetectedAt,
              sourceTag
            });
          });

          // Custom sorting: Portada HTML items first preserving original order, then RSS chronologically
          scoredItems.sort((a, b) => {
            if (a.sourceTag === 'portada' && b.sourceTag === 'rss') return -1;
            if (a.sourceTag === 'rss' && b.sourceTag === 'portada') return 1;

            if (a.sourceTag === 'portada') {
              return combinedRawItems.findIndex(x => x.item.link === a.item.link) - 
                     combinedRawItems.findIndex(x => x.item.link === b.item.link);
            } else {
              return b.parsedDate.getTime() - a.parsedDate.getTime();
            }
          });

          // Select top 3 most recent and log them
          const selected = scoredItems.slice(0, 3);
          const discarded = scoredItems.slice(3);

          let portadaCount = 0;
          let rssCount = 0;

          selected.forEach(x => {
            if (x.sourceTag === 'portada') {
              portadaCount++;
            } else {
              rssCount++;
            }

            console.log({
              titulo: x.item.title,
              fuente: feed.name,
              fecha: x.item.pubDate || x.item.date,
              categoria: x.smartCategory,
              region: x.regionDetectada || 'Ninguna',
              editorialScore: x.editorialScore,
              motivoClasificacion: `SELECCIONADA (Top 3 del medio). Detalles: ${x.reasons.join(', ')}`
            });

            let cleanTitle = x.item.title;
            if (feed.id === 'rafaelainforma') {
              cleanTitle = cleanTitle.replace(/\s*-\s*Rafaela\s*Informa$/i, '').trim();
            }

            // Process alerts (only for selected news)
            const classification = classifyAlert(cleanTitle, x.cleanSummary, x.smartCategory);
            if (classification) {
              alerts.push({
                title: cleanTitle,
                severity: classification,
                sourceName: feed.name,
                sourceUrl: x.item.link || '',
                publishedAt: x.parsedDate.toISOString(),
                category: x.smartCategory,
                region: x.regionDetectada || undefined,
                classificationReason: x.classificationReason,
                priority: x.priority
              });
            }

            feedItems.push({
              id: `rss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: cleanTitle,
              summary: x.cleanSummary ? (x.cleanSummary.length > 200 ? x.cleanSummary.substring(0, 200) + '...' : x.cleanSummary) : '',
              source: feed.name,
              date: x.parsedDate.toISOString(),
              detectedAt: x.detectedAt,
              category: x.smartCategory,
              editorialScore: x.editorialScore,
              url: x.item.link,
              region: x.regionDetectada,
              priority: x.priority
            });
            addedItems++;
          });

          discarded.forEach(x => {
            console.log({
              titulo: x.item.title,
              fuente: feed.name,
              fecha: x.item.pubDate || x.item.date,
              categoria: x.smartCategory,
              region: x.regionDetectada || 'Ninguna',
              editorialScore: x.editorialScore,
              motivoClasificacion: `DESCARTADA (Superada por otros 3 del medio). Detalles: ${x.reasons.join(', ')}`
            });
          });

          if (addedItems > 0) {
            if (feed.connectionType === 'html_scraping') {
              let reasonStr = '';
              if (portadaCount > 0 && rssCount > 0) {
                reasonStr = `Portada HTML (${portadaCount}) + RSS Fallback (${rssCount})`;
              } else if (portadaCount > 0) {
                reasonStr = `Portada HTML (${portadaCount})`;
              } else {
                reasonStr = `RSS Fallback (${rssCount})`;
              }
              diag.reason = reasonStr;
            } else {
              diag.reason = 'Activa';
            }
          } else {
            diag.reason = feed.connectionType === 'html_scraping' ? 'Selector HTML inválido' : 'RSS vacío';
          }
        } else {
          diag.reason = feed.connectionType === 'html_scraping' ? 'Selector HTML inválido' : 'RSS vacío';
        }
        
        diag.itemCount = addedItems;
      } catch (error: any) {
        diag.status = 'ERROR';
        diag.message = error.message || 'No se pudo conectar';
        
        const errMsg = (error.message || '').toLowerCase();
        if (errMsg.includes('403') || errMsg.includes('cloudflare') || errMsg.includes('forbidden') || errMsg.includes('just a moment')) {
          diag.reason = '403 Cloudflare';
        } else if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('feed inexistente')) {
          diag.reason = '404 Feed inexistente';
        } else if (errMsg.includes('timeout') || errMsg.includes('tiempo límite') || errMsg.includes('aborted') || errMsg.includes('exceeded')) {
          diag.reason = 'Timeout';
        } else if (errMsg.includes('selector') || errMsg.includes('html inválido')) {
          diag.reason = 'Selector HTML inválido';
        } else if (errMsg.includes('parsing') || errMsg.includes('xml') || errMsg.includes('json') || errMsg.includes('rss vacío')) {
          diag.reason = 'Error de parsing';
        } else {
          diag.reason = error.message || 'Error desconocido';
        }
      }

      return { items: feedItems, diag };
    });

    const results = await Promise.all(promises);

    for (const result of results) {
      diagnostics.push(result.diag);
      for (const item of result.items) {
        if (!allItems.some(existing => isSimilarTitle(existing.title, item.title))) {
          allItems.push(item);
        }
      }
    }

    return { items: allItems, alerts, diagnostics };
  }
};
