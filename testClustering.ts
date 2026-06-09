import { clusterItems } from './src/utils/topicClustering';
import type { NewsRadarItem } from './src/data/mockData';

const testItems: NewsRadarItem[] = [
  // Ejemplos dados por el usuario
  { id: '1', title: 'Accidente en Ruta 34', summary: '', source: 'Radio Rafaela', date: '2026-06-04T08:00:00', category: 'local' },
  { id: '2', title: 'Choque en Ruta Nacional 34', summary: '', source: 'La Opinión', date: '2026-06-04T08:15:00', category: 'local' },
  { id: '3', title: 'Siniestro vial cerca de Rafaela', summary: '', source: 'Castellanos', date: '2026-06-04T08:30:00', category: 'local' },
  
  { id: '4', title: 'Incendio en zona rural', summary: '', source: 'Radio Rafaela', date: '2026-06-04T09:00:00', category: 'provincial' },
  { id: '5', title: 'Fuego en establecimiento agropecuario', summary: '', source: 'La Opinión', date: '2026-06-04T09:10:00', category: 'provincial' },
  { id: '6', title: 'Bomberos trabajan en incendio de campo', summary: '', source: 'Castellanos', date: '2026-06-04T09:30:00', category: 'provincial' },

  // A different unrelated event
  { id: '7', title: 'El Intendente presentó el nuevo presupuesto de obras públicas', summary: 'Se destinarán fondos para pavimentación en Rafaela.', source: 'Municipalidad', date: '2026-06-04T10:00:00', category: 'local' }
];

const topics = clusterItems(testItems);

console.log(`\n=== RESULTADOS DE AGRUPACIÓN (Fase 1: TEMAS) ===`);
console.log(`Artículos originales: ${testItems.length}`);
console.log(`Temas detectados: ${topics.length}\n`);

topics.forEach((topic, idx) => {
  const score = topic.editorialScore;
  console.log(`TEMA ${idx + 1}: [${score?.priority.toUpperCase()}] ${topic.title.toUpperCase()}`);
  console.log(`- Score: ${score?.score} / 100`);
  console.log(`- Motivo: ${score?.reasoning}`);
  console.log(`- Banderas: Crecimiento=${score?.flags.enCrecimiento}, Impacto Local=${score?.flags.impactoLocal}, Multifuente=${score?.flags.multifuente}, Posible Exclusiva=${score?.flags.posibleExclusiva}`);
  console.log(`- Artículos: ${topic.articleCount} | Medios: ${topic.mediaCount}`);
  console.log(`- Categoría: ${topic.category} | Alcance: ${topic.geoScope} | Actividad: ${topic.activityLevel}`);
  console.log(`- Primer medio: ${topic.firstMedia} | Último: ${topic.lastMedia}`);
  console.log(`- Artículos agrupados:`);
  topic.items.forEach(i => console.log(`   * [${i.source}] ${i.title}`));
  console.log('----------------------------------------------------');
});
