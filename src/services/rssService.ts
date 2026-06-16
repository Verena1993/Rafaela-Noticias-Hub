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
        const fetchPromise = supabaseRadarGateway.fetchFromSupabaseGateway(feed.url, feed.connectionType);
        
        const timeoutPromise = new Promise<{ data: any; methodUsed: ConnectionType | string; responseTimeMs: number }>((_, reject) => {
          setTimeout(() => reject(new Error("Tiempo límite excedido para este feed (8s)")), 8000);
        });

        const { data, methodUsed, responseTimeMs } = await Promise.race([fetchPromise, timeoutPromise]);
        
        diag.connectionType = methodUsed as ConnectionType;
        diag.responseTimeMs = responseTimeMs;
        let addedItems = 0;
        
        if (data && data.items && Array.isArray(data.items)) {
          const scoredItems: {
            item: any;
            cleanSummary: string;
            parsedDate: Date;
            smartCategory: RadarCategory;
            regionDetectada: string | null;
            editorialScore: number;
            reasons: string[];
            classificationReason: string;
            priority?: number;
          }[] = [];

          data.items.forEach((item: any) => {
            const cleanSummary = (item.description || item.content || '').replace(/<[^>]+>/g, '').trim();
            
            // Validate date
            const rawDate = item.pubDate || item.date;
            if (!rawDate) {
              console.log({
                titulo: item.title,
                fuente: feed.name,
                fecha: 'Ninguna',
                categoria: 'n/a',
                region: 'n/a',
                editorialScore: 0,
                motivoClasificacion: 'Descartada: Sin fecha'
              });
              return;
            }

            const parsedDate = new Date(rawDate);
            if (isNaN(parsedDate.getTime())) {
              console.log({
                titulo: item.title,
                fuente: feed.name,
                fecha: rawDate,
                categoria: 'n/a',
                region: 'n/a',
                editorialScore: 0,
                motivoClasificacion: 'Descartada: Fecha inválida'
              });
              return;
            }

            const now = new Date();
            const diffMs = parsedDate.getTime() - now.getTime();
            if (diffMs > 24 * 60 * 60 * 1000) {
              console.log({
                titulo: item.title,
                fuente: feed.name,
                fecha: rawDate,
                categoria: 'n/a',
                region: 'n/a',
                editorialScore: 0,
                motivoClasificacion: 'Descartada: Fecha futura > 24hs'
              });
              return;
            }

            const { category: smartCategory, reason: classificationReason, priority: priorityVal, region: regionDetectada } = detectTrueCategory(item.title, cleanSummary, feed.name, feed.defaultCategory, item.link);
            
            // Calculate score and reasons
            const { score, reasons } = calculateEditorialScore(item.title, cleanSummary, smartCategory, feed.name);

            scoredItems.push({
              item,
              cleanSummary,
              parsedDate,
              smartCategory,
              regionDetectada,
              editorialScore: score,
              reasons,
              classificationReason,
              priority: priorityVal
            });
          });

          // Sort scoredItems by editorialScore descending
          scoredItems.sort((a, b) => b.editorialScore - a.editorialScore);

          // Select top 3 and log them
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

            // Process alerts (only for selected news)
            const classification = classifyAlert(x.item.title, x.cleanSummary, x.smartCategory);
            if (classification) {
              alerts.push({
                title: x.item.title,
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
              title: x.item.title,
              summary: x.cleanSummary.substring(0, 200) + '...',
              source: feed.name,
              date: x.parsedDate.toISOString(),
              category: x.smartCategory,
              editorialScore: x.editorialScore,
              url: x.item.link,
              region: x.regionDetectada || undefined,
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
