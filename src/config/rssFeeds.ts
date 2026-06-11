import type { RadarCategory, ConnectionType } from '../types';

export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  defaultCategory: RadarCategory;
  connectionType: ConnectionType;
}

export const RSS_FEEDS: RssFeedConfig[] = [
  // ============================================
  // NACIONALES (Azul)
  // ============================================
  { id: 'infobae', name: 'Infobae', url: 'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'clarin', name: 'Clarín', url: 'https://www.clarin.com/rss/lo-ultimo/', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'lanacion', name: 'La Nación', url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'tn', name: 'TN', url: 'https://tn.com.ar/rss/', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'perfil', name: 'Perfil', url: 'https://www.perfil.com/feed', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'pagina12', name: 'Página 12', url: 'https://www.pagina12.com.ar/rss/portada', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'ambito', name: 'Ámbito', url: 'https://www.ambito.com/rss/home.xml', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'cronista', name: 'El Cronista', url: 'https://www.cronista.com/rss/feed.xml', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'c5n', name: 'C5N', url: 'https://www.c5n.com/rss/home.xml', defaultCategory: 'national', connectionType: 'rss2json_proxy' },
  { id: 'noticias_argentinas', name: 'Noticias Argentinas', url: 'https://noticiasargentinas.com/rss/', defaultCategory: 'national', connectionType: 'edge_function' },
  { id: 'telam', name: 'Agencia Télam', url: '', defaultCategory: 'national', connectionType: 'pending' },
  { id: 'google_news_ar', name: 'Google News Argentina', url: 'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419', defaultCategory: 'national', connectionType: 'google_news' },

  // ============================================
  // PROVINCIALES (Verde)
  // ============================================
  { id: 'rosario3', name: 'Rosario3', url: 'https://www.rosario3.com/rss/noticias.xml', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'lt10', name: 'LT10', url: 'https://lt10.com.ar/rss', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'airedesantafe', name: 'Aire de Santa Fe', url: 'https://www.airedesantafe.com.ar/rss/', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'ellitoral', name: 'El Litoral', url: 'https://www.ellitoral.com/rss/ultimas-noticias.xml', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'unosantafe', name: 'Uno Santa Fe', url: 'https://www.unosantafe.com.ar/rss/print.xml', defaultCategory: 'provincial', connectionType: 'rss2json_proxy' },
  { id: 'rosarioplus', name: 'Rosario Plus', url: 'https://www.rosarioplus.com/rss/', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'sinmordaza', name: 'Sin Mordaza', url: 'https://sinmordaza.com/feed/', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'notife', name: 'Notife', url: 'https://notife.com/feed/', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'telefesantafe', name: 'Telefe Santa Fe', url: 'https://santafe.mitelefe.com/rss', defaultCategory: 'provincial', connectionType: 'edge_function' },
  { id: 'radioeme', name: 'Radio EME', url: 'https://www.radioeme.com/feed/', defaultCategory: 'provincial', connectionType: 'edge_function' },

  // ============================================
  // LOCALES & REGIONALES (Amarillo)
  // ============================================
  { id: 'rafaela_noticias', name: 'Rafaela Noticias', url: 'https://www.rafaelanoticias.com/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'castellanos', name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/feed/', defaultCategory: 'local', connectionType: 'rss2json_proxy' },
  { id: 'rafaelainforma', name: 'Rafaela Informa', url: 'https://www.rafaelainforma.com/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'radiorafaela', name: 'Radio Rafaela', url: 'https://www.radiorafaela.com.ar/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'laopinion', name: 'La Opinión de Rafaela', url: 'https://www.diariolaopinion.com.ar/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'movil_quique', name: 'Móvil Quique', url: 'https://movilquique.com/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'rafaela_online', name: 'Rafaela Online', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'lt28', name: 'LT28 Radio Rafaela', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'sociedad_rural_rafaela', name: 'Sociedad Rural de Rafaela', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'unraf', name: 'Universidad Nacional de Rafaela (UNRaf)', url: '', defaultCategory: 'local', connectionType: 'pending' },

  { id: 'sunchales_hoy', name: 'Sunchales Hoy', url: 'https://sunchaleshoy.com.ar/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'eco_sunchales', name: 'El Eco de Sunchales', url: 'https://elecodesunchales.com.ar/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'portal_tacural', name: 'Portal de Tacural', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'portal_lehmann', name: 'Portal de Lehmann', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'portal_humberto', name: 'Portal de Humberto Primo', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'portal_san_vicente', name: 'Portal de San Vicente', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'esperanza_dia', name: 'Esperanza Día por Día', url: 'https://www.esperanzadiapordia.com.ar/feed/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'edicion_uno', name: 'Edición Uno Esperanza', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'reconquista_hoy', name: 'Reconquista Hoy', url: 'https://www.reconquistahoy.com/rss/', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'avellaneda_hoy', name: 'Avellaneda Hoy', url: '', defaultCategory: 'local', connectionType: 'pending' },

  // ============================================
  // ORGANISMOS Y DATOS OFICIALES (Asignados por ámbito geográfico)
  // ============================================
  { id: 'muni_rafaela', name: 'Municipalidad de Rafaela', url: 'https://www.rafaela.gob.ar/rss', defaultCategory: 'local', connectionType: 'edge_function' },
  { id: 'concejo_rafaela', name: 'Concejo Municipal de Rafaela', url: '', defaultCategory: 'local', connectionType: 'pending' },
  { id: 'gob_santa_fe', name: 'Gobierno de Santa Fe', url: 'https://www.santafe.gov.ar/rss', defaultCategory: 'provincial', connectionType: 'edge_function' },
  
  { id: 'gob_nacional', name: 'Gobierno Nacional', url: '', defaultCategory: 'national', connectionType: 'pending' },
  { id: 'casa_rosada', name: 'Casa Rosada', url: 'https://www.casarosada.gob.ar/?format=feed', defaultCategory: 'national', connectionType: 'edge_function' },
  { id: 'min_economia', name: 'Ministerio de Economía', url: '', defaultCategory: 'national', connectionType: 'pending' },
  { id: 'min_seguridad', name: 'Ministerio de Seguridad', url: '', defaultCategory: 'national', connectionType: 'pending' },
  { id: 'indec', name: 'INDEC', url: '', defaultCategory: 'national', connectionType: 'pending' },
  { id: 'camara_diputados', name: 'Cámara de Diputados', url: 'https://www.diputados.gob.ar/secparl/rss', defaultCategory: 'national', connectionType: 'edge_function' },
  { id: 'senado', name: 'Senado de la Nación', url: '', defaultCategory: 'national', connectionType: 'pending' },

  // ============================================
  // INTERNACIONALES (Mundo)
  // ============================================
  { id: 'bbc_mundo', name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', defaultCategory: 'international', connectionType: 'rss2json_proxy' },
  { id: 'cnn_espanol', name: 'CNN en Español', url: 'https://cnnespanol.cnn.com/feed/', defaultCategory: 'international', connectionType: 'rss2json_proxy' },
  { id: 'dw_espanol', name: 'DW Español', url: 'https://rss.dw.com/xml/rss-sp-all', defaultCategory: 'international', connectionType: 'rss2json_proxy' },
  { id: 'el_pais_espana', name: 'El País España', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', defaultCategory: 'international', connectionType: 'rss2json_proxy' },
  { id: 'france24_espanol', name: 'France24 Español', url: 'https://www.france24.com/es/rss', defaultCategory: 'international', connectionType: 'rss2json_proxy' }
];
