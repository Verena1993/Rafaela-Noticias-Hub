import type { RadarTopic } from './topicClustering';

export interface EditorialScore {
  score: number;
  priority: 'Alta' | 'Media' | 'Baja';
  reasoning: string;
  flags: {
    enCrecimiento: boolean;
    impactoLocal: boolean;
    multifuente: boolean;
    posibleExclusiva: boolean;
  };
}

const LOCAL_IMPACT_KEYWORDS = [
  'rafaela', 'castellanos', 'sunchales', 'humberto primo', 'bella italia',
  'susana', 'lehmann', 'tacural', 'ataliva', 'humboldt', 'vila',
  'presidente roca', 'ramona', 'frontera', 'josefina', 'angélica',
  'san vicente', 'maría juana', 'bauer y sigel', 'egusquiza',
  'moisés ville', 'eusebia', 'zenón pereyra', 'santa clara de saguier'
];

const HIGH_PRIORITY_CATEGORIES = [
  'accidente', 'policial', 'incendio', 'política', 'economía', 
  'salud', 'servicio', 'clima', 'tormenta', 'siniestro', 'robo', 'fuego'
];

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function calculateEditorialScore(topic: Omit<RadarTopic, 'editorialScore'>): EditorialScore {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. CANTIDAD DE MEDIOS
  if (topic.mediaCount >= 5) {
    score += 40;
    reasons.push('Amplia cobertura multifuente (5+ medios).');
  } else if (topic.mediaCount >= 2) {
    score += 25;
    reasons.push('Cobertura moderada (múltiples medios).');
  } else {
    score += 10;
    reasons.push('Reportado por una única fuente.');
  }

  // 2. ACTUALIDAD
  const hoursSinceLast = (Date.now() - new Date(topic.lastPublishedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLast < 1) {
    score += 30;
    reasons.push('Súper reciente (última hora).');
  } else if (hoursSinceLast < 6) {
    score += 20;
    reasons.push('Reciente (últimas 6 horas).');
  } else if (hoursSinceLast < 24) {
    score += 10;
  }

  // 3. CRECIMIENTO
  const hoursSinceFirst = (Date.now() - new Date(topic.firstPublishedAt).getTime()) / (1000 * 60 * 60);
  const isGrowing = topic.articleCount > 1 && hoursSinceLast < 12 && (topic.articleCount / Math.max(1, hoursSinceFirst)) >= 0.5;
  if (isGrowing) {
    score += 15;
    reasons.push('Crecimiento sostenido de artículos.');
  }

  // 4. IMPACTO LOCAL
  const fullText = normalizeText(topic.items.map(i => `${i.title} ${i.summary}`).join(' '));
  const hasLocalImpact = LOCAL_IMPACT_KEYWORDS.some(kw => fullText.includes(normalizeText(kw)));
  if (hasLocalImpact) {
    score += 25;
    reasons.push('Alto impacto en Rafaela y la región.');
  }

  // 5. CATEGORÍA
  const hasHighPriorityCat = HIGH_PRIORITY_CATEGORIES.some(kw => fullText.includes(normalizeText(kw)));
  if (hasHighPriorityCat) {
    score += 15;
    reasons.push('Temática de alto interés (Accidentes/Policiales/Clima).');
  }

  // 6. EXCLUSIVIDAD POTENCIAL
  const isExclusive = topic.mediaCount === 1 && hasLocalImpact;
  if (isExclusive) {
    score += 20;
    reasons.push('Posible nota exclusiva local.');
  }

  // Cap score to 100 for percentage visualization
  const finalScore = Math.min(100, score);

  let priority: 'Alta' | 'Media' | 'Baja' = 'Baja';
  if (finalScore >= 75) priority = 'Alta';
  else if (finalScore >= 45) priority = 'Media';

  // Construct main reasoning sentence
  let mainReasoning = reasons.slice(0, 2).join(' ');

  return {
    score: finalScore,
    priority,
    reasoning: mainReasoning,
    flags: {
      enCrecimiento: isGrowing,
      impactoLocal: hasLocalImpact,
      multifuente: topic.mediaCount > 1,
      posibleExclusiva: isExclusive
    }
  };
}
