export const LOCAL_SOURCES = [
  'Rafaela Noticias',
  'Diario Castellanos',
  'Castellanos',
  'Radio Rafaela',
  'Rafaela Informa',
  'Móvil Quique',
  'Movil Quique',
  'Sunchales Hoy',
  'La Opinión de Rafaela',
  'La Opinión',
  'El Eco de Sunchales',
  'Municipalidad de Rafaela',
  'Concejo Municipal de Rafaela'
];

export const PROVINCIAL_SOURCES = [
  'Diario El Ciudadano',
  'Rosario3',
  'El Litoral',
  'LT10',
  'Aire de Santa Fe',
  'UNO Santa Fe',
  'Uno Santa Fe',
  'Sin Mordaza',
  'Radio EME',
  'Gobierno de Santa Fe',
  'Telefe Santa Fe',
  'Rosario Plus',
  'Notife'
];

export const NATIONAL_SOURCES = [
  'Clarín',
  'Clarin',
  'La Nación',
  'La Nacion',
  'Infobae',
  'Perfil',
  'Ámbito',
  'Ambito',
  'TN',
  'C5N',
  'Página 12',
  'Pagina 12',
  'Noticias Argentinas',
  'El Cronista',
  'Cronista',
  'Agencia Télam',
  'Télam',
  'Telam',
  'Google News Argentina',
  'Google News AR',
  'Casa Rosada',
  'Cámara de Diputados'
];

export const INTERNATIONAL_SOURCES = [
  'BBC Mundo',
  'BBC',
  'CNN en Español',
  'CNN',
  'DW Español',
  'DW',
  'El País España',
  'El Pais',
  'France24 Español',
  'France24'
];

export const getSourceRegion = (source: string): 'local' | 'provincial' | 'national' | 'international' => {
  const normalized = source.toLowerCase();
  if (LOCAL_SOURCES.some(s => normalized.includes(s.toLowerCase()))) return 'local';
  if (PROVINCIAL_SOURCES.some(s => normalized.includes(s.toLowerCase()))) return 'provincial';
  if (NATIONAL_SOURCES.some(s => normalized.includes(s.toLowerCase()))) return 'national';
  if (INTERNATIONAL_SOURCES.some(s => normalized.includes(s.toLowerCase()))) return 'international';
  return 'international'; // fallback to international or national as needed, let's fallback to international for unknown
};
