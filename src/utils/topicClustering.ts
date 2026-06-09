import type { NewsRadarItem, RadarCategory } from '../types';

import { calculateEditorialScore } from './editorialScoring';
import type { EditorialScore } from './editorialScoring';

export interface RadarTopic {
  id: string;
  title: string;
  articleCount: number;
  mediaCount: number;
  firstMedia: string;
  lastMedia: string;
  firstPublishedAt: string;
  lastPublishedAt: string;
  category: RadarCategory;
  geoScope: 'local' | 'provincial' | 'nacional' | 'internacional' | 'desconocido';
  activityLevel: 'Caliente' | 'Moderado' | 'En crecimiento' | 'Bajo';
  editorialScore?: EditorialScore;
  items: NewsRadarItem[];
}

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 
  'en', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'hacia', 'de', 
  'del', 'a', 'al', 'se', 'lo', 'su', 'sus', 'que', 'como', 'cuando', 'donde', 'quien', 
  'quienes', 'fue', 'fueron', 'es', 'son', 'ser', 'estar', 'este', 'esta', 'estos', 
  'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas',
  'tras', 'un', 'una', 'mas', 'muy', 'cerca'
]);

const SYNONYMS: Record<string, string[]> = {
  'accidente': ['choque', 'siniestro', 'colision', 'vuelco', 'despiste', 'accidente', 'siniestro vial', 'impacto', 'accidente de transito'],
  'incendio': ['fuego', 'llamas', 'bomberos', 'quemazones', 'incendio', 'foco igneo'],
  'robo': ['hurto', 'asalto', 'entradera', 'delincuentes', 'ladrones', 'inseguridad', 'robo', 'detenido', 'robo a mano armada', 'motochorros'],
  'tormenta': ['lluvia', 'temporal', 'granizo', 'viento', 'clima', 'tormenta', 'alerta meteorologica'],
  'ruta_34': ['rn 34', 'ruta nacional 34', 'rn34', 'ruta 34']
};

const GEO_KEYWORDS = {
  local: ['rafaela', 'susana', 'bella italia', 'lehmann', 'ataliva', 'sunchales', 'castellanos', 'ruta 34', 'rn 34', 'ruta 70', 'barrio', 'zona rural'],
  provincial: ['santa fe', 'rosario', 'pullaro', 'gobernador'],
  nacional: ['milei', 'congreso', 'nacion', 'gobierno nacional', 'argentina', 'buenos aires', 'indec']
};

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, ' ');
}

function extractFeatures(text: string): { keywords: Set<string>, categoryTokens: Set<string> } {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  const keywords = new Set<string>();
  const categoryTokens = new Set<string>();
  
  // Find synonyms and map to category tokens
  Object.keys(SYNONYMS).forEach(cat => {
    SYNONYMS[cat].forEach(syn => {
      if (normalized.includes(normalizeText(syn))) {
        categoryTokens.add(cat);
        keywords.add(cat); // add the root synonym concept as a keyword
      }
    });
  });

  // Extract regular words
  words.forEach(w => keywords.add(w));
  
  // Add bigrams
  for (let i = 0; i < words.length - 1; i++) {
    keywords.add(`${words[i]}_${words[i+1]}`);
  }

  return { keywords, categoryTokens };
}

function calculateSimilarity(feat1: ReturnType<typeof extractFeatures>, feat2: ReturnType<typeof extractFeatures>): number {
  let intersectCat = 0;
  if (feat1.categoryTokens.size > 0 && feat2.categoryTokens.size > 0) {
    feat1.categoryTokens.forEach(c => { if (feat2.categoryTokens.has(c)) intersectCat++; });
    if (intersectCat === 0) return 0; // Different types of events entirely
  }

  let intersection = 0;
  for (const word of feat1.keywords) {
    if (feat2.keywords.has(word)) intersection++;
  }
  
  if (feat1.keywords.size === 0 && feat2.keywords.size === 0) return 0;
  
  let dice = (2 * intersection) / (feat1.keywords.size + feat2.keywords.size);
  
  // Boost score significantly if they share a core event category token
  if (intersectCat > 0) {
    dice += 0.2; 
  }
  
  return dice;
}

