import type { User, Coverage, Task, Alert, CalendarEvent, Notification, Proposal, StaffSchedule, InstagramPost, NewsRadarItem } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin Principal', email: 'admin@rafaelanoticias.com', password: 'password123', role: 'admin', avatarColor: '#1e3a8a' },
  { id: 'u2', name: 'Mariano Redactor', email: 'mariano@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#0f766e' },
  { id: 'u3', name: 'Sofía Redactora', email: 'sofia@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#be123c' },
  { id: 'u4', name: 'Juan Carlos Redactor', email: 'juan@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#d97706' },
  { id: 'u5', name: 'Laura Redactora', email: 'laura@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#84cc16' },
  { id: 'u6', name: 'Diego Redactor', email: 'diego@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#06b6d4' },
  { id: 'u7', name: 'Esteban Redactor', email: 'esteban@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#6366f1' },
  { id: 'u8', name: 'Martina Redactora', email: 'martina@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#a855f7' },
  { id: 'u9', name: 'Andrés Redactor', email: 'andres@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#ec4899' },
  { id: 'u10', name: 'Clara Redactora', email: 'clara@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#14b8a6' },
  { id: 'u11', name: 'Valentina Redactora', email: 'valentina@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#f43f5e' },
  { id: 'u12', name: 'Mateo Redactor', email: 'mateo@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#10b981' },
  { id: 'u13', name: 'Pedro Redactor', email: 'pedro@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#64748b' },
  { id: 'u14', name: 'Gabriela Redactora', email: 'gabriela@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#fb923c' },
  { id: 'u15', name: 'Lucas Redactor', email: 'lucas@rafaelanoticias.com', password: 'password123', role: 'journalist', avatarColor: '#a7f3d0' }
];

