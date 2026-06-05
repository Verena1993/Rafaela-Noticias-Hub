import type { NewsRadarItem } from '../data/mockData';

const TIKTOK_TRENDS = [
  { title: '#RafaelaCity - Video viral de un auto que cruza en rojo', views: '150K', level: 'Muy caliente' as const },
  { title: '#ClimaSantaFe - Alerta de tormenta en la región', views: '80K', level: 'En crecimiento' as const }
];

const IG_TRENDS = [
  { title: 'Reel: Inauguración del nuevo local céntrico', views: '45K', level: 'Moderada' as const },
  { title: 'Story viral: Denuncia por ruidos molestos en Barrio Sur', views: '12K', level: 'En crecimiento' as const }
];

const X_TRENDS = [
  { title: '"Corte de luz Rafaela"', views: '2K posts', level: 'Muy caliente' as const },
  { title: '"Atlético de Rafaela"', views: '5K posts', level: 'En crecimiento' as const }
];

const RAFAELA_TALKS = [
  { title: 'Quejas vecinales por baches en Bv. Lehmann', source: 'Facebook (Grupos locales)', level: 'Muy caliente' as const },
  { title: 'Club Ben Hur lanza nueva disciplina deportiva', source: 'Instagram Oficial', level: 'En crecimiento' as const },
  { title: 'Comunicado de la Municipalidad sobre recolección de residuos', source: 'Twitter Oficial', level: 'Moderada' as const }
];

export const trendsService = {
  fetchSocialTrends: async (): Promise<NewsRadarItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items: NewsRadarItem[] = [];

        // Tiktok
        TIKTOK_TRENDS.forEach((t, i) => {
          items.push({
            id: `social_tk_${i}_${Date.now()}`,
            title: t.title,
            summary: `Video viral detectado en TikTok. Visualizaciones estimadas: ${t.views}. Oportunidad para nota sobre tendencias.`,
            source: 'TikTok',
            date: new Date().toISOString(),
            category: 'social_trends',
            socialPlatform: 'tiktok',
            trendLevel: t.level,
            views: t.views
          });
        });

        // Instagram
        IG_TRENDS.forEach((t, i) => {
          items.push({
            id: `social_ig_${i}_${Date.now()}`,
            title: t.title,
            summary: `Contenido destacado en Instagram Reels/Stories. Visualizaciones: ${t.views}.`,
            source: 'Instagram',
            date: new Date().toISOString(),
            category: 'social_trends',
            socialPlatform: 'instagram',
            trendLevel: t.level,
            views: t.views
          });
        });

        // X (Twitter)
        X_TRENDS.forEach((t, i) => {
          items.push({
            id: `social_x_${i}_${Date.now()}`,
            title: t.title,
            summary: `Trending Topic detectado en X. Menciones: ${t.views}.`,
            source: 'X',
            date: new Date().toISOString(),
            category: 'social_trends',
            socialPlatform: 'x',
            trendLevel: t.level,
            views: t.views
          });
        });

        // Rafaela Talks (Local Social)
        RAFAELA_TALKS.forEach((t, i) => {
          items.push({
            id: `rafa_talks_${i}_${Date.now()}`,
            title: t.title,
            summary: `Detectado mediante escucha social en la comunidad de Rafaela. Origen: ${t.source}.`,
            source: t.source,
            date: new Date().toISOString(),
            category: 'rafaela_talks',
            socialPlatform: 'local',
            trendLevel: t.level
          });
        });

        resolve(items);
      }, 500); // Simulate network latency
    });
  }
};
