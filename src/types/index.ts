export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor';
  avatarColor: string;
  activo?: boolean;
  created_at?: string;
  ultimo_acceso?: string;
  telefono?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
}

export interface MultimediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  name: string;
  url: string;
  size: string;
  uploadDate: string;
  userId: string;
}

export interface SharedLink {
  id: string;
  title: string;
  url: string;
  uploadDate: string;
  userId: string;
  comments?: string;
}

export interface PublicationStatus {
  status: 'pending' | 'published';
  date?: string;
  userId?: string;
  link?: string;
}

export interface PublicationChecklist {
  portal: PublicationStatus;
  facebook: PublicationStatus;
  instagram: PublicationStatus;
  youtube: PublicationStatus;
}

export type ProgramType = 'Bien Despiertos' | 'Noticiero Mañana' | 'Noticiero Tarde' | 'Digital';
export type FormatType = 'Telefónica' | 'Videollamada' | 'Presencial' | 'Móvil' | 'Grabada' | 'Vivo redes';

// Status: 4 unified editorial states
export type CoverageStatus = 'pending_confirmation' | 'confirmed' | 'in_redaction' | 'published';
export type EventStatus = 'pending_confirmation' | 'confirmed' | 'in_redaction' | 'published';

/**
 * @deprecated Capa de adaptación transitoria - Sólo para compilación del Dashboard.
 */
export interface Coverage {
  id: string;
  proposalId?: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  status: CoverageStatus;
  assignees: string[]; // User IDs
  comments: Comment[];
  multimedia: MultimediaItem[];
  sharedLinks: SharedLink[];
  publications: PublicationChecklist;
  activities: Activity[];
  programs?: ProgramType[];
  formats?: FormatType[];
  logisticsInfo?: string;
  observations?: string;
  attachments?: string[];
  categoryId?: string;
}

// DEFINITIVE PRODUCTION MODEL (ETAPA 1 MIGRACIÓN)
export type ProductionStatus = 'pendiente_planificacion' | 'programada' | 'finalizada' | 'suspendida';

export interface Production {
  id: string;
  proposalId?: string; // Nullable/Optional for direct creation
  title: string;
  description?: string;
  categoryId?: string;
  journalistId?: string;
  photographerId?: string;
  cameramanId?: string;
  mediaOutlets: string[]; // Destination platforms
  formatId?: string;
  priority: 'high' | 'medium' | 'low';
  productionDate?: string; // YYYY-MM-DD
  productionTime?: string; // HH:mm
  location?: string;
  observations?: string;
  multimedia: MultimediaItem[];
  sharedLinks: SharedLink[];
  status: ProductionStatus;
  createdAt?: string;
}

export type RadarCategory = 'national' | 'provincial' | 'regional' | 'local' | 'international';

export interface NewsRadarItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string; // ISO date string (pubDate original del RSS)
  detectedAt?: string; // ISO date string — momento en que el sistema detectó la noticia
  category: RadarCategory;
  url?: string; // Original article URL (for future API integration)
  tags?: string[];
  draft?: string; // AI-generated draft content
  sentToEditor?: boolean;
  trendLevel?: 'Muy caliente' | 'En crecimiento' | 'Moderada';
  views?: string;
  socialPlatform?: 'tiktok' | 'instagram' | 'x' | 'youtube' | 'local';
  editorialScore?: number;
  motivoClasificacion?: string;
  region?: string;
  priority?: number;
}

export type ConnectionType = 'rss_direct' | 'rss2json_proxy' | 'edge_function' | 'google_news' | 'social_api' | 'pending' | 'html_scraping';

export interface RssDiagnostic {
  id: string;
  name: string;
  url: string;
  status: 'OK' | 'ERROR' | 'PENDING';
  itemCount: number;
  message?: string;
  reason?: string;
  lastChecked: string;
  connectionType: ConnectionType;
  responseTimeMs?: number;
}

/**
 * @deprecated Capa de adaptación transitoria - Sólo para compilación del Dashboard.
 */
export interface Task {
  id: string;
  coverageId?: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: 'coverage' | 'press_conference' | 'interview' | 'event' | 'key_date';
  start: string; // YYYY-MM-DDTHH:mm
  end: string;   // YYYY-MM-DDTHH:mm
  location?: string;
  status: EventStatus;
  assigneeId?: string;
  coverageId?: string;
  programs?: ProgramType[];
  formats?: FormatType[];
}
export interface ProposalDecision {
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'requiere_cambios';
  timestamp: string;
  note?: string;
  deciderName: string;
}

export interface Proposal {
  id: string;
  proposalNumber?: number;
  title: string;
  description: string;
  dateTime?: string; // Event date if applicable
  location?: string;
  multimedia: MultimediaItem[];
  sharedLinks: SharedLink[];
  comments: Comment[];
  priority?: 'high' | 'medium' | 'low';
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'requiere_cambios';
  assignees: string[]; // members working on evaluating or drafted it
  programs?: ProgramType[];
  formats?: FormatType[];
  createdAt: string;
  authorId: string;
  authorName: string;
  decisionHistory: ProposalDecision[];
  sourceTypeId?: string;
  sourceName?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface StaffSchedule {
  date: string; // YYYY-MM-DD
  guardIds: string[];
  vacationIds: string[];
  absentIds: string[];
  offIds: string[]; // francos
}

export interface InstagramPost {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  type: 'reel' | 'carousel' | 'story' | 'simple';
  assigneeId?: string;
  status: 'idea' | 'in_production' | 'ready' | 'scheduled' | 'published';
}

export interface Alert {
  id: string;
  title: string;
  timestamp: string;
  severity: 'critical' | 'urgent' | 'high' | 'medium' | 'normal';
  status: 'active' | 'followed_up';
  assigneeId?: string;
  coverageId?: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt?: string;
  category?: string;
  region?: string;
  classificationReason?: string;
  priority?: number;
}

export interface Activity {
  id: string;
  coverageId?: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'comment' | 'task' | 'coverage';
  linkId?: string; // CoverageId or TaskId
}

// Predefined 15 users for the Rafaela Noticias newsroom

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  active: boolean;
  created_at?: string;
}