export const INITIAL_COVERAGES: Coverage[] = [
  {
    id: 'c1',
    title: 'Grave choque múltiple en la Ruta Nacional 34 Km 220',
    description: 'Tres autos y un camión colisionaron a la altura del Km 220 de la Ruta 34. Tránsito cortado en ambas manos. Servicios de emergencia de Rafaela trabajando en el lugar. Reportar heridos, desvíos y testimonios de bomberos.',
    dateTime: '2026-06-04T07:15:00',
    location: 'Ruta Nacional 34, Km 220, Rafaela',
    status: 'confirmed',
    assignees: ['u5', 'u9'], // Laura and Andrés
    comments: [
      {
        id: 'com1',
        userId: 'u5',
        userName: 'Laura Móvil 1',
        text: 'Llegué al lugar. El tránsito está totalmente interrumpido. Hay desvíos por caminos rurales.',
        timestamp: '2026-06-04T07:32:00'
      },
      {
        id: 'com2',
        userId: 'u9',
        userName: 'Andrés Fotografía',
        text: 'Ya tomé las primeras fotos de los vehículos. Se las acabo de pasar al enlace de Drive.',
        timestamp: '2026-06-04T07:45:00'
      },
      {
        id: 'com3',
        userId: 'u2',
        userName: 'Mariano Editor',
        text: '@Laura Móvil 1 intentá hablar con el jefe de Bomberos para tener el parte oficial de heridos.',
        timestamp: '2026-06-04T07:50:00'
      }
    ],
    multimedia: [
      {
        id: 'm1',
        type: 'photo',
        name: 'choque_camion_frontal.jpg',
        url: 'https://images.unsplash.com/photo-1594913785162-e6785b493c22?auto=format&fit=crop&w=800&q=80',
        size: '2.4 MB',
        uploadDate: '2026-06-04T07:42:00',
        userId: 'u9'
      },
      {
        id: 'm2',
        type: 'audio',
        name: 'testimonio_bombero_ruiz.mp3',
        url: '#',
        size: '4.8 MB',
        uploadDate: '2026-06-04T08:05:00',
        userId: 'u5'
      }
    ],
    sharedLinks: [
      {
        id: 'sl1',
        title: 'Carpeta de Fotos en Alta - Drive',
        url: 'https://drive.google.com/drive/folders/1abc987654321xyz',
        uploadDate: '2026-06-04T07:44:00',
        userId: 'u9',
        comments: 'Fotos sin comprimir para el portal web y redes'
      },
      {
        id: 'sl2',
        title: 'WeTransfer con Video Crudo (Movil)',
        url: 'https://wetransfer.com/downloads/123456',
        uploadDate: '2026-06-04T08:08:00',
        userId: 'u5',
        comments: 'Declaraciones en video del subcomisario a cargo.'
      }
    ],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'published', date: '2026-06-04T07:55:00', userId: 'u11' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act1', userId: 'u2', userName: 'Mariano Editor', action: 'creó la cobertura y asignó a Laura Móvil 1', timestamp: '2026-06-04T07:18:00' },
      { id: 'act2', userId: 'u2', userName: 'Mariano Editor', action: 'asignó a Andrés Fotografía', timestamp: '2026-06-04T07:20:00' },
      { id: 'act3', userId: 'u9', userName: 'Andrés Fotografía', action: 'agregó archivo choque_camion_frontal.jpg', timestamp: '2026-06-04T07:42:00' },
      { id: 'act4', userId: 'u9', userName: 'Andrés Fotografía', action: 'agregó enlace externo Carpeta de Fotos en Alta - Drive', timestamp: '2026-06-04T07:44:00' },
      { id: 'act5', userId: 'u11', userName: 'Valentina Redes', action: 'marcó como PUBLICADA en Instagram Historia', timestamp: '2026-06-04T07:55:00' }
    ],
    programs: ['Bien Despiertos', 'Digital'],
    formats: ['Móvil', 'Vivo en redes']
  },
  {
    id: 'c2',
    title: 'Sesión extraordinaria en el Concejo Deliberante por el Presupuesto 2026',
    description: 'Los concejales debaten el presupuesto para obras viales de la ciudad. Se prevén cruces fuertes entre oficialismo y oposición por la tasa de seguridad. Cobertura en directo de los discursos clave.',
    dateTime: '2026-06-04T09:00:00',
    location: 'Concejo Municipal de Rafaela, Bv. Lehmann 380',
    status: 'pending_confirmation',
    assignees: ['u4'], // Juan Carlos
    comments: [],
    multimedia: [],
    sharedLinks: [],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act2_1', userId: 'u3', userName: 'Sofía Jefa de Redacción', action: 'creó la cobertura programada', timestamp: '2026-06-03T18:30:00' }
    ],
    programs: ['Noticiero Mañana', 'Digital'],
    formats: ['Presencial']
  },
  {
    id: 'c3',
    title: 'Inauguración del nuevo Centro Recreativo en Barrio Mora',
    description: 'El Intendente inaugura una plaza inclusiva con canchas de fútbol tenis, juegos interactivos e iluminación LED. Habrá feria de artesanos y espectáculos de bandas locales.',
    dateTime: '2026-06-03T17:00:00',
    location: 'Barrio Mora (Plaza Principal)',
    status: 'in_redaction',
    assignees: ['u7', 'u10'], // Esteban and Clara
    comments: [
      {
        id: 'com3_1',
        userId: 'u7',
        userName: 'Esteban Crónicas',
        text: 'La nota escrita está lista y corregida en el Drive. Incluí testimonios de dos vecinas que están muy contentas.',
        timestamp: '2026-06-03T19:30:00'
      },
      {
        id: 'com3_2',
        userId: 'u10',
        userName: 'Clara Cámara',
        text: 'Cargué el enlace de TransferNow con los videos de los discursos y el corte de cinta.',
        timestamp: '2026-06-03T19:45:00'
      }
    ],
    multimedia: [
      {
        id: 'm3_1',
        type: 'photo',
        name: 'corte_cinta_intendente.jpg',
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
        size: '1.8 MB',
        uploadDate: '2026-06-03T19:22:00',
        userId: 'u10'
      }
    ],
    sharedLinks: [
      {
        id: 'sl3_1',
        title: 'Nota redactada - Borrador Drive',
        url: 'https://docs.google.com/document/d/1borrador_mora_123',
        uploadDate: '2026-06-03T19:28:00',
        userId: 'u7',
        comments: 'Listo para volcar al administrador de contenidos de la web.'
      },
      {
        id: 'sl3_2',
        title: 'TransferNow - Videos del Acto',
        url: 'https://transfernow.net/d/actomora_rafaela',
        uploadDate: '2026-06-03T19:40:00',
        userId: 'u10',
        comments: 'Material en crudo para Reels y Canal de Youtube.'
      }
    ],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act3_1', userId: 'u3', userName: 'Sofía Jefa de Redacción', action: 'creó la cobertura', timestamp: '2026-06-03T15:00:00' },
      { id: 'act3_2', userId: 'u7', userName: 'Esteban Crónicas', action: 'agregó enlace externo de borrador', timestamp: '2026-06-03T19:28:00' },
      { id: 'act3_3', userId: 'u10', userName: 'Clara Cámara', action: 'marcó la cobertura como LISTA PARA PUBLICAR', timestamp: '2026-06-03T19:50:00' }
    ],
    programs: ['Bien Despiertos', 'Noticiero Tarde'],
    formats: ['Grabada']
  },
  {
    id: 'c4',
    title: 'Previa de Atlético de Rafaela vs. Aldosivi en el Monumental',
    description: 'El plantel de la Crema realiza su último entrenamiento táctico antes del trascendental partido de local. Entrevista con el entrenador sobre el equipo titular.',
    dateTime: '2026-06-04T18:00:00',
    location: 'Estadio Monumental de Alberdi, Rafaela',
    status: 'pending_confirmation',
    assignees: ['u14'], // Gabriela
    comments: [],
    multimedia: [],
    sharedLinks: [],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act4_1', userId: 'u2', userName: 'Mariano Editor', action: 'programó cobertura deportiva', timestamp: '2026-06-04T08:00:00' }
    ],
    programs: ['Digital'],
    formats: ['Vivo en redes']
  },
  {
    id: 'c5',
    title: 'Grave incendio en una fábrica de colchones del Parque Industrial',
    description: 'Dotaciones de bomberos de Rafaela y localidades vecinas trabajaron por más de 5 hours para sofocar las llamas. Pérdidas totales pero sin víctimas graves confirmadas.',
    dateTime: '2026-06-03T11:00:00',
    location: 'Parque Industrial de Rafaela, calle 500',
    status: 'published',
    assignees: ['u6', 'u9', 'u11'], // Diego, Andres, Valentina
    comments: [
      {
        id: 'com5_1',
        userId: 'u6',
        userName: 'Diego Móvil 2',
        text: 'La nota ya está arriba. Tuvo un impacto gigante en visitas durante la tarde.',
        timestamp: '2026-06-03T15:20:00'
      }
    ],
    multimedia: [
      {
        id: 'm5_1',
        type: 'photo',
        name: 'humo_incendio_fabrica.jpg',
        url: 'https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&w=800&q=80',
        size: '3.1 MB',
        uploadDate: '2026-06-03T11:35:00',
        userId: 'u9'
      }
    ],
    sharedLinks: [
      {
        id: 'sl5_1',
        title: 'Portal Web Rafaela Noticias - Nota publicada',
        url: 'https://rafaelanoticias.com/policiales/grave-incendio-fabrica-colchones-parque-industrial',
        uploadDate: '2026-06-03T14:10:00',
        userId: 'u6',
        comments: 'Nota principal del portal'
      }
    ],
    publications: {
      portal: { status: 'published', date: '2026-06-03T14:10:00', userId: 'u6', link: 'https://rafaelanoticias.com/policiales/grave-incendio-fabrica-colchones-parque-industrial' },
      facebook: { status: 'published', date: '2026-06-03T14:12:00', userId: 'u11' },
      instagram: { status: 'published', date: '2026-06-03T14:15:00', userId: 'u11' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act5_1', userId: 'u2', userName: 'Mariano Editor', action: 'creó cobertura urgente', timestamp: '2026-06-03T11:05:00' },
      { id: 'act5_2', userId: 'u6', userName: 'Diego Móvil 2', action: 'publicó nota en Portal Web', timestamp: '2026-06-03T14:10:00' },
      { id: 'act5_3', userId: 'u11', userName: 'Valentina Redes', action: 'publicó en Facebook', timestamp: '2026-06-03T14:12:00' },
      { id: 'act5_4', userId: 'u11', userName: 'Valentina Redes', action: 'marcó cobertura como PUBLICADA GENERAL', timestamp: '2026-06-03T14:20:00' }
    ],
    programs: ['Digital', 'Noticiero Tarde'],
    formats: ['Móvil']
  },
  {
    id: 'c_e4',
    title: 'Conferencia de Prensa Liga Rafaelina',
    description: 'Anuncios sobre la copa de campeones locales.',
    dateTime: '2026-06-05T10:00:00',
    location: 'Sede de la Liga Rafaelina',
    status: 'confirmed',
    assignees: ['u14'],
    comments: [],
    multimedia: [],
    sharedLinks: [],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act_e4_1', userId: 'system', userName: 'Sistema', action: 'creó la cobertura a partir del evento de agenda', timestamp: '2026-06-04T11:00:00' }
    ],
    programs: ['Digital'],
    formats: ['Telefónica']
  },
  {
    id: 'c_e5',
    title: 'Entrevista Exclusiva: Candidato a Senador',
    description: 'Sofía entrevista al candidato opositor.',
    dateTime: '2026-06-06T15:30:00',
    location: 'Estudios del Canal',
    status: 'confirmed',
    assignees: ['u8'],
    comments: [],
    multimedia: [],
    sharedLinks: [],
    publications: {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: [
      { id: 'act_e5_1', userId: 'system', userName: 'Sistema', action: 'creó la cobertura a partir del evento de agenda', timestamp: '2026-06-04T11:00:00' }
    ],
    programs: ['Bien Despiertos'],
    formats: ['Videollamada']
  }
];

