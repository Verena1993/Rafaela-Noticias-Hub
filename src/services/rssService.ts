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
        lastChecked: new Date().toISOString(),
        connectionType: feed.connectionType,
        responseTimeMs: 0
      };

      if (feed.connectionType === 'pending') {
        diag.message = 'Pendiente de configuración';
        return { items: [], diag };
      }

      const feedItems: NewsRadarItem[] = [];

      try {
        let fetchPromise = supabaseRadarGateway.fetchFromSupabaseGateway(feed.url, feed.connectionType);
        
        const timeoutPromise = new Promise<{ data: any; methodUsed: ConnectionType | string; responseTimeMs: number }>((_, reject) => {
          setTimeout(() => reject(new Error("Tiempo límite excedido para este feed (15s)")), 15000);
        });

        let fetchResult;
        try {
          fetchResult = await Promise.race([fetchPromise, timeoutPromise]);
        } catch (firstErr: any) {
          if (feed.id === 'laopinion') {
            console.log("Diario La Opinión RSS falló, intentando fallback de scraping HTML...");
            fetchResult = await supabaseRadarGateway.fetchFromSupabaseGateway('https://www.diariolaopinion.com.ar/', 'html_scraping');
          } else {
            throw firstErr;
          }
        }

        let data = fetchResult.data;
        let methodUsed = fetchResult.methodUsed;
        let responseTimeMs = fetchResult.responseTimeMs;

        if (feed.id === 'laopinion' && (!data || !data.items || data.items.length === 0)) {
          console.log("Diario La Opinión RSS no retornó items, intentando fallback de scraping HTML...");
          const fallbackResult = await supabaseRadarGateway.fetchFromSupabaseGateway('https://www.diariolaopinion.com.ar/', 'html_scraping');
          data = fallbackResult.data;
          methodUsed = fallbackResult.methodUsed;
          responseTimeMs = fallbackResult.responseTimeMs;
        }
        
        diag.connectionType = methodUsed as ConnectionType;
        diag.responseTimeMs = responseTimeMs;
        let addedItems = 0;
        
        if (data && data.items && Array.isArray(data.items)) {
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
          }[] = [];

          const detectedAt = new Date().toISOString();

          data.items.forEach((item: any) => {
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

            const parsedDate = new Date(rawDate);
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
              detectedAt
            });
          });

          // Prioritize featured/portada/principales news, then fall back to chronological
          scoredItems.sort((a, b) => {
            const testStrA = (a.item.title || '') + ' ' + (a.item.description || '') + ' ' + (a.item.link || '') + ' ' + (a.item.categories?.join(' ') || '');
            const testStrB = (b.item.title || '') + ' ' + (b.item.description || '') + ' ' + (b.item.link || '') + ' ' + (b.item.categories?.join(' ') || '');
            const isFeaturedA = /portada|destacad|principal/i.test(testStrA);
            const isFeaturedB = /portada|destacad|principal/i.test(testStrB);
            
            if (isFeaturedA && !isFeaturedB) return -1;
            if (!isFeaturedA && isFeaturedB) return 1;
            
            return b.parsedDate.getTime() - a.parsedDate.getTime();
          });

          // Select top 3 most recent and log them
          const selected = scoredItems.slice(0, 3);
          const discarded = scoredItems.slice(3);

          selected.forEach(x => {
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
        }
        
        diag.itemCount = addedItems;
      } catch (error: any) {
        diag.status = 'ERROR';
        diag.message = error.message || 'No se pudo conectar';
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
