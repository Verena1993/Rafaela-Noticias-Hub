export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'journalist';
  avatarColor: string;
  activo?: boolean;
  created_at?: string;
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

export interface Coverage {
  id: string;
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

export interface Proposal {
  id: string;
  title: string;
  description: string;
  dateTime?: string; // Event date if applicable
  location?: string;
  multimedia: MultimediaItem[];
  sharedLinks: SharedLink[];
  comments: Comment[];
  priority?: 'high' | 'medium' | 'low';
  status: 'new' | 'in_evaluation' | 'approved' | 'rejected' | 'assigned' | 'covered';
  assignees: string[]; // members working on evaluating or drafted it
  programs?: ProgramType[];
  formats?: FormatType[];
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
