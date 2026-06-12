import { RSS_FEEDS } from '../config/rssFeeds';
import type { NewsRadarItem, RssDiagnostic, RadarCategory, ConnectionType } from '../types';

import { supabaseRadarGateway } from './supabaseRadarGateway';

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

const FOREIGN_KEYWORDS = [
  'españa', 'espana', 'méxico', 'mexico', 'brasil', 'brazil', 'chile', 'uruguay', 
  'paraguay', 'bolivia', 'perú', 'peru', 'colombia', 'estados unidos', 'ee.uu.', 'eeuu', 'ee uu', 
  'francia', 'italia', 'alemania', 'reino unido', 'china', 'japon', 'japón', 'venezuela', 
  'ecuador', 'canadá', 'canada', 'portugal', 'rusia', 'ucrania', 'india', 'bangladesh',
  'israel', 'palestina', 'gaza', 'irán', 'iran', 'irak', 'siria', 'turquía', 'turquia', 
  'egipto', 'australia', 'reino de caceres', 'cáceres', 'caceres', 'badajoz', 'madrid', 
  'barcelona', 'roma', 'parís', 'paris', 'londres', 'nueva york', 'tokio', 'washington', 
  'pekín', 'pekin', 'moscú', 'moscu', 'cuba', 'honduras', 'guatemala', 'el salvador', 
  'nicaragua', 'costa rica', 'panamá', 'panama', 'marruecos', 'sudáfrica', 'sudafrica', 
  'suiza', 'suecia', 'noruega', 'finlandia', 'dinamarca', 'grecia', 'bélgica', 'belgica', 
  'holanda', 'países bajos', 'paises bajos', 'vaticano', 'austria', 'polonia'
];

const LOCAL_KEYWORDS = [
  'rafaela', 'san cristóbal', 'san cristobal', 'sunchales', 'esperanza', 'susana', 
  'lehmann', 'ataliva', 'tacural', 'ramona', 'humberto primo', 'humberto', 'bella italia', 
  'san vicente', 'frontera', 'josefina', 'virginia', 'pilar', 'aurelia', 
  'santa clara de saguier', 'santa clara', 'angélica', 'angelica', 'clucellas', 
  'plaza clucellas', 'maría juana', 'maria juana', 'egusquiza', 'presidente roca', 
  'vila', 'zenón pereyra', 'zenon pereyra', 'colonia aldao', 'arrufó', 'arrufo', 
  'ceres', 'hersilia', 'suardi', 'san guillermo', 'monigotes', 'palacios', 
  'moisés ville', 'moises ville'
];

const PROVINCIAL_KEYWORDS = [
  'santa fe', 'rosario', 'reconquista', 'venado tuerto', 'san lorenzo', 'casilda', 'san justo'
];

export const isSimilarTitle = (title1: string, title2: string): boolean => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
  const words1 = normalize(title1);
  const words2 = normalize(title2);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length >= 3; 
};

import { getSourceRegion } from '../config/newsSourceRegions';