export const INITIAL_NEWS_RADAR: NewsRadarItem[] = [];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', coverageId: 'c1', title: 'Entrevistar al Jefe de Bomberos en el lugar', assigneeId: 'u5', dueDate: '2026-06-04T09:00', completed: false },
  { id: 't2', coverageId: 'c1', title: 'Subir lote de fotos aéreas al Drive', assigneeId: 'u9', dueDate: '2026-06-04T08:30', completed: true },
  { id: 't3', coverageId: 'c1', title: 'Armar placa urgente para Instagram', assigneeId: 'u11', dueDate: '2026-06-04T08:00', completed: true },
  { id: 't4', coverageId: 'c2', title: 'Conseguir copia digital del proyecto de presupuesto', assigneeId: 'u4', dueDate: '2026-06-04T11:00', completed: false },
  { id: 't5', coverageId: 'c3', title: 'Volcar nota en el CMS del portal web', assigneeId: 'u11', dueDate: '2026-06-04T12:00', completed: false },
  { id: 't6', title: 'Actualizar grilla de pautas publicitarias de junio', assigneeId: 'u1', dueDate: '2026-06-04T18:00', completed: false },
  { id: 't7', title: 'Limpieza y mantenimiento de lentes de cámara principal', assigneeId: 'u9', dueDate: '2026-06-03T18:00', completed: true }
];

