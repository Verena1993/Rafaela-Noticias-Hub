import type { RadarCategory, ConnectionType } from '../data/mockData';

export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  defaultCategory: RadarCategory;
  connectionType: ConnectionType;
}

export const RSS_FEEDS: RssFeedConfig[] = [
  // Nacionales
  {
    id: 'infobae',
    name: 'Infobae',
    url: 'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml',
    defaultCategory: 'national',
    connectionType: 'rss2json_proxy'
  },
  {
    id: 'clarin',
    name: 'Clarín',
    url: 'https://www.clarin.com/rss/lo-ultimo/',
    defaultCategory: 'national',
    connectionType: 'rss2json_proxy'
  },
  {
    id: 'lanacion',
    name: 'La Nación',
    url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml',
    defaultCategory: 'national',
    connectionType: 'rss2json_proxy'
  },

  // Provinciales
  {
    id: 'unosantafe',
    name: 'Uno Santa Fe',
    url: 'https://www.unosantafe.com.ar/rss/print.xml',
    defaultCategory: 'provincial',
    connectionType: 'rss2json_proxy'
  },
  {
    id: 'airedesantafe',
    name: 'Aire de Santa Fe',
    url: 'https://www.airedesantafe.com.ar/rss/',
    defaultCategory: 'provincial',
    connectionType: 'edge_function' // Requires Edge to bypass block
  },
  {
    id: 'ellitoral',
    name: 'El Litoral',
    url: 'https://www.ellitoral.com/rss/ultimas-noticias.xml',
    defaultCategory: 'provincial',
    connectionType: 'edge_function' // Blocked by proxy
  },
  {
    id: 'rosario3',
    name: 'Rosario3',
    url: 'https://www.rosario3.com/rss/noticias.xml',
    defaultCategory: 'provincial',
    connectionType: 'edge_function' // Blocked by proxy
  },
  {
    id: 'lt10',
    name: 'LT10',
    url: 'https://lt10.com.ar/rss',
    defaultCategory: 'provincial',
    connectionType: 'edge_function' // Blocked by proxy
  },
  {
    id: 'gob_santa_fe',
    name: 'Gobierno de Santa Fe',
    url: 'https://www.santafe.gov.ar/rss',
    defaultCategory: 'provincial',
    connectionType: 'edge_function'
  },

  // Locales
  {
    id: 'castellanos',
    name: 'Castellanos de Rafaela',
    url: 'https://diariocastellanos.com.ar/feed/',
    defaultCategory: 'local',
    connectionType: 'rss2json_proxy'
  },
  {
    id: 'rafaelainforma',
    name: 'Rafaela Informa',
    url: 'https://rafaelainforma.com/feed/',
    defaultCategory: 'local',
    connectionType: 'edge_function'
  },
  {
    id: 'radiorafaela',
    name: 'Radio Rafaela',
    url: 'https://radiorafaela.com.ar/feed/',
    defaultCategory: 'local',
    connectionType: 'edge_function'
  },
  {
    id: 'laopinion',
    name: 'La Opinión',
    url: 'https://diariolaopinion.com.ar/feed/',
    defaultCategory: 'local',
    connectionType: 'edge_function'
  },
  {
    id: 'muni_rafaela',
    name: 'Municipalidad de Rafaela',
    url: 'https://www.rafaela.gob.ar/rss',
    defaultCategory: 'local',
    connectionType: 'edge_function'
  },
  {
    id: 'rafaela_noticias',
    name: 'Rafaela Noticias (Publicado)',
    url: 'https://rafaelanoticias.com/feed/',
    defaultCategory: 'local',
    connectionType: 'rss2json_proxy'
  },
  
  // Trends / Generales
  {
    id: 'google_news_ar',
    name: 'Google News AR',
    url: 'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419',
    defaultCategory: 'national',
    connectionType: 'google_news'
  }
];
