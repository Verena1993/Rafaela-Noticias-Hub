import { RSS_FEEDS } from '../config/rssFeeds';
import type { NewsRadarItem, RssDiagnostic, RadarCategory, ConnectionType } from '../types';

import { supabaseRadarGateway } from './supabaseRadarGateway';

const EXCLUDE_KEYWORDS = [
  'espectáculo', 'espectaculo', 'show', 'recital', 'concierto', 'película', 'pelicula', 'cine', 
  'teatro', 'farándula', 'farandula', 'chisme', 'romance', 'celebridad', 'actor', 'actriz', 
  'cantante', 'famoso', 'famosa', 'fútbol', 'futbol', ' gol ', 'partido', ' copa ', ' liga ', 
  'messi', 'maradona', 'torneo', 'curiosidad', 'insólito', 'insolito', 'gracioso', 'viral', 
  'tik tok', 'tiktok', 'instagram', 'redes sociales', 'twitter', 'declaró', 'declaro', 'opinó', 'opino'
];

const LOCAL_CRITICAL = [
  'accidente fatal', 'accidente grave', 'choque fatal', 'muerto', 'muerte', 'fallecido fatal', 
  'homicidio', 'asesinato', 'asesinado', 'crimen', 'allanamiento', 'incendio grave', 'robo a mano armada', 
  'robo violento', 'asalto violento', 'desaparecido', 'búsqueda de persona', 'paradero'
];

const LOCAL_HIGH = [
  'choque', 'accidente', 'incendio', 'allanamientos', 'operativo policial', 'policía', 'policia', 
  'detenido', 'detención', 'temporal', 'tormenta', 'granizo', 'evacuación', 'evacuacion', 
  'corte de luz', 'corte de energía', 'corte de energia', 'apagón', 'apagon', 'corte de ruta', 'piquete'
];

const LOCAL_MEDIUM = [
  'falleció', 'fallecio', 'fallecimiento', 'obituario', 'sepelio', 'epe', 'emergencia sanitaria', 
  'dengue', 'brote'
];

const PROVINCIAL_CRITICAL = [
  'víctima fatal', 'víctimas fatales', 'fallecido', 'fallecidos', 'muerto', 'muertos', 'muertes'
];

const PROVINCIAL_HIGH = [
  'múltiples heridos', 'heridos', 'declaró emergencia', 'emergencia provincial', 'alerta santa fe', 'pullaro'
];

const NATIONAL_CRITICAL = [
  'múltiples fallecidos', 'múltiples muertos', 'catástrofe', 'catastrofe', 'atentado', 'explosión', 'explosion'
];

const NATIONAL_HIGH = [
  'accidente masivo', 'choque múltiple', 'choque de colectivos', 'descarrilamiento', 'crisis institucional', 'emergencia nacional'
];

const INTERNATIONAL_CRITICAL = [
  'guerra', 'invasión', 'invasion', 'misil', 'bombardeo', 'terremoto', 'sismo', 'tsunami', 'atentado terrorista'
];

const INTERNATIONAL_HIGH = [
  'accidente aéreo', 'cae avión', 'colapso financiero', 'crisis financiera', 'pandemia'
];

const PRIORITY_LOCATIONS = ['rafaela', 'castellanos', 'sunchales', 'frontera', 'san vicente', 'esperanza'];

