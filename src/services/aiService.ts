

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
  },

  analyzeTextForCoverage: async (rawText: string): Promise<{
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    interviewees: string[];
    contactInfo: string;
  }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lower = rawText.toLowerCase();
        
        // 1. Detect Title (heuristic: first line or general summary)
        let title = "Nueva Actividad Programada";
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          const firstLine = lines[0];
          title = firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
        }

        // 2. Detect Date (Default is tomorrow)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        let dateVal = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

        // Relative dates checking
        if (lower.includes('mañana') || lower.includes('manana')) {
          // already set to tomorrow
        } else if (lower.includes('hoy')) {
          dateVal = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        } else if (lower.includes('este viernes') || lower.includes('viernes')) {
          const target = new Date(today);
          const day = target.getDay();
          const diff = (5 - day + 7) % 7;
          target.setDate(target.getDate() + diff);
          dateVal = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
        } else if (lower.includes('próximo lunes') || lower.includes('proximo lunes') || lower.includes('lunes')) {
          const target = new Date(today);
          const day = target.getDay();
          const diff = (1 - day + 7) % 7 || 7; // next Monday
          target.setDate(target.getDate() + diff);
          dateVal = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
        } else {
          // Try to match "13 de junio" or "13/06"
          const dateRegex = /(\d{1,2})[\s\/]de[\s\/](enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|jun)/i;
          const match = rawText.match(dateRegex);
          if (match) {
            const dayNum = parseInt(match[1]);
            const monthStr = match[2].toLowerCase();
            const months: Record<string, number> = {
              enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, jun: 5,
              julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
            };
            const monthNum = months[monthStr] ?? 5; // default June
            const targetYear = today.getFullYear();
            dateVal = `${targetYear}-${pad(monthNum + 1)}-${pad(dayNum)}`;
          } else {
            const shortDateRegex = /(\d{1,2})[\/\-](\d{1,2})/;
            const shortMatch = rawText.match(shortDateRegex);
            if (shortMatch) {
              const dayNum = parseInt(shortMatch[1]);
              const monthNum = parseInt(shortMatch[2]);
              dateVal = `${today.getFullYear()}-${pad(monthNum)}-${pad(dayNum)}`;
            }
          }
        }

        // 3. Detect Time
        let timeVal = "09:00"; // default
        const timePatterns = [
          /(\d{1,2})[\:\.](\d{2})\s*(hs|horas)?/i,
          /(\d{1,2})\s*(hs|horas)/i
        ];
        for (const pat of timePatterns) {
          const match = rawText.match(pat);
          if (match) {
            const hour = parseInt(match[1]);
            const min = match[2] ? parseInt(match[2]) : 0;
            timeVal = `${pad(hour)}:${pad(min)}`;
            break;
          }
        }

        // 4. Detect Lugar
        let locationVal = "Sin especificar";
        const locationKeywords = [
          'calle', 'bv.', 'avenida', 'av.', 'plazoleta', 'parroquia', 'club', 'escuela', 'colegio', 
          'plaza', 'municipalidad', 'concejo', 'estadio', 'monumental', 'sede'
        ];
        const locationLine = lines.find(line => 
          locationKeywords.some(kw => line.toLowerCase().includes(kw))
        );
        if (locationLine) {
          locationVal = locationLine.length > 80 ? locationLine.substring(0, 77) + '...' : locationLine;
        }

        // 5. Detect Description
        let descriptionVal = rawText;
        if (lines.length > 1) {
          descriptionVal = lines.slice(1, 4).join('\n');
        }
        if (descriptionVal.length > 250) {
          descriptionVal = descriptionVal.substring(0, 247) + '...';
        }

        // 6. Detect Interviewees
        const nameRegex = /\b([A-Z][a-zñáéíóúü]+)\s+([A-Z][a-zñáéíóúü]+)\b/g;
        const interviewees: string[] = [];
        let nameMatch;
        const ignoredNames = ['Rafaela', 'Noticias', 'San', 'Santa', 'Castellanos', 'La', 'Opinión', 'Radio', 'Diario'];
        while ((nameMatch = nameRegex.exec(rawText)) !== null) {
          const firstName = nameMatch[1];
          const lastName = nameMatch[2];
          if (!ignoredNames.includes(firstName) && !ignoredNames.includes(lastName)) {
            const fullName = `${firstName} ${lastName}`;
            if (!interviewees.includes(fullName)) {
              interviewees.push(fullName);
            }
          }
        }

        // 7. Detect Contact Info
        const contactInfoList: string[] = [];
        const phoneRegex = /(?:tel|cel|contacto|teléfono|telefono|\b)(?:\:?\s*)(\d{3,5}[-\s]?\d{5,8})\b/gi;
        let phoneMatch;
        while ((phoneMatch = phoneRegex.exec(rawText)) !== null) {
          contactInfoList.push(phoneMatch[1]);
        }
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        let emailMatch;
        while ((emailMatch = emailRegex.exec(rawText)) !== null) {
          contactInfoList.push(emailMatch[0]);
        }
        const contactInfoVal = contactInfoList.length > 0 ? contactInfoList.join(', ') : 'No detectados';

        resolve({
          title,
          date: dateVal,
          time: timeVal,
          location: locationVal,
          description: descriptionVal,
          interviewees,
          contactInfo: contactInfoVal
        });
      }, 1000);
    });
  }
};