export const detectExplicitLocality = (title: string, summary: string): string | null => {
  const combinedText = `${title} ${summary}`;
  
  // Exclude foreign countries/localities immediately
  if (hasExactWordMatch(combinedText, FOREIGN_KEYWORDS)) {
    return null;
  }

  const cleanText = removeAccents(combinedText).toLowerCase();
  
  // Use the same LOCAL_KEYWORDS list to check for specific localities
  // We can order it by length descending to match longer multi-word names first
  const localities = [
    { key: 'santa clara de saguier', label: 'Santa Clara de Saguier' },
    { key: 'santa clara', label: 'Santa Clara de Saguier' },
    { key: 'humberto primo', label: 'Humberto Primo' },
    { key: 'humberto', label: 'Humberto Primo' },
    { key: 'bella italia', label: 'Bella Italia' },
    { key: 'san cristóbal', label: 'San Cristóbal' },
    { key: 'san cristobal', label: 'San Cristóbal' },
    { key: 'san vicente', label: 'San Vicente' },
    { key: 'presidente roca', label: 'Presidente Roca' },
    { key: 'zenón pereyra', label: 'Zenón Pereyra' },
    { key: 'zenon pereyra', label: 'Zenón Pereyra' },
    { key: 'colonia aldao', label: 'Colonia Aldao' },
    { key: 'san guillermo', label: 'San Guillermo' },
    { key: 'moisés ville', label: 'Moisés Ville' },
    { key: 'moises ville', label: 'Moisés Ville' },
    { key: 'rafaela', label: 'Rafaela' },
    { key: 'sunchales', label: 'Sunchales' },
    { key: 'esperanza', label: 'Esperanza' },
    { key: 'susana', label: 'Susana' },
    { key: 'lehmann', label: 'Lehmann' },
    { key: 'ataliva', label: 'Ataliva' },
    { key: 'tacural', label: 'Tacural' },
    { key: 'ramona', label: 'Ramona' },
    { key: 'virginia', label: 'Virginia' },
    { key: 'pilar', label: 'Pilar' },
    { key: 'aurelia', label: 'Aurelia' },
    { key: 'angélica', label: 'Angélica' },
    { key: 'angelica', label: 'Angélica' },
    { key: 'clucellas', label: 'Plaza Clucellas' },
    { key: 'maría juana', label: 'María Juana' },
    { key: 'maria juana', label: 'María Juana' },
    { key: 'egusquiza', label: 'Egusquiza' },
    { key: 'vila', label: 'Vila' },
    { key: 'arrufó', label: 'Arrufó' },
    { key: 'arrufo', label: 'Arrufó' },
    { key: 'ceres', label: 'Ceres' },
    { key: 'hersilia', label: 'Hersilia' },
    { key: 'suardi', label: 'Suardi' },
    { key: 'monigotes', label: 'Monigotes' },
    { key: 'palacios', label: 'Palacios' }
  ];

  for (const loc of localities) {
    const cleanKey = removeAccents(loc.key).toLowerCase();
    const escapedKey = cleanKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
    if (regex.test(cleanText)) {
      return loc.label;
    }
  }
  return null;
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

  // 2. Geographic Prioritization
  if (hasMatch(LOCAL_KEYWORDS)) {
    score += 30;
    reasons.push('+30: Cobertura principal local/regional');
  } else if (hasMatch(PROVINCIAL_KEYWORDS)) {
    score += 15;
    reasons.push('+15: Cobertura provincial');
  } else if (category === 'national') {
    score += 5;
    reasons.push('+5: Cobertura nacional');
  } else if (category === 'international') {
    score -= 20;
    reasons.push('-20: Cobertura internacional');
  }

  // 3. International News Filter
  if (category === 'international') {
    const extraordinaryKeywords = [
      'guerra', 'invasión', 'invasion', 'ataque', 'misil', 'misiles', 'terrorismo', 
      'atentado', 'terremoto', 'sismo', 'tsunami', 'pandemia', 'epidemia', 
      'catástrofe', 'catastrofe', 'accidente aéreo', 'accidente aereo', 
      'accidente ferroviario', 'explosión masiva', 'explosion masiva', 
      'golpe de estado', 'muerte de líder', 'muerte de lider'
    ];

    if (!hasMatch(extraordinaryKeywords)) {
      score -= 100;
      reasons.push('-100: Noticia internacional común sin relevancia extraordinaria');
    } else {
      reasons.push('Noticia internacional con relevancia extraordinaria');
    }
  }

  return { score, reasons };
};

export const classifyAlert = (title: string, summary: string, category: RadarCategory): 'critical' | 'high' | null => {
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

  // ── EMERGENCY KEYWORDS (shared across levels) ────────────────────────────
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
  const EMERGENCY_HIGH = [
    'accidente grave', 'choque grave', 'choque múltiple', 'choque multiple',
    'incendio importante', 'heridos graves', 'entradera violenta',
    'robo a mano armada', 'robo violento', 'emergencia climática', 'emergencia climatica',
    'corte total de ruta', 'corte masivo', 'búsqueda', 'busqueda', 'evacuación', 'evacuacion'
  ];

  // ── LOCAL ────────────────────────────────────────────────────────────────
  // Must mention a local locality AND an emergency keyword
  if (category === 'local') {
    const hasCritical = hasWord(EMERGENCY_CRITICAL);
    const hasHigh = hasWord(EMERGENCY_HIGH);
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    return null; // Local news without emergency → not an alert
  }

  // ── PROVINCIAL ────────────────────────────────────────────────────────────
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
    return null;
  }

  // ── NATIONAL ─────────────────────────────────────────────────────────────
  if (category === 'national') {
    const NATIONAL_CRITICAL = [
      'atentado', 'tragedia masiva', 'accidente masivo', 'crisis institucional',
      'catástrofe nacional', 'catastrofe nacional', 'golpe de estado',
      'muerte de presidente', 'estado de sitio', 'intervención federal',
      'accidente con múltiples víctimas', 'accidente con multiples victimas',
      'desastre nacional', 'emergencia nacional'
    ];
    if (hasWord(NATIONAL_CRITICAL)) return 'critical';
    return null;
  }

  // ── INTERNATIONAL ─────────────────────────────────────────────────────────
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
    return null;
  }

  return null;
};