export const classifyAlert = (title: string, summary: string, category: RadarCategory): 'critical' | 'high' | 'medium' | null => {
  const text = `${title} ${summary}`.toLowerCase();

  // 1. Exclude non-alert content
  if (EXCLUDE_KEYWORDS.some(kw => text.includes(kw))) {
    return null;
  }

  const matches = (keywords: string[]) => keywords.some(kw => text.includes(kw));

  let severity: 'critical' | 'high' | 'medium' | null = null;

  // 2. Classify by Category
  if (category === 'local') {
    if (matches(LOCAL_CRITICAL)) severity = 'critical';
    else if (matches(LOCAL_HIGH)) severity = 'high';
    else if (matches(LOCAL_MEDIUM)) severity = 'medium';

    // Geographic priority bump
    if (severity && PRIORITY_LOCATIONS.some(loc => text.includes(loc))) {
      if (severity === 'high') severity = 'critical';
      else if (severity === 'medium') severity = 'high';
    }
  } 
  else if (category === 'provincial') {
    if (matches(PROVINCIAL_CRITICAL)) severity = 'critical';
    else if (matches(PROVINCIAL_HIGH)) severity = 'high';
  } 
  else if (category === 'national') {
    if (matches(NATIONAL_CRITICAL)) severity = 'critical';
    else if (matches(NATIONAL_HIGH)) severity = 'high';
  } 
  else if (category === 'international') {
    if (matches(INTERNATIONAL_CRITICAL)) severity = 'critical';
    else if (matches(INTERNATIONAL_HIGH)) severity = 'high';
  }

  return severity;
};

const LOCAL_KEYWORDS = [
  'rafaela', 'susana', 'bella italia', 'lehmann', 'ataliva', 'humboldt', 'pilar', 
  'felicia', 'sunchales', 'humberto', 'tacural', 'presidente roca', 'san vicente', 
  'angélica', 'vila', 'maría juana', 'ramona', 'frontera', 'josefina', 'virginia', 
  'castellanos', 'departamento castellanos', 'concejo municipal de rafaela', 
  'municipalidad de rafaela', 'gobierno de rafaela', 'región rafaela', 'humberto primo',
  'aldao', 'eusebia', 'colonia raquel', 'colonia bicha', 'zenón pereyra',
  'santa clara de saguier', 'coronel fraga', 'garibaldi', 'plaza clucellas',
  'esmeralda', 'san antonio', 'bauer y sigel', 'egusquiza', 'colonia aldao', 'moisés ville', 'aurelia'
];

const PROVINCIAL_KEYWORDS = [
  'santa fe', 'rosario', 'pullaro', 'gobernador de santa fe', 'provincia de santa fe'
];



// Check similarity based on common word tokens to avoid duplicates
export const isSimilarTitle = (title1: string, title2: string): boolean => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
  const words1 = normalize(title1);
  const words2 = normalize(title2);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length >= 3; 
};

import { getSourceRegion } from '../config/newsSourceRegions';

// Smart Categorization Engine
const detectTrueCategory = (title: string, summary: string, source: string, defaultCategory: RadarCategory): RadarCategory => {
  const text = `${title} ${summary}`.toLowerCase();
  
  // Create word boundaries to prevent substring matching
  const hasMatch = (keywords: string[]) => keywords.some(kw => {
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
    return regex.test(text);
  });

  const hasLocal = hasMatch(LOCAL_KEYWORDS);
  const hasProv = hasMatch(PROVINCIAL_KEYWORDS);

  // If local keywords are explicitly found, override to local
  if (hasLocal) return 'local';

  // If provincial keywords are found
  if (hasProv) return 'provincial';

  // Fallback to media source categorization
  const mediaCategory = getSourceRegion(source);
  if (mediaCategory) return mediaCategory;

  return defaultCategory;
};

export const rssService = {
  fetchNews: async (): Promise<{ items: NewsRadarItem[]; alerts: { title: string; severity: 'critical' | 'high' | 'medium' }[]; diagnostics: RssDiagnostic[] }> => {
    const allItems: NewsRadarItem[] = [];
    const alerts: { title: string; severity: 'critical' | 'high' | 'medium' }[] = [];
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
            data.items.forEach((item: any) => {
              const cleanSummary = (item.description || item.content || '').replace(/<[^>]+>/g, '').trim();
              const smartCategory = detectTrueCategory(item.title, cleanSummary, feed.name, feed.defaultCategory);

              const classification = classifyAlert(item.title, cleanSummary, smartCategory);
              if (classification) {
                alerts.push({ title: item.title, severity: classification });
              }

              feedItems.push({
                id: `rss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: item.title,
                summary: cleanSummary.substring(0, 200) + '...',
                source: feed.name,
                date: item.pubDate || new Date().toISOString(),
                category: smartCategory,
                url: item.link
              });
              addedItems++;
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