export const INITIAL_ALERTS: Alert[] = [
  { id: 'a1', title: '¡Urgente! Incendio de vivienda en Barrio Alberdi. Bomberos en camino.', timestamp: '2026-06-04T08:15:00', severity: 'critical', status: 'active', sourceName: 'Diario Castellanos', sourceUrl: 'https://diariocastellanos.com.ar', publishedAt: '2026-06-04T08:10:00', category: 'local', region: 'Rafaela' },
  { id: 'a2', title: 'Alerta vial: Corte total en Av. Santa Fe por reclamo vecinal.', timestamp: '2026-06-04T08:25:00', severity: 'high', status: 'active', sourceName: 'Radio Rafaela', sourceUrl: 'https://radiorafaela.com.ar', publishedAt: '2026-06-04T08:20:00', category: 'local', region: 'Rafaela' }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Inauguración Centro Barrio Mora',
    description: 'Acto municipal con presencia del Intendente.',
    type: 'event',
    start: '2026-06-03T17:00',
    end: '2026-06-03T19:00',
    location: 'Plaza Barrio Mora',
    status: 'in_redaction',
    assigneeId: 'u7',
    coverageId: 'c3', // Linked to c3
    programs: ['Bien Despiertos', 'Noticiero Tarde'],
    formats: ['Grabada']
  },
  {
    id: 'e2',
    title: 'Grave Choque Ruta 34 Km 220',
    description: 'Accidente en ruta con móviles en vivo.',
    type: 'coverage',
    start: '2026-06-04T07:15',
    end: '2026-06-04T11:30',
    location: 'Ruta 34 Km 220',
    status: 'confirmed',
    assigneeId: 'u5',
    coverageId: 'c1',
    programs: ['Bien Despiertos', 'Digital'],
    formats: ['Móvil', 'Vivo en redes']
  },
  {
    id: 'e3',
    title: 'Concejo: Presupuesto 2026',
    description: 'Sesión extraordinaria sobre presupuesto anual.',
    type: 'press_conference',
    start: '2026-06-04T09:00',
    end: '2026-06-04T13:00',
    location: 'Concejo Deliberante',
    status: 'pending_confirmation',
    assigneeId: 'u4',
    coverageId: 'c2',
    programs: ['Noticiero Mañana', 'Digital'],
    formats: ['Presencial']
  },
  {
    id: 'e4',
    title: 'Conferencia de Prensa Liga Rafaelina',
    description: 'Anuncios sobre la copa de campeones locales.',
    type: 'press_conference',
    start: '2026-06-05T10:00',
    end: '2026-06-05T11:30',
    location: 'Sede de la Liga Rafaelina',
    status: 'confirmed',
    assigneeId: 'u14',
    coverageId: 'c_e4', // Linked to c_e4
    programs: ['Digital'],
    formats: ['Telefónica']
  },
  {
    id: 'e5',
    title: 'Entrevista Exclusiva: Candidato a Senador',
    description: 'Sofía entrevista al candidato opositor.',
    type: 'interview',
    start: '2026-06-06T15:30',
    end: '2026-06-06T16:30',
    location: 'Estudios del Canal',
    status: 'confirmed',
    assigneeId: 'u8',
    coverageId: 'c_e5', // Linked to c_e5
    programs: ['Bien Despiertos'],
    formats: ['Videollamada']
  },
  {
    id: 'e_c4',
    title: 'Previa de Atlético de Rafaela vs. Aldosivi en el Monumental',
    description: 'El plantel de la Crema realiza su último entrenamiento táctico antes del trascendental partido de local. Entrevista con el entrenador sobre el equipo titular.',
    type: 'coverage',
    start: '2026-06-04T18:00',
    end: '2026-06-04T22:00',
    location: 'Estadio Monumental de Alberdi, Rafaela',
    status: 'pending_confirmation',
    assigneeId: 'u14',
    coverageId: 'c4', // Linked to c4
    programs: ['Digital'],
    formats: ['Vivo en redes']
  },
  {
    id: 'e_c5',
    title: 'Grave incendio en una fábrica de colchones del Parque Industrial',
    description: 'Dotaciones de bomberos de Rafaela y localidades vecinas trabajaron por más de 5 hours para sofocar las llamas. Pérdidas totales pero sin víctimas graves confirmadas.',
    type: 'coverage',
    start: '2026-06-03T11:00',
    end: '2026-06-03T15:00',
    location: 'Parque Industrial de Rafaela, calle 500',
    status: 'published',
    assigneeId: 'u6',
    coverageId: 'c5', // Linked to c5
    programs: ['Digital', 'Noticiero Tarde'],
    formats: ['Móvil']
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Nueva Cobertura Asignada', message: 'Se te asignó en: Grave choque múltiple en la Ruta Nacional 34.', timestamp: '2026-06-04T07:20:00', read: false, type: 'coverage', linkId: 'c1' },
  { id: 'n2', title: 'Nuevo Comentario', message: 'Mariano Editor te mencionó en un comentario de la cobertura.', timestamp: '2026-06-04T07:51:00', read: false, type: 'comment', linkId: 'c1' },
  { id: 'n3', title: 'Alerta Crítica', message: '¡Urgente! Incendio de vivienda en Barrio Alberdi.', timestamp: '2026-06-04T08:15:00', read: false, type: 'alert' }
];

