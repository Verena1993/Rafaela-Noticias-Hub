export const LOCAL_SOURCES = [
  'Radio Rafaela',
  'Castellanos',
  'La Opinión',
  'Rafaela Informa',
  'Municipalidad de Rafaela'
];

export const PROVINCIAL_SOURCES = [
  'LT10',
  'Uno Santa Fe',
  'Aire de Santa Fe',
  'Rosario3',
  'Diario El Ciudadano',
  'El Litoral',
  'La Capital'
];

export const NATIONAL_SOURCES = [
  'Clarín',
  'La Nación',
  'Infobae',
  'Página 12',
  'Télam',
  'Ministerio de Infraestructura',
  'Clarín Rural'
];

export const getSourceRegion = (source: string): 'local' | 'provincial' | 'national' | 'other' => {
  if (LOCAL_SOURCES.some(s => source.toLowerCase().includes(s.toLowerCase()))) return 'local';
  if (PROVINCIAL_SOURCES.some(s => source.toLowerCase().includes(s.toLowerCase()))) return 'provincial';
  if (NATIONAL_SOURCES.some(s => source.toLowerCase().includes(s.toLowerCase()))) return 'national';
  return 'other';
};
