export const MEDIA_PRIORITY = [
  'Radio Rafaela',
  'Castellanos',
  'La Opinión',
  'Rafaela Informa',
  'Movil Quique',
  'LT10',
  'Uno Santa Fe',
  'Rosario3',
  'Aire de Santa Fe'
];

export const EDITORIAL_FILTERS = [
  'Todas',
  'Accidentes',
  'Policiales',
  'Política',
  'Economía',
  'Sociedad',
  'Deportes',
  'Salud',
  'Servicios',
  'Clima'
];

export const ALERT_CRITICAL_KEYWORDS = [
  'accidente',
  'incendio',
  'allanamiento',
  'homicidio',
  'operativo policial',
  'corte de ruta',
  'tormenta',
  'inundacion',
  'inundación',
  'conflicto gremial',
  'paro',
  'política'
];

// Map filter names to keywords for basic text search if category doesn't strictly match
export const FILTER_KEYWORDS: Record<string, string[]> = {
  'Accidentes': ['accidente', 'choque', 'siniestro', 'vuelco'],
  'Policiales': ['policial', 'robo', 'asalto', 'hurto', 'detenido', 'allanamiento', 'homicidio'],
  'Política': ['política', 'intendente', 'concejo', 'gobernador', 'pullaro', 'milei', 'elecciones', 'municipio'],
  'Economía': ['economía', 'dólar', 'inflación', 'aumento', 'precio', 'paritaria', 'presupuesto'],
  'Sociedad': ['sociedad', 'vecinos', 'barrio', 'comunidad', 'evento', 'fiesta'],
  'Deportes': ['deporte', 'atlético', 'fútbol', 'básquet', 'carrera', 'cremonese', 'ben hur', '9 de julio'],
  'Salud': ['salud', 'hospital', 'dengue', 'médico', 'vacuna', 'samco'],
  'Servicios': ['servicio', 'agua', 'luz', 'epe', 'assa', 'corte de energía', 'recolección'],
  'Clima': ['clima', 'tormenta', 'lluvia', 'calor', 'alerta meteorológica', 'tiempo']
};