export const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 'prop1',
    title: 'Denuncia vecinal: Basural clandestino crónico en Barrio Italia',
    description: 'Vecinos de calle Joaquín V. González denuncian la acumulación de basura y roedores. Indican que camiones particulares tiran escombros por las noches. Tomar fotos y hablar con la comisión vecinal.',
    dateTime: '2026-06-05T10:30',
    location: 'Joaquín V. González al 1200, Barrio Italia, Rafaela',
    multimedia: [],
    sharedLinks: [],
    comments: [
      { id: 'pc1', userId: 'u7', userName: 'Esteban Crónicas', text: 'Me pasaron un video corto de los vecinos que muestra los roedores a plena luz del día.', timestamp: '2026-06-04T08:45:00' }
    ],
    priority: 'medium',
    status: 'new',
    assignees: [],
    programs: ['Digital'],
    formats: ['Presencial']
  },
  {
    id: 'prop2',
    title: 'Maratón Solidaria ALPI 2026',
    description: 'Evento deportivo anual para registrar fondos para ALPI Rafaela. Habrá recorridos de 5K y 10K. Entrevistar a los organizadores y reportar la concurrencia.',
    dateTime: '2026-06-07T09:00',
    location: 'Plaza 25 de Mayo (Punto de largada)',
    multimedia: [
      {
        id: 'pm1',
        type: 'photo',
        name: 'flyer_maraton_alpi.jpg',
        url: 'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=800&q=80',
        size: '1.4 MB',
        uploadDate: '2026-06-03T16:00:00',
        userId: 'u11'
      }
    ],
    sharedLinks: [
      { id: 'psl1', title: 'Flyer Oficial ALPI Drive', url: 'https://drive.google.com/file/d/1alpi_flyer_123', uploadDate: '2026-06-03T16:05:00', userId: 'u11' }
    ],
    comments: [],
    priority: 'low',
    status: 'approved',
    assignees: ['u11'],
    programs: ['Digital', 'Bien Despiertos'],
    formats: ['Móvil']
  },
  {
    id: 'prop3',
    title: 'Proyecto de ordenanza sobre monopatines eléctricos',
    description: 'Un concejal presentará un proyecto para regular el uso, velocidad y medidas de seguridad de monopatines en Rafaela. Analizar ordenanzas de Santa Fe como antecedente.',
    priority: 'medium',
    status: 'in_evaluation',
    multimedia: [],
    sharedLinks: [],
    comments: [],
    assignees: ['u4'],
    programs: ['Noticiero Mañana'],
    formats: ['Grabada']
  }
];

