

/**
 * Servicio "Stub" para integraciones futuras con IA real (OpenAI/Gemini).
 * Simula el retraso de generación y devuelve respuestas pre-estructuradas.
 */
export const aiService = {
  
  generateSeoTitle: async (title: string, _summary: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[SEO] ${title.split(':')[0]} - Lo que tenés que saber`);
      }, 600);
    });
  },

  generateCopete: async (_title: string, summary: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`La noticia impacta directamente en nuestra región. ${summary.substring(0, 100)}... Un informe especial para comprender cómo esto afecta a los vecinos de Rafaela y zona.`);
      }, 700);
    });
  },

  generateDraft: async (_title: string, summary: string, source: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const body = `DESARROLLO:

${summary}

Según la información provista inicialmente por ${source}, la situación evoluciona con potencial impacto local.

Para profundizar editorialmente:
- Buscar referentes locales relacionados al tema.
- Verificar el estado actual en Rafaela.
- Analizar las consecuencias económicas/sociales en la región.

(Generado por IA Simulada de RN Hub)`;
        resolve(body);
      }, 1000);
    });
  },

  generateTags: async (_summary: string): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(['rafaela', 'región', 'noticias']);
      }, 400);
    });
  },

  generateCategory: async (_title: string): Promise<'national' | 'provincial' | 'local' | 'trending'> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('local');
      }, 300);
    });
  }
};