export function clusterItems(items: NewsRadarItem[]): RadarTopic[] {
  // Sort items from oldest to newest first, to track the "first" publisher accurately
  const sortedItems = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const topics: RadarTopic[] = [];

  for (const item of sortedItems) {
    const itemFeat = extractFeatures(`${item.title} ${item.summary}`);
    
    let bestTopic: RadarTopic | null = null;
    let maxScore = 0;

    for (const topic of topics) {
      const firstDate = new Date(topic.firstPublishedAt).getTime();
      const itemDate = new Date(item.date).getTime();
      const hoursDiff = Math.abs(itemDate - firstDate) / (1000 * 60 * 60);
      
      if (hoursDiff > 72) continue;
      
      const topicTitles = topic.items.map(i => `${i.title}`).join(' ');
      const topicFeat = extractFeatures(topicTitles);
      const score = calculateSimilarity(itemFeat, topicFeat);
      
      // Threshold for Dice coefficient.
      if (score > 0.15 && score > maxScore) { 
        maxScore = score;
        bestTopic = topic;
      }
    }

    if (bestTopic) {
      bestTopic.items.push(item);
      bestTopic.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      bestTopic.articleCount = bestTopic.items.length;
      const sources = new Set(bestTopic.items.map(i => i.source));
      bestTopic.mediaCount = sources.size;
      
      const oldestItem = bestTopic.items[bestTopic.items.length - 1];
      const newestItem = bestTopic.items[0];
      
      bestTopic.firstMedia = oldestItem.source;
      bestTopic.lastMedia = newestItem.source;
      bestTopic.firstPublishedAt = oldestItem.date;
      bestTopic.lastPublishedAt = newestItem.date;
      
      // Use the title of the oldest (original) item
      bestTopic.title = oldestItem.title; 
      
      bestTopic.category = calculatePredominantCategory(bestTopic.items);
      bestTopic.geoScope = calculateGeoScope(bestTopic.items);
      bestTopic.activityLevel = calculateActivityLevel(bestTopic.articleCount, bestTopic.lastPublishedAt);
      bestTopic.editorialScore = calculateEditorialScore(bestTopic);
      
    } else {
      const newTopic: RadarTopic = {
        id: `topic_${item.id}`,
        title: item.title,
        articleCount: 1,
        mediaCount: 1,
        firstMedia: item.source,
        lastMedia: item.source,
        firstPublishedAt: item.date,
        lastPublishedAt: item.date,
        category: item.category,
        geoScope: calculateGeoScope([item]),
        activityLevel: calculateActivityLevel(1, item.date),
        items: [item]
      };
      newTopic.editorialScore = calculateEditorialScore(newTopic);
      topics.push(newTopic);
    }
  }

  // Sort topics by recency initially
  return topics.sort((a, b) => new Date(b.lastPublishedAt).getTime() - new Date(a.lastPublishedAt).getTime());
}

function calculatePredominantCategory(items: NewsRadarItem[]): RadarCategory {
  const counts: Record<string, number> = {};
  for (const i of items) {
    counts[i.category] = (counts[i.category] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as RadarCategory;
}

function calculateGeoScope(items: NewsRadarItem[]): RadarTopic['geoScope'] {
  const text = items.map(i => `${i.title} ${i.summary}`).join(' ').toLowerCase();
  if (GEO_KEYWORDS.local.some(kw => text.includes(kw))) return 'local';
  if (GEO_KEYWORDS.provincial.some(kw => text.includes(kw))) return 'provincial';
  if (GEO_KEYWORDS.nacional.some(kw => text.includes(kw))) return 'nacional';
  return 'desconocido';
}

function calculateActivityLevel(count: number, lastDate: string): RadarTopic['activityLevel'] {
  const hoursSinceLast = (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60);
  
  if (count >= 4 && hoursSinceLast < 12) return 'Caliente';
  if (count >= 2 && hoursSinceLast < 24) return 'En crecimiento';
  if (count >= 2 && hoursSinceLast >= 24) return 'Moderado';
  return 'Bajo';
}