export const INITIAL_STAFF_SCHEDULE: StaffSchedule[] = [
  {
    date: '2026-06-01',
    guardIds: ['u5'],
    vacationIds: ['u4'],
    absentIds: [],
    offIds: ['u6']
  },
  {
    date: '2026-06-02',
    guardIds: ['u6'],
    vacationIds: ['u4'],
    absentIds: ['u9'],
    offIds: ['u5']
  },
  {
    date: '2026-06-03',
    guardIds: ['u7'],
    vacationIds: ['u4'],
    absentIds: [],
    offIds: ['u8']
  },
  {
    date: '2026-06-04', // Today Thursday
    guardIds: ['u11', 'u12'],
    vacationIds: ['u4'],
    absentIds: [],
    offIds: ['u13']
  },
  {
    date: '2026-06-05', // Friday
    guardIds: ['u5'],
    vacationIds: ['u4'],
    absentIds: ['u7'],
    offIds: ['u11']
  },
  {
    date: '2026-06-06', // Saturday
    guardIds: ['u8'],
    vacationIds: ['u4'],
    absentIds: [],
    offIds: ['u12']
  },
  {
    date: '2026-06-07', // Sunday
    guardIds: ['u6', 'u9'],
    vacationIds: ['u4'],
    absentIds: [],
    offIds: ['u5']
  }
];

export const INITIAL_INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'ig1',
    date: '2026-06-04',
    time: '08:00',
    title: 'Reel: Choque Ruta 34 en vivo',
    type: 'reel',
    assigneeId: 'u11',
    status: 'published'
  },
  {
    id: 'ig2',
    date: '2026-06-04',
    time: '09:30',
    title: 'Historia: Conferencia prensa intendente',
    type: 'story',
    assigneeId: 'u12',
    status: 'scheduled'
  },
  {
    id: 'ig3',
    date: '2026-06-04',
    time: '11:15',
    title: 'Carrusel: Imágenes exclusivas del bache en Lehmann',
    type: 'carousel',
    assigneeId: 'u11',
    status: 'in_production'
  },
  {
    id: 'ig4',
    date: '2026-06-04',
    time: '14:00',
    title: 'Publicación: Comunicado del Concejo Deliberante',
    type: 'simple',
    assigneeId: 'u12',
    status: 'idea'
  }
];

