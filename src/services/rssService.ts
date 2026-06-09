import { RSS_FEEDS } from '../config/rssFeeds';
import type { NewsRadarItem, RssDiagnostic, RadarCategory, ConnectionType } from '../types';

import { supabaseRadarGateway } from './supabaseRadarGateway';

const ALERT_KEYWORDS = ['accidente', 'choque', 'incendio', 'robo', 'allanamiento', 'homicidio', 'tormenta', 'evacuacion', 'evacuación', 'corte'];

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

const NATIONAL_KEYWORDS = [
  'milei', 'congreso', 'caba', 'dnu', 'villarruel', 'caputo', 'eeuu', 'internacional', 'nación', 'nacion', 'gobierno nacional', 'bullrich', 'fmi', 'buenos aires'
];

// Check similarity based on common word tokens to avoid duplicates
export const isSimilarTitle = (title1: string, title2: string): boolean => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
  const words1 = normalize(title1);
  const words2 = normalize(title2);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length >= 3; 
};

// Smart Categorization Engine
const detectTrueCategory = (title: string, summary: string, source: string, defaultCategory: RadarCategory): RadarCategory => {
  const text = `${title} ${summary}`.toLowerCase();
  
  // Create word boundaries to prevent substring matching (e.g. "rn" inside "gobierno")
  const hasMatch = (keywords: string[]) => keywords.some(kw => {
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
    return regex.test(text);
  });

  // 1. If it's explicitly from Google News or National source, it stays national unless it heavily talks about local.
  const isNationalSource = ['Clarín', 'Infobae', 'La Nación', 'TN', 'Perfil', 'Google News AR', 'Ámbito', 'Página 12', 'Cronista'].includes(source);
  const isProvincialSource = ['Rosario3', 'LT10', 'El Litoral', 'Uno Santa Fe', 'Aire de Santa Fe', 'Gobierno de Santa Fe'].includes(source);

  const hasLocal = hasMatch(LOCAL_KEYWORDS);
  const hasProv = hasMatch(PROVINCIAL_KEYWORDS);
  const hasNational = hasMatch(NATIONAL_KEYWORDS);

  // If local keywords are explicitly found, it overrides to local (unless it's just a tiny mention, but we assume local weight)
  if (hasLocal) return 'local';

  // If it's a provincial source or mentions provincial keywords
  if (isProvincialSource || (hasProv && !hasNational)) {
    // If it also mentions national politics, it might be national, but usually provincial sources cover national politics too.
    if (hasNational && isProvincialSource) return 'national'; 
    return 'provincial';
  }

  // If it's a national source or Google News
  if (isNationalSource || defaultCategory === 'national') return 'national';

  // Fallback to what the feed was originally configured to be
  return defaultCategory;
};

export const rssService = {
  fetchNews: async (): Promise<{ items: NewsRadarItem[]; alerts: string[]; diagnostics: RssDiagnostic[] }> => {
    const allItems: NewsRadarItem[] = [];
    const alerts: string[] = [];
    const diagnostics: RssDiagnostic[] = [];

    const fetchPromises = RSS_FEEDS.map(async (feed) => {
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
            const lowerTitle = item.title.toLowerCase();
            if (ALERT_KEYWORDS.some(kw => lowerTitle.includes(kw))) {
              alerts.push(item.title);
            }

            const cleanSummary = (item.description || item.content || '').replace(/<[^>]+>/g, '').trim();
            const smartCategory = detectTrueCategory(item.title, cleanSummary, feed.name, feed.defaultCategory);

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

    const results = await Promise.all(fetchPromises);

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
