import type { RadarCategory } from '../types';

export interface EditorialSourceConfig {
  domain: string;
  name: string;
  category: RadarCategory;
  region: string;
  priority: number;
}

export const EDITORIAL_SOURCES: EditorialSourceConfig[] = [
  // LOCALES
  { domain: "radiorafaela.com.ar", name: "Radio Rafaela", category: "local", region: "rafaela", priority: 100 },
  { domain: "minutorafaela.com.ar", name: "Minuto Rafaela", category: "local", region: "rafaela", priority: 100 },
  { domain: "adn979.com", name: "ADN 97.9", category: "local", region: "rafaela", priority: 100 },
  { domain: "diariocastellanos.com.ar", name: "Diario Castellanos", category: "local", region: "rafaela", priority: 100 },
  { domain: "rafaelainforma.com", name: "Rafaela Informa", category: "local", region: "rafaela", priority: 100 },
  { domain: "concejorafaela.gob.ar", name: "Concejo Municipal de Rafaela (Proyectos)", category: "local", region: "rafaela", priority: 100 },
  { domain: "diariolaopinion.com.ar", name: "Diario La Opinión", category: "local", region: "rafaela", priority: 100 },

  // REGIONALES
  { domain: "reconquistahoy.com", name: "Reconquista Hoy", category: "regional", region: "regional", priority: 80 },
  { domain: "movilquique.com", name: "Móvil Quique", category: "regional", region: "regional", priority: 80 },
  { domain: "sunchaleshoy.com.ar", name: "Sunchales Hoy", category: "regional", region: "regional", priority: 80 },
  { domain: "esperancino.com.ar", name: "Esperancino", category: "regional", region: "regional", priority: 80 },
  { domain: "eldepartamental.com", name: "El Departamental", category: "regional", region: "regional", priority: 80 },

  // PROVINCIALES
  { domain: "rosario3.com", name: "Rosario3", category: "provincial", region: "provincial", priority: 50 },
  { domain: "rosarioplus.com", name: "Rosario Plus", category: "provincial", region: "provincial", priority: 50 },
  { domain: "airedesantafe.com.ar", name: "Aire de Santa Fe", category: "provincial", region: "provincial", priority: 50 },
  { domain: "ellitoral.com", name: "El Litoral", category: "provincial", region: "provincial", priority: 50 },
  { domain: "unosantafe.com.ar", name: "Uno Santa Fe", category: "provincial", region: "provincial", priority: 50 },
  { domain: "santafeplus.com", name: "Santa Fe Plus", category: "provincial", region: "provincial", priority: 50 },

  // NACIONALES
  { domain: "infobae.com", name: "Infobae", category: "national", region: "national", priority: 30 },
  { domain: "lanacion.com.ar", name: "La Nación", category: "national", region: "national", priority: 30 },
  { domain: "clarin.com", name: "Clarín", category: "national", region: "national", priority: 30 },
  { domain: "perfil.com", name: "Perfil", category: "national", region: "national", priority: 30 },
  { domain: "ambito.com", name: "Ámbito", category: "national", region: "national", priority: 30 },
  { domain: "cronista.com", name: "El Cronista", category: "national", region: "national", priority: 30 },
  { domain: "pagina12.com.ar", name: "Página 12", category: "national", region: "national", priority: 30 },

  // INTERNACIONALES
  { domain: "bbc.com", name: "BBC", category: "international", region: "international", priority: 10 },
  { domain: "dw.com", name: "DW", category: "international", region: "international", priority: 10 },
  { domain: "cnn.com", name: "CNN", category: "international", region: "international", priority: 10 },
  { domain: "france24.com", name: "France 24", category: "international", region: "international", priority: 10 },
  { domain: "elpais.com", name: "El País", category: "international", region: "international", priority: 10 }
];