// Smart Categorization Engine
const detectTrueCategory = (title: string, summary: string, source: string, defaultCategory: RadarCategory): RadarCategory => {
  const text = `${title} ${summary}`;
  
  // 1. Check for foreign mentions first to avoid false local classifications
  const hasForeignMention = hasExactWordMatch(text, FOREIGN_KEYWORDS);

  // 2. Check local/provincial keywords using exact word match
  const mentionsLocal = hasExactWordMatch(text, LOCAL_KEYWORDS);
  const mentionsProvincial = hasExactWordMatch(text, PROVINCIAL_KEYWORDS);

  // 3. International keywords checklist (direct indicator of international news)
  const INTERNATIONAL_KEYWORDS = [
    'india', 'bangladesh', 'estados unidos', 'china', 'brasil', 'méxico', 'mexico', 
    'francia', 'españa', 'espana', 'europa', 'onu', 'otan', 'rusia', 'ucrania', 
    'israel', 'irán', 'iran', 'ee.uu.', 'eeuu', 'ee uu', 'onu', 'otan', 'nato',
    'bernardo silva', 'bruno fernandes'
  ];
  const mentionsInternational = hasExactWordMatch(text, INTERNATIONAL_KEYWORDS);

  const sourceRegion = getSourceRegion(source);

  // Ambiguity / confidence check:
  // If it mentions both local keywords and foreign keywords/international markers,
  // it is highly ambiguous. In this case, we MUST classify as international or national, never local.
  const isAmbiguous = mentionsLocal && (hasForeignMention || mentionsInternational);

  // If there's a foreign mention or international mention and NO explicit local mention, it is definitely international.
  // If it's ambiguous, classify as international or national.
  if (hasForeignMention || mentionsInternational || isAmbiguous) {
    if (hasForeignMention || mentionsInternational) {
      return 'international';
    }
    return 'national';
  }

  // Precedence logic for local/provincial classification
  if (mentionsLocal) {
    return 'local';
  }

  if (mentionsProvincial) {
    return 'provincial';
  }

  // Check local qualification constraint
  const qualifiesAsLocal = sourceRegion === 'local' || mentionsLocal;

  // Fallback default categorization by source
  if (sourceRegion === 'local' && qualifiesAsLocal) {
    return 'local';
  }

  if (sourceRegion === 'provincial') {
    return 'provincial';
  }

  if (sourceRegion === 'national') {
    return 'national';
  }

  if (sourceRegion === 'international') {
    return 'international';
  }

  return defaultCategory || 'national';
};

export const rssService = {
  fetchNews: async (): Promise<{ items: NewsRadarItem[]; alerts: { title: string; severity: 'critical' | 'high'; sourceName?: string; sourceUrl?: string; publishedAt?: string; category?: string; region?: string }[]; diagnostics: RssDiagnostic[] }> => {
    const allItems: NewsRadarItem[] = [];
    const alerts: { title: string; severity: 'critical' | 'high'; sourceName?: string; sourceUrl?: string; publishedAt?: string; category?: string; region?: string }[] = [];
    const diagnostics: RssDiagnostic[] = [];

    const results: any[] = [];
    const batchSize = 10;
    for (let i = 0; i < RSS_FEEDS.length; i += batchSize) {
      const batch = RSS_FEEDS.slice(i, i + batchSize);
      const batchPromises = batch.map(async (feed) => {
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
          const { data, methodUsed, responseTimeMs } = await supabaseRadarGateway.fetchFromSupabaseGateway(feed.url, feed.connectionType);
          
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

              const smartCategory = detectTrueCategory(item.title, cleanSummary, feed.name, feed.defaultCategory);
              
              // Calculate score and reasons
              const { score, reasons } = calculateEditorialScore(item.title, cleanSummary, smartCategory, feed.name);
              const regionDetectada = detectExplicitLocality(item.title, cleanSummary);

              scoredItems.push({
                item,
                cleanSummary,
                parsedDate,
                smartCategory,
                regionDetectada,
                editorialScore: score,
                reasons
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
                  region: x.regionDetectada || undefined
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
                url: x.item.link
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

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

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
