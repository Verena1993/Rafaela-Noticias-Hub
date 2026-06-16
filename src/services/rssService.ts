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

export const detectPersonEntities = (text: string): boolean => {
  const clean = removeAccents(text).toLowerCase();
  const patterns = [
    /\bpilar sordo\b/i,
    /\besperanza gomez\b/i,
    /\bsan martin\b/i,
    /\bbelgrano\b/i,
    /\bmoreno\b/i,
    /\bcristobal colon\b/i,
    /\bsan cristobal colon\b/i
  ];
  return patterns.some(p => p.test(clean));
};

const INTERNATIONAL_INDICATORS = [
  'iran', 'israel', 'ucrania', 'segunda guerra mundial', 'bbc', 'dw', 'guerra', 'naciones unidas',
  'estados unidos', 'ee.uu.', 'eeuu', 'ee uu', 'francia', 'alemania', 'rusia', 'china', 'roma',
  'madrid', 'españa', 'espana', 'brasil', 'chile', 'uruguay', 'paraguay', 'bolivia', 'peru', 'perú',
  'colombia', 'venezuela', 'europa', 'asia', 'oriente medio', 'gaza', 'palestina', 'biden', 'putin', 'netanyahu',
  'londres', 'reino unido', 'uk', 'parís', 'paris', 'tokio', 'japon', 'japón', 'italia', 'vaticano'
];

const LOCAL_KEYWORDS = [
  'rafaela', 'barrio alberdi', 'barranquitas', 'villa rosas', 'italia', '9 de julio', 'mosconi', 
  'villa dominga', 'mora', 'los nogales', 'sunchales', 'san cristobal', 'san cristóbal', 'esperanza', 
  'frontera', 'josefina', 'lehmann', 'humberto', 'ramona', 'tacural', 'vila', 'susana', 'ataliva', 
  'presidente roca', 'bella italia', 'angelica', 'angélica', 'aurelia', 'maria juana', 'maría juana', 
  'clucellas', 'san vicente', 'zenon pereyra', 'zenón pereyra', 'castellanos'
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
  
  if (detectPersonEntities(combinedText)) {
    return null;
  }

  if (hasExactWordMatch(combinedText, INTERNATIONAL_INDICATORS)) {
    return null;
  }

  const cleanText = removeAccents(combinedText).toLowerCase();
  
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
      if (loc.key === 'esperanza') {
        const invalidEsperanza = [
          /\bla esperanza\b/i,
          /\besperanza de vida\b/i,
          /\bsin esperanza\b/i,
          /\bcon la esperanza\b/i,
          /\bperder la esperanza\b/i,
          /\bfe y esperanza\b/i,
          /\btengo esperanza\b/i
        ];
        if (invalidEsperanza.some(pat => pat.test(cleanText))) {
          continue;
        }
      }
      
      if (loc.key === 'italia') {
        const isBarrioItalia = /\bbarrio italia\b/i.test(cleanText);
        if (!isBarrioItalia) {
          continue;
        }
      }

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

  if (category === 'local') {
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

export const detectTrueCategory = (title: string, summary: string, source: string, defaultCategory: RadarCategory): { category: RadarCategory; reason: string } => {
  const combined = `${title} ${summary}`;
  const clean = removeAccents(combined).toLowerCase();

  // FASE 3: detectPersonEntities
  if (detectPersonEntities(combined)) {
    const reason = 'Entidad persona detectada';
    console.log(`[RECHAZADA] Título: "${title}" | Motivo: ${reason}`);
    return { category: 'national', reason };
  }

  // FASE 3 & 4: Check international indicators first
  if (hasExactWordMatch(combined, INTERNATIONAL_INDICATORS)) {
    const reason = 'Coincidencia con indicador internacional';
    console.log(`[CLASIFICADOR] Título: "${title}" | Territorio: international | Motivo: ${reason}`);
    return { category: 'international', reason };
  }

  // Exact local check from FASE 2
  let hasLocalGeo = false;
  let matchedKeyword = '';

  for (const kw of LOCAL_KEYWORDS) {
    const cleanKw = removeAccents(kw).toLowerCase();
    const escapedKw = cleanKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
    if (regex.test(clean)) {
      if (cleanKw === 'esperanza') {
        const invalidEsperanza = [
          /\bla esperanza\b/i,
          /\besperanza de vida\b/i,
          /\bsin esperanza\b/i,
          /\bcon la esperanza\b/i,
          /\bperder la esperanza\b/i,
          /\bfe y esperanza\b/i,
          /\btengo esperanza\b/i
        ];
        if (invalidEsperanza.some(pat => pat.test(clean))) {
          continue;
        }
      }
      
      if (cleanKw === 'italia') {
        const isBarrioItalia = /\bbarrio italia\b/i.test(clean);
        if (!isBarrioItalia) {
          continue;
        }
      }

      hasLocalGeo = true;
      matchedKeyword = kw;
      break;
    }
  }

  if (hasLocalGeo) {
    const reason = `Coincidencia exacta: "${matchedKeyword}"`;
    console.log(`[CLASIFICADOR] Título: "${title}" | Territorio: local | Localidad: ${matchedKeyword} | Motivo: Coincidencia exacta`);
    return { category: 'local', reason };
  }

  if (hasExactWordMatch(combined, PROVINCIAL_KEYWORDS)) {
    const reason = 'Coincidencia provincial';
    console.log(`[CLASIFICADOR] Título: "${title}" | Territorio: provincial | Motivo: ${reason}`);
    return { category: 'provincial', reason };
  }

  const sourceRegion = getSourceRegion(source);
  const finalTerritory = sourceRegion || defaultCategory || 'national';
  const reason = `Fallback por origen de fuente (${source})`;
  console.log(`[CLASIFICADOR] Título: "${title}" | Territorio: ${finalTerritory} | Motivo: ${reason}`);
  return { category: finalTerritory as RadarCategory, reason };
};

export const rssService = {
  fetchNews: async (): Promise<{ items: NewsRadarItem[]; alerts: { title: string; severity: 'critical' | 'urgent' | 'high' | 'medium' | 'normal'; sourceName?: string; sourceUrl?: string; publishedAt?: string; category?: string; region?: string; classificationReason?: string }[]; diagnostics: RssDiagnostic[] }> => {
    const allItems: NewsRadarItem[] = [];
    const alerts: { title: string; severity: 'critical' | 'urgent' | 'high' | 'medium' | 'normal'; sourceName?: string; sourceUrl?: string; publishedAt?: string; category?: string; region?: string; classificationReason?: string }[] = [];
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

            const { category: smartCategory, reason: classificationReason } = detectTrueCategory(item.title, cleanSummary, feed.name, feed.defaultCategory);
            
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
              reasons,
              classificationReason
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
                classificationReason: x.classificationReason
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
