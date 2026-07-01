import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { INITIAL_TASKS, INITIAL_ALERTS, INITIAL_NOTIFICATIONS, INITIAL_STAFF_SCHEDULE, INITIAL_INSTAGRAM_POSTS, INITIAL_NEWS_RADAR } from '../data/initialData';

import type { User, Coverage, Task, Production, ProductionStatus, CoverageStatus, Alert, CalendarEvent, Notification, Activity, Comment, MultimediaItem, SharedLink, PublicationChecklist, Proposal, ProposalDecision, StaffSchedule, ProgramType, FormatType, InstagramPost, NewsRadarItem, RssDiagnostic, Category } from '../types';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseAdminClient = createClient(
  'https://htujxxcfoiumykhmpbwe.supabase.co',
  'sb_publishable_-92NeVbbQCIdgVPUpeav-g_auqe0oDV',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);



const generateStableId = (title: string): string => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return 'alert_' + Math.abs(hash).toString(36);
};


interface HubContextType {
  currentUser: User | null;
  users: User[];
  coverages: Coverage[];
  tasks: Task[];
  productions: Production[];
  alerts: Alert[];
  events: CalendarEvent[];
  notifications: Notification[];
  proposals: Proposal[];
  staffSchedules: StaffSchedule[];
  newsRadarItems: NewsRadarItem[];
  categories: Category[];
  addCategory: (name: string, color: string, icon: string, active: boolean) => Promise<void>;
  updateCategory: (id: string, name: string, color: string, icon: string, active: boolean) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createHubUser: (nombre: string, email: string, password?: string, rol?: 'admin' | 'editor') => Promise<void>;
  updateHubUser: (id: string, updates: Partial<User>) => Promise<void>;
  toggleUserActive: (id: string, activo: boolean) => Promise<void>;
  deleteHubUser: (id: string) => Promise<void>;
  addCoverage: (title: string, description: string, dateTime: string, location: string, assignees: string[], programs?: ProgramType[], formats?: FormatType[], status?: Coverage['status'], logisticsInfo?: string, observations?: string, attachments?: string[], categoryId?: string) => string;
  updateCoverageStatus: (coverageId: string, status: Coverage['status']) => void;
  addCommentToCoverage: (coverageId: string, text: string) => void;
  addMultimediaToCoverage: (coverageId: string, name: string, type: 'photo' | 'video' | 'audio' | 'document', url: string, size: string) => void;
  addSharedLinkToCoverage: (coverageId: string, title: string, url: string, comments?: string) => void;
  updatePublicationStatus: (coverageId: string, platform: keyof PublicationChecklist, status: 'pending' | 'published', link?: string) => void;
  addTask: (title: string, dueDate: string, assigneeId: string, coverageId?: string) => void;
  toggleTaskCompleted: (taskId: string) => void;
  addEvent: (title: string, description: string, type: CalendarEvent['type'], start: string, _end: string, location?: string, assigneeId?: string, programs?: ProgramType[], _formats?: FormatType[], observations?: string, multimedia?: MultimediaItem[], assigneeId2?: string) => void;
  updateEvent: (eventId: string, title: string, description: string, _type: CalendarEvent['type'], start: string, _end: string, location?: string, status?: CalendarEvent['status'], assigneeId?: string, programs?: ProgramType[], _formats?: FormatType[], observations?: string, multimedia?: MultimediaItem[], assigneeId2?: string) => void;
  updateCoverageDetails: (coverageId: string, title: string, description: string, dateTime: string, location: string, assignees: string[], _programs: ProgramType[], _formats: FormatType[], _status?: Coverage['status'], logisticsInfo?: string, observations?: string, attachments?: string[], categoryId?: string) => void;
  
  // Production CRUD (ETAPA 2 MIGRACIÓN)
  addProduction: (title: string, proposalId?: string, description?: string, categoryId?: string, journalistId?: string, photographerId?: string, cameramanId?: string, mediaOutlets?: string[], formatId?: string, priority?: 'high' | 'medium' | 'low', productionDate?: string, productionTime?: string, location?: string, observations?: string, multimedia?: MultimediaItem[], sharedLinks?: SharedLink[]) => Promise<string>;
  updateProduction: (id: string, updates: Partial<Production>) => Promise<void>;
  deleteProduction: (id: string) => Promise<void>;

  createAlert: (title: string, severity: 'critical' | 'high' | 'medium') => void;
  assignAlert: (alertId: string, assigneeId: string) => void;
  closedAlertIds: Set<string>;
  closeAlert: (id: string) => void;
  markNotificationsAsRead: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  logActivity: (coverageId: string | undefined, action: string) => void;
  activities: Activity[];
 
  // Proposals
  addProposal: (title: string, description: string, dateTime?: string, location?: string, assignees?: string[], files?: Omit<MultimediaItem, 'id' | 'uploadDate' | 'userId'>[], links?: Omit<SharedLink, 'id' | 'uploadDate' | 'userId'>[], programs?: ProgramType[], formats?: FormatType[]) => void;
  updateProposalStatus: (proposalId: string, status: Proposal['status'], note?: string) => void;
  addCommentToProposal: (proposalId: string, text: string) => void;
  convertProposalToProduction: (proposalId: string, extraDetails?: { dateTime: string; location: string; programs: ProgramType[]; formats: FormatType[]; assigneeId?: string; status: ProductionStatus }) => string;
  recreateCoverageForEvent: (eventId: string, coverageId: string) => void;

  // Staff Scheduling
  updateStaffSchedule: (date: string, schedule: Omit<StaffSchedule, 'date'>) => void;

  // Instagram CRUD
  instagramPosts: InstagramPost[];
  addInstagramPost: (date: string, time: string, title: string, type: InstagramPost['type'], assigneeId?: string) => void;
  updateInstagramPost: (id: string, updates: Partial<InstagramPost>) => void;
  deleteInstagramPost: (id: string) => void;
  updateProposalDetails: (proposalId: string, title: string, description: string, dateTime?: string, location?: string, assignees?: string[], programs?: ProgramType[], formats?: FormatType[]) => void;
  deleteProposal: (proposalId: string) => Promise<void>;
  uploadProposalMediaFile: (proposalId: string, file: Omit<MultimediaItem, 'id' | 'uploadDate' | 'userId'>) => Promise<void>;
  deleteProposalMediaFile: (proposalId: string, mediaId: string) => Promise<void>;
  // News Radar
  updateNewsRadarItem: (id: string, updates: Partial<NewsRadarItem>) => void;
  fetchLiveRadarNews: () => Promise<void>;
  loadingRadar: boolean;
  radarError: string | null;
  lastRadarUpdate: string | null;
  rssDiagnostics: RssDiagnostic[];
  resetPassword: (email: string) => Promise<void>;
}

const HubContext = createContext<HubContextType | undefined>(undefined);

export const useHub = () => {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error('useHub must be used within a HubProvider');
  }
  return context;
};

const reportError = (message: string, error?: any) => {
  console.error(message, error);
  alert(message);
};

const resolveMediaUrl = (storagePath: string): string => {
  return supabase.storage.from('media').getPublicUrl(storagePath).data.publicUrl;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 1;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const parseSizeToBytes = (sizeStr: string): number => {
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return 0;
  const upper = sizeStr.toUpperCase();
  if (upper.includes('MB')) return Math.round(num * 1024 * 1024);
  if (upper.includes('KB')) return Math.round(num * 1024);
  if (upper.includes('GB')) return Math.round(num * 1024 * 1024 * 1024);
  return Math.round(num);
};

const mapMimeToMediaType = (mimeType: string): 'photo' | 'video' | 'audio' | 'document' => {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const getExtensionFromMime = (mime: string): string => {
  const parts = mime.split('/');
  if (parts.length > 1) {
    if (parts[1] === 'jpeg') return 'jpg';
    return parts[1];
  }
  return 'bin';
};



const mapDbProductionToApp = (dbProd: any): Production => ({
  id: dbProd.id,
  proposalId: dbProd.proposal_id || undefined,
  title: dbProd.title,
  description: dbProd.description || '',
  categoryId: dbProd.category_id || undefined,
  journalistId: dbProd.journalist_id || undefined,
  photographerId: dbProd.photographer_id || undefined,
  cameramanId: dbProd.cameraman_id || undefined,
  mediaOutlets: Array.isArray(dbProd.media_outlets) ? dbProd.media_outlets : [],
  formatId: dbProd.format_id || undefined,
  priority: dbProd.priority || 'medium',
  productionDate: dbProd.production_date || undefined,
  productionTime: dbProd.production_time ? dbProd.production_time.substring(0, 5) : undefined,
  location: dbProd.location || '',
  observations: dbProd.observations || '',
  multimedia: Array.isArray(dbProd.multimedia) ? dbProd.multimedia : [],
  sharedLinks: Array.isArray(dbProd.shared_links) ? dbProd.shared_links : [],
  status: dbProd.operational_status || 'pendiente_planificacion',
  createdAt: dbProd.created_at
});

const mapAppProductionToDb = (appProd: Production) => ({
  id: appProd.id,
  proposal_id: appProd.proposalId || null,
  title: appProd.title,
  description: appProd.description || null,
  category_id: appProd.categoryId || null,
  journalist_id: appProd.journalistId || null,
  photographer_id: appProd.photographerId || null,
  cameraman_id: appProd.cameramanId || null,
  media_outlets: appProd.mediaOutlets || [],
  format_id: appProd.formatId || null,
  priority: appProd.priority || 'medium',
  production_date: appProd.productionDate || null,
  production_time: appProd.productionTime || null,
  location: appProd.location || null,
  observations: appProd.observations || null,
  multimedia: appProd.multimedia || [],
  shared_links: appProd.sharedLinks || [],
  operational_status: appProd.status || 'pendiente_planificacion'
});

export const mapDbProposalToApp = (dbProp: any): Proposal => {
  let formattedDateTime = '';
  if (dbProp.date_time) {
    const d = new Date(dbProp.date_time);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  }

  return {
    id: dbProp.id,
    proposalNumber: dbProp.proposal_number,
    title: dbProp.title,
    description: dbProp.description || '',
    dateTime: formattedDateTime || undefined,
    location: dbProp.location || '',
    multimedia: Array.isArray(dbProp.proposal_media)
      ? dbProp.proposal_media.map((m: any) => ({
          id: m.id,
          name: m.original_name,
          type: mapMimeToMediaType(m.mime_type),
          url: resolveMediaUrl(m.storage_path),
          size: formatBytes(Number(m.size)),
          uploadDate: m.uploaded_at,
          userId: m.uploaded_by
        }))
      : [],
    sharedLinks: [],
    comments: Array.isArray(dbProp.proposal_comments)
      ? dbProp.proposal_comments.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user?.nombre || 'Usuario Desconocido',
          text: c.text,
          timestamp: c.timestamp
        }))
      : [],
    priority: dbProp.priority || 'medium',
    status: dbProp.status || 'pendiente',
    assignees: [],
    programs: [],
    formats: [],
    createdAt: dbProp.created_at || new Date().toISOString(),
    authorId: dbProp.author_id,
    authorName: dbProp.author?.nombre || 'Usuario Desconocido',
    decisionHistory: Array.isArray(dbProp.proposal_decisions)
      ? dbProp.proposal_decisions.map((pd: any) => ({
          status: pd.status,
          timestamp: pd.timestamp,
          note: pd.note || undefined,
          deciderName: pd.decider?.nombre || 'Usuario Desconocido'
        })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : [],
    sourceTypeId: dbProp.source_type_id || undefined,
    sourceName: dbProp.source_name || undefined,
    deletedAt: dbProp.deleted_at || undefined,
    deletedBy: dbProp.deleted_by || undefined
  };
};

export const mapAppProposalToDb = (appProp: Proposal) => ({
  id: appProp.id,
  title: appProp.title,
  description: appProp.description,
  date_time: appProp.dateTime ? new Date(appProp.dateTime).toISOString() : null,
  location: appProp.location || null,
  status: appProp.status,
  priority: appProp.priority || 'medium',
  created_at: appProp.createdAt || new Date().toISOString(),
  author_id: appProp.authorId,
  source_type_id: appProp.sourceTypeId || null,
  source_name: appProp.sourceName || null,
  deleted_at: appProp.deletedAt ? new Date(appProp.deletedAt).toISOString() : null,
  deleted_by: appProp.deletedBy || null
});

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productions, setProductions] = useState<Production[]>(() => {
    const saved = localStorage.getItem('hub_productions');
    return saved ? JSON.parse(saved) : [];
  });




  const coverages = useMemo<Coverage[]>(() => {
    return productions.map(p => {
      const assigneesList: string[] = [];
      if (p.journalistId) assigneesList.push(p.journalistId);
      if (p.photographerId) assigneesList.push(p.photographerId);
      if (p.cameramanId) assigneesList.push(p.cameramanId);

      let formattedDateTime = '';
      if (p.productionDate) {
        formattedDateTime = `${p.productionDate}T${p.productionTime || '00:00'}`;
      }

      let coverageStatus: CoverageStatus = 'pending_confirmation';
      if (p.status === 'programada') {
        coverageStatus = 'confirmed';
      } else if (p.status === 'finalizada') {
        coverageStatus = 'published';
      }

      return {
        id: p.id,
        proposalId: p.proposalId,
        title: p.title,
        description: p.description || '',
        dateTime: formattedDateTime,
        location: p.location || '',
        status: coverageStatus,
        assignees: assigneesList,
        comments: [],
        multimedia: p.multimedia,
        sharedLinks: p.sharedLinks,
        publications: {
          portal: { status: p.mediaOutlets.includes('portal') ? 'published' : 'pending' },
          facebook: { status: p.mediaOutlets.includes('facebook') ? 'published' : 'pending' },
          instagram: { status: p.mediaOutlets.includes('instagram') ? 'published' : 'pending' },
          youtube: { status: p.mediaOutlets.includes('youtube') ? 'published' : 'pending' }
        },
        activities: [],
        categoryId: p.categoryId,
        observations: p.observations || ''
      };
    });
  }, [productions]);



  const fetchProductions = async () => {
    try {
      const { data, error } = await supabase.from('productions').select('*');
      if (error) {
        reportError('Error al cargar las producciones desde el servidor: ' + error.message, error);
        setProductions([]);
        return;
      }

      if (data) {
        const loaded = data.map(mapDbProductionToApp);
        setProductions(loaded);
        localStorage.setItem('hub_productions', JSON.stringify(loaded));
      }
    } catch (err: any) {
      reportError('Error inesperado al cargar las producciones.', err);
      setProductions([]);
    }
  };

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          author:profiles!author_id(nombre),
          proposal_decisions(
            status,
            note,
            timestamp,
            decider:profiles!decider_id(nombre)
          ),
          proposal_comments(
            id,
            text,
            timestamp,
            user_id,
            user:profiles!user_id(nombre)
          ),
          proposal_media(
            id,
            original_name,
            storage_path,
            mime_type,
            size,
            uploaded_by,
            uploaded_at
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .order('timestamp', { foreignTable: 'proposal_comments', ascending: true });

      if (error) {
        reportError('Error al cargar las propuestas desde el servidor: ' + error.message, error);
        setProposals([]);
        return;
      }

      if (data) {
        const loaded = data.map(mapDbProposalToApp);
        setProposals(loaded);
        localStorage.setItem('hub_proposals', JSON.stringify(loaded));
      }
    } catch (err: any) {
      reportError('Error inesperado al cargar las propuestas.', err);
      setProposals([]);
    }
  };




  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('hub_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('hub_alerts');
    if (saved) {
      // Filtrar alertas demo/hardcodeadas heredadas del localStorage
      const LEGACY_DEMO_IDS = ['a1', 'a2'];
      const parsed = JSON.parse(saved) as Alert[];
      return parsed.filter(a => !LEGACY_DEMO_IDS.includes(a.id));
    }
    return INITIAL_ALERTS;
  });

  const [closedAlertIds, setClosedAlertIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('hub_closed_alert_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    }
    return new Set<string>();
  });

  const closeAlert = (id: string) => {
    setClosedAlertIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      sessionStorage.setItem('hub_closed_alert_ids', JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  const events = useMemo<CalendarEvent[]>(() => {
    return productions
      .filter(prod => prod.productionDate)
      .map(prod => {
        const startStr = `${prod.productionDate}T${prod.productionTime || '00:00'}`;
        let endStr = startStr;
        if (prod.productionTime) {
          try {
            const [h, m] = prod.productionTime.split(':').map(Number);
            const nh = (h + 1) % 24;
            endStr = `${prod.productionDate}T${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          } catch (e) {
            endStr = `${prod.productionDate}T23:59`;
          }
        } else {
          endStr = `${prod.productionDate}T23:59`;
        }

        let eventStatus: CalendarEvent['status'] = 'pending_confirmation';
        if (prod.status === 'programada') eventStatus = 'confirmed';
        else if (prod.status === 'finalizada') eventStatus = 'published';
        else if (prod.status === 'pendiente_planificacion') eventStatus = 'pending_confirmation';

        return {
          id: `event_${prod.id}`,
          title: prod.title,
          description: prod.description || '',
          type: 'coverage',
          start: startStr,
          end: endStr,
          location: prod.location || '',
          status: eventStatus,
          assigneeId: prod.journalistId || undefined,
          coverageId: prod.id,
          programs: (prod.mediaOutlets || []) as ProgramType[],
          formats: [],
          observations: prod.observations || '',
          multimedia: prod.multimedia || []
        };
      });
  }, [productions]);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('hub_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('hub_proposals');
    return saved ? JSON.parse(saved) : [];
  });

  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>(() => {
    const saved = localStorage.getItem('hub_staff_schedules');
    return saved ? JSON.parse(saved) : INITIAL_STAFF_SCHEDULE;
  });

  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>(() => {
    const saved = localStorage.getItem('hub_instagram_posts');
    return saved ? JSON.parse(saved) : INITIAL_INSTAGRAM_POSTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [newsRadarItems, setNewsRadarItems] = useState<NewsRadarItem[]>(INITIAL_NEWS_RADAR);
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [lastRadarUpdate, setLastRadarUpdate] = useState<string | null>(new Date().toISOString());
  const [rssDiagnostics, setRssDiagnostics] = useState<RssDiagnostic[]>([]);

  // Collect all activities from all coverages and global activities
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedGlobal = localStorage.getItem('hub_global_activities');
    const globalActs: Activity[] = savedGlobal ? JSON.parse(savedGlobal) : [];
    const allActs: Activity[] = [...globalActs];
    coverages.forEach(cov => {
      if (cov.activities) {
        allActs.push(...cov.activities.map(act => ({ ...act, coverageId: cov.id })));
      }
    });
    // Sort activities by timestamp descending
    return allActs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  // Fetch real RSS news
  const fetchLiveRadarNews = async () => {
    setLoadingRadar(true);
    setRadarError(null);
    try {
      const { rssService } = await import('../services/rssService');

      const result = await rssService.fetchNews();
      const { items, alerts: newAlerts, diagnostics } = result;

      if (items.length > 0) {
        setNewsRadarItems(items);
      }
      setRssDiagnostics(diagnostics);
      setLastRadarUpdate(new Date().toISOString());

      // Add alerts to global context
      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const updated = [...prev];
          newAlerts.forEach((newAlert: any) => {
            const stableId = generateStableId(newAlert.title);
            // Avoid duplicate alerts based on text/id
            if (!updated.some(a => a.id === stableId || a.title.includes(newAlert.title))) {
              updated.push({
                id: stableId,
                title: `[RADAR] ${newAlert.title}`,
                timestamp: new Date().toISOString(),
                severity: newAlert.severity,
                status: 'active',
                sourceName: newAlert.sourceName,
                sourceUrl: newAlert.sourceUrl,
                publishedAt: newAlert.publishedAt,
                category: newAlert.category,
                region: newAlert.region,
                classificationReason: newAlert.classificationReason,
                priority: newAlert.priority
              });
            }
          });
          return updated;
        });
      }
    } catch (e: any) {
      console.error('Failed to fetch live radar news', e);
      setRadarError(e.message || 'Error al conectar con las fuentes de noticias.');
    } finally {
      setLoadingRadar(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      console.log('HubContext fetchUsers raw data:', data, 'error:', error);
      if (error) {
        reportError('Error al cargar los usuarios desde el servidor: ' + error.message, error);
        setUsers([]);
        return;
      }
      if (data) {
        const dbUsers: User[] = data.map(p => ({
          id: p.id,
          name: p.nombre,
          email: p.email,
          role: p.rol as 'admin' | 'editor',
          avatarColor: p.rol === 'admin' ? '#1e3a8a' : '#0f766e',
          activo: p.activo,
          created_at: p.created_at,
          ultimo_acceso: p.ultimo_acceso || p.last_sign_in || p.updated_at,
          telefono: p.telefono
        }));
        setUsers(dbUsers);
      }
    } catch (err: any) {
      reportError('Error inesperado al cargar los usuarios.', err);
      setUsers([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        reportError('Error al cargar las categorías desde el servidor: ' + error.message, error);
        setCategories([]);
        return;
      }
      if (data) {
        setCategories(data);
      }
    } catch (err: any) {
      reportError('Error inesperado al cargar las categorías.', err);
      setCategories([]);
    }
  };

  const addCategory = async (name: string, color: string, icon: string, active: boolean) => {
    const slug = name.toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, slug, color, icon, active }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err: any) {
      console.error('Error creating category:', err.message || err);
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string, color: string, icon: string, active: boolean) => {
    const slug = name.toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ name, slug, color, icon, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setCategories(prev => prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err: any) {
      console.error('Error updating category:', err.message || err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting category:', err.message || err);
      throw err;
    }
  };

  useEffect(() => {
    // 1. Initial auth check
    const checkUser = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes('type=recovery') || 
        (hash.includes('access_token=') && hash.includes('recovery')) ||
        search.includes('type=recovery')
      ) {
        await fetchUsers();
        return; // Skip active user session check to avoid dashboard redirect during recovery
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch profile and users list in parallel
        const [profileRes, _] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          fetchUsers()
        ]);
        const profile = profileRes.data;
        if (profile && profile.activo) {
          setCurrentUser({
            id: profile.id,
            name: profile.nombre,
            email: profile.email,
            role: profile.rol as 'admin' | 'editor',
            avatarColor: profile.rol === 'admin' ? '#1e3a8a' : '#0f766e',
            activo: profile.activo,
            created_at: profile.created_at,
            telefono: profile.telefono
          });
        } else {
          if (profile && !profile.activo) {
            await supabase.auth.signOut();
          }
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        await fetchUsers();
      }
    };

    checkUser();

    // 2. Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        const hash = window.location.hash;
        const search = window.location.search;
        window.history.pushState({}, '', '/reset-password' + search + hash);
        window.dispatchEvent(new Event('locationchange'));
        return; // Do not sign in or set currentUser, they must reset password first
      }

      if (session?.user) {
        // Fetch profile and users list in parallel
        const [profileRes, _] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          fetchUsers()
        ]);
        const profile = profileRes.data;
        if (profile && profile.activo) {
          setCurrentUser({
            id: profile.id,
            name: profile.nombre,
            email: profile.email,
            role: profile.rol as 'admin' | 'editor',
            avatarColor: profile.rol === 'admin' ? '#1e3a8a' : '#0f766e',
            activo: profile.activo,
            created_at: profile.created_at,
            telefono: profile.telefono
          });
        } else {
          if (profile && !profile.activo) {
            await supabase.auth.signOut();
          }
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        await fetchUsers();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Automatically load RSS feeds, productions and categories on initial mount in parallel
    Promise.all([
      fetchLiveRadarNews(),
      fetchProductions(),
      fetchCategories(),
      fetchProposals()
    ]).catch(err => {
      console.error('Error on initial mount loaders:', err);
    });
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hub_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('hub_productions', JSON.stringify(productions));
    localStorage.setItem('hub_coverages', JSON.stringify(coverages));
    // Update local activity list whenever coverages change
    const covActs: Activity[] = [];
    coverages.forEach(cov => {
      if (cov.activities) {
        covActs.push(...cov.activities.map(act => ({ ...act, coverageId: cov.id })));
      }
    });
    setActivities(prev => {
      const globalActs = prev.filter(act => !act.coverageId);
      localStorage.setItem('hub_global_activities', JSON.stringify(globalActs));
      return [...globalActs, ...covActs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, [productions, coverages]);

  useEffect(() => {
    localStorage.setItem('hub_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hub_alerts', JSON.stringify(alerts));
  }, [alerts]);



  useEffect(() => {
    localStorage.setItem('hub_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('hub_proposals', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem('hub_staff_schedules', JSON.stringify(staffSchedules));
  }, [staffSchedules]);

  useEffect(() => {
    localStorage.setItem('hub_instagram_posts', JSON.stringify(instagramPosts));
  }, [instagramPosts]);



  // Auth
  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password123',
      });
      if (error) {
        throw error;
      }
      if (data.user) {
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id);

        const profile = profiles?.[0];
        if (pError || !profile) {
          await supabase.auth.signOut();
          throw new Error('Perfil de usuario no encontrado.');
        }
        if (!profile.activo) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta ha sido desactivada. Comunícate con el administrador.');
        }

        // Try updating last sign in timestamp asynchronously
        supabase
          .from('profiles')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', profile.id)
          .then(({ error: uError }) => {
            if (uError) console.warn('Could not update ultimo_acceso:', uError.message);
          });

        setCurrentUser({
          id: profile.id,
          name: profile.nombre,
          email: profile.email,
          role: profile.rol as 'admin' | 'editor',
          avatarColor: profile.rol === 'admin' ? '#1e3a8a' : '#0f766e',
          activo: profile.activo,
          created_at: profile.created_at,
          ultimo_acceso: new Date().toISOString()
        });
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error logging in:', err.message);
      throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    if (error) {
      throw error;
    }
  };

  const createHubUser = async (nombre: string, email: string, password?: string, rol?: 'admin' | 'editor') => {
    try {
      const { data, error } = await supabaseAdminClient.auth.signUp({
        email,
        password: password || 'password123',
        options: {
          data: {
            nombre,
            rol: rol || 'editor'
          }
        }
      });
      if (error) {
        throw error;
      }
      console.log('User created:', data);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error in createHubUser:', err.message);
      throw err;
    }
  };

  const updateHubUser = async (id: string, updates: Partial<User>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.nombre = updates.name;
      if (updates.role) dbUpdates.rol = updates.role;
      if (updates.activo !== undefined) dbUpdates.activo = updates.activo;
      if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id);
      if (error) {
        throw error;
      }
      if (currentUser && id === currentUser.id) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      }
      await fetchUsers();
    } catch (err: any) {
      console.error('Error in updateHubUser:', err.message);
      throw err;
    }
  };

  const toggleUserActive = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ activo })
        .eq('id', id);
      if (error) {
        throw error;
      }
      await fetchUsers();
    } catch (err: any) {
      console.error('Error in toggleUserActive:', err.message);
      throw err;
    }
  };

  const deleteHubUser = async (id: string) => {
    // 1. Guard check: only admins can call this
    if (currentUser?.role !== 'admin') {
      throw new Error('Solo los administradores pueden eliminar usuarios.');
    }
    
    // 2. Guard check: cannot delete self
    if (id === currentUser.id) {
      throw new Error('No puedes eliminar tu propio usuario.');
    }
    
    // 3. Guard check: cannot delete Verena Guglielmone if she is the only active admin
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) {
      throw new Error('El usuario a eliminar no existe.');
    }
    
    const activeAdmins = users.filter(u => u.role === 'admin' && u.activo !== false);
    
    if (userToDelete.name === 'Verena Guglielmone' || userToDelete.email === 'verena@rafaelanoticias.com' || userToDelete.email === 'vereguglielmone@gmail.com') {
      const isVerenaActiveAdmin = userToDelete.role === 'admin' && userToDelete.activo !== false;
      if (isVerenaActiveAdmin && activeAdmins.length <= 1) {
        throw new Error('No se puede eliminar a Verena Guglielmone porque es la única Administradora activa del sistema.');
      }
    }
    
    // 4. Guard check: cannot delete the last active Administrator
    if (userToDelete.role === 'admin' && userToDelete.activo !== false && activeAdmins.length <= 1) {
      throw new Error('No se puede eliminar al último Administrador activo del sistema.');
    }

    try {
      // Intentar llamar al RPC de base de datos para borrar de auth.users (cascada a profiles)
      const { error: rpcError } = await supabase.rpc('delete_user_by_id', { user_id: id });
      if (rpcError) {
        console.warn('RPC delete_user_by_id failed or not found, falling back to direct profiles delete:', rpcError.message);
        // Fallback: eliminar directamente de la tabla public.profiles
        const { error: dbError } = await supabase.from('profiles').delete().eq('id', id);
        if (dbError) throw dbError;
      }
      
      // Actualizar estado local
      setUsers(prev => prev.filter(u => u.id !== id));
      
      // Registrar actividad de auditoría
      logActivity(undefined, `Usuario eliminado: "${userToDelete.name}" (${userToDelete.email})`);
    } catch (err: any) {
      console.error('Error deleting user:', err.message);
      throw err;
    }
  };

  // Activity Log helper
  const logActivity = (_coverageId: string | undefined, action: string) => {
    if (!currentUser) return;
    const newAct: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      timestamp: new Date().toISOString()
    };

    setActivities(prev => {
      const newActs = [newAct, ...prev];
      const globalActs = newActs.filter(act => !act.coverageId);
      localStorage.setItem('hub_global_activities', JSON.stringify(globalActs));
      return newActs;
    });
  };

  //   // DEFINITIVE PRODUCTIONS CRUD (ETAPA 2 MIGRACIÓN)
  const addProduction = async (
    title: string,
    proposalId?: string,
    description?: string,
    categoryId?: string,
    journalistId?: string,
    photographerId?: string,
    cameramanId?: string,
    mediaOutlets?: string[],
    formatId?: string,
    priority?: 'high' | 'medium' | 'low',
    productionDate?: string,
    productionTime?: string,
    location?: string,
    observations?: string,
    multimedia?: MultimediaItem[],
    sharedLinks?: SharedLink[]
  ): Promise<string> => {
    const id = crypto.randomUUID();

    const status: ProductionStatus = (productionDate && productionTime) 
      ? 'programada' 
      : 'pendiente_planificacion';

    const newProd: Production = {
      id,
      proposalId,
      title,
      description: description || '',
      categoryId,
      journalistId,
      photographerId,
      cameramanId,
      mediaOutlets: mediaOutlets || [],
      formatId,
      priority: priority || 'medium',
      productionDate: productionDate || undefined,
      productionTime: productionTime || undefined,
      location: location || '',
      observations: observations || '',
      multimedia: multimedia || [],
      sharedLinks: sharedLinks || [],
      status
    };

    setProductions(prev => [newProd, ...prev]);

    try {
      const { error } = await supabase.from('productions').insert([mapAppProductionToDb(newProd)]);
      if (error) throw error;
    } catch (err: any) {
      setProductions(prev => prev.filter(p => p.id !== id));
      reportError('Error al crear la producción en el servidor de base de datos.', err);
      throw err;
    }

    return id;
  };

  const updateProduction = async (id: string, updates: Partial<Production>): Promise<void> => {
    let originalProd: Production | undefined;
    
    setProductions(prev => {
      originalProd = prev.find(p => p.id === id);
      if (!originalProd) return prev;

      const nextDate = 'productionDate' in updates ? updates.productionDate : originalProd.productionDate;
      const nextTime = 'productionTime' in updates ? updates.productionTime : originalProd.productionTime;
      const calculatedStatus: ProductionStatus = (nextDate && nextTime) ? 'programada' : 'pendiente_planificacion';
      
      const updated: Production = {
        ...originalProd,
        ...updates,
        status: (updates.status && updates.status !== 'pendiente_planificacion' && updates.status !== 'programada') 
          ? updates.status 
          : calculatedStatus
      };
      
      return prev.map(p => p.id === id ? updated : p);
    });

    try {
      const dbPayload: any = {};
      if ('title' in updates) dbPayload.title = updates.title;
      if ('description' in updates) dbPayload.description = updates.description;
      if ('categoryId' in updates) dbPayload.category_id = updates.categoryId;
      if ('journalistId' in updates) dbPayload.journalist_id = updates.journalistId;
      if ('photographerId' in updates) dbPayload.photographer_id = updates.photographerId;
      if ('cameramanId' in updates) dbPayload.cameraman_id = updates.cameramanId;
      if ('mediaOutlets' in updates) dbPayload.media_outlets = updates.mediaOutlets;
      if ('formatId' in updates) dbPayload.format_id = updates.formatId;
      if ('priority' in updates) dbPayload.priority = updates.priority;
      if ('productionDate' in updates) dbPayload.production_date = updates.productionDate;
      if ('productionTime' in updates) dbPayload.production_time = updates.productionTime;
      if ('location' in updates) dbPayload.location = updates.location;
      if ('observations' in updates) dbPayload.observations = updates.observations;
      if ('multimedia' in updates) dbPayload.multimedia = updates.multimedia;
      if ('sharedLinks' in updates) dbPayload.shared_links = updates.sharedLinks;
      if ('status' in updates) {
        dbPayload.operational_status = updates.status;
      } else if ('productionDate' in updates || 'productionTime' in updates) {
        const nextDate = 'productionDate' in updates ? updates.productionDate : (originalProd?.productionDate);
        const nextTime = 'productionTime' in updates ? updates.productionTime : (originalProd?.productionTime);
        dbPayload.operational_status = (nextDate && nextTime) ? 'programada' : 'pendiente_planificacion';
      }

      const { error } = await supabase.from('productions').update(dbPayload).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      if (originalProd) {
        setProductions(prev => prev.map(p => p.id === id ? originalProd! : p));
      }
      reportError('Error al actualizar la producción en el servidor de base de datos.', err);
      throw err;
    }
  };

  const deleteProduction = async (id: string): Promise<void> => {
    let originalProd: Production | undefined;
    setProductions(prev => {
      originalProd = prev.find(p => p.id === id);
      return prev.filter(p => p.id !== id);
    });

    try {
      const { error } = await supabase.from('productions').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      if (originalProd) {
        setProductions(prev => [originalProd!, ...prev]);
      }
      reportError('Error al eliminar la producción en el servidor de base de datos.', err);
      throw err;
    }
  };

  // CAPA DE ADAPTACIÓN TRANSITORIA (COVERAGES DELEGATION)
  const addCoverage = (
    title: string,
    description: string,
    dateTime: string,
    location: string,
    assignees: string[],
    _programs?: ProgramType[],
    _formats?: FormatType[],
    _status?: Coverage['status'],
    _logisticsInfo?: string,
    observations?: string,
    _attachments?: string[],
    categoryId?: string
  ): string => {
    const id = crypto.randomUUID();
    const [prodDate, prodTime] = dateTime ? dateTime.split('T') : [undefined, undefined];

    addProduction(
      title,
      undefined,
      description,
      categoryId,
      assignees?.[0] || undefined,
      assignees?.[1] || undefined,
      assignees?.[2] || undefined,
      [],
      undefined,
      'medium',
      prodDate,
      prodTime,
      location,
      observations
    );

    return id;
  };

  const updateCoverageStatus = (coverageId: string, status: Coverage['status']) => {
    let mappedStatus: ProductionStatus = 'pendiente_planificacion';
    if (status === 'confirmed') mappedStatus = 'programada';
    if (status === 'published') mappedStatus = 'finalizada';

    updateProduction(coverageId, { status: mappedStatus });
  };

  const addCommentToCoverage = (_coverageId: string, text: string) => {
    console.log('addCommentToCoverage (transitorio) llamado con text:', text);
  };

  const addMultimediaToCoverage = (
    coverageId: string,
    name: string,
    type: 'photo' | 'video' | 'audio' | 'document',
    url: string,
    size: string
  ) => {
    if (!currentUser) return;
    const p = productions.find(x => x.id === coverageId);
    if (!p) return;

    const newItem: MultimediaItem = {
      id: `m_${Date.now()}`,
      type,
      name,
      url,
      size,
      uploadDate: new Date().toISOString(),
      userId: currentUser.id
    };

    updateProduction(coverageId, { multimedia: [...p.multimedia, newItem] });
  };

  const addSharedLinkToCoverage = (
    coverageId: string,
    title: string,
    url: string,
    comments?: string
  ) => {
    if (!currentUser) return;
    const p = productions.find(x => x.id === coverageId);
    if (!p) return;

    const newLink: SharedLink = {
      id: `sl_${Date.now()}`,
      title,
      url,
      uploadDate: new Date().toISOString(),
      userId: currentUser.id,
      comments
    };

    updateProduction(coverageId, { sharedLinks: [...p.sharedLinks, newLink] });
  };

  const updatePublicationStatus = (
    coverageId: string,
    platform: keyof PublicationChecklist,
    status: 'pending' | 'published',
    _link?: string
  ) => {
    const p = productions.find(x => x.id === coverageId);
    if (!p) return;

    let mediaOutlets = [...p.mediaOutlets];
    if (status === 'published') {
      if (!mediaOutlets.includes(platform)) mediaOutlets.push(platform);
    } else {
      mediaOutlets = mediaOutlets.filter(x => x !== platform);
    }

    updateProduction(coverageId, { mediaOutlets });
  };

  // Tasks
  const addTask = (title: string, dueDate: string, assigneeId: string, coverageId?: string) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      coverageId,
      title,
      assigneeId,
      dueDate,
      completed: false
    };

    setTasks(prev => [newTask, ...prev]);

    // Notification for task assignment
    if (assigneeId !== currentUser?.id) {
      const notif: Notification = {
        id: `not_${Date.now()}_${assigneeId}`,
        title: 'Nueva Tarea Asignada',
        message: `Se te asignó la tarea: "${title}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'task',
        linkId: coverageId
      };
      setNotifications(prev => [notif, ...prev]);
    }

    if (coverageId) {
      logActivity(coverageId, `asignó la tarea "${title}" a ${(users.find((u: User) => u.id === assigneeId) as User | undefined)?.name}`);
    } else {
      logActivity(undefined, `asignó la tarea general "${title}" a ${(users.find((u: User) => u.id === assigneeId) as User | undefined)?.name}`);
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        const taskName = t.title;

        // Log activity
        if (t.coverageId) {
          logActivity(t.coverageId, `${nextState ? 'completó' : 'reabrió'} la tarea "${taskName}"`);
        } else {
          logActivity(undefined, `${nextState ? 'completó' : 'reabrió'} la tarea general "${taskName}"`);
        }

        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  // Calendar addEvent - creates matching production
  const addEvent = (
    title: string,
    description: string,
    type: CalendarEvent['type'],
    start: string,
    _end: string,
    location?: string,
    assigneeId?: string,
    programs?: ProgramType[],
    _formats?: FormatType[],
    observations?: string,
    multimedia?: MultimediaItem[],
    assigneeId2?: string
  ) => {
    const [prodDate, prodTime] = start ? start.split('T') : [undefined, undefined];

    const newProd: Production = {
      id: crypto.randomUUID(),
      title: type === 'coverage' ? title.replace(/^\[Cobertura\] /, '') : title,
      description,
      journalistId: assigneeId || undefined,
      photographerId: assigneeId2 || undefined,
      cameramanId: undefined,
      mediaOutlets: (programs || []) as string[],
      priority: 'medium',
      productionDate: prodDate,
      productionTime: prodTime,
      location: location || '',
      observations: observations || '',
      multimedia: multimedia || [],
      sharedLinks: [],
      status: (prodDate && prodTime) ? 'programada' : 'pendiente_planificacion'
    };

    setProductions(prev => [newProd, ...prev]);

    (async () => {
      try {
        const { error } = await supabase.from('productions').insert([mapAppProductionToDb(newProd)]);
        if (error) throw error;
      } catch (err: any) {
        setProductions(prev => prev.filter(p => p.id !== newProd.id));
        reportError('Error al crear el compromiso de agenda y su producción.', err);
      }
    })();

    logActivity(undefined, `creó el compromiso de agenda "${title}"`);
  };

  const updateEvent = (
    eventId: string,
    title: string,
    description: string,
    _type: CalendarEvent['type'],
    start: string,
    _end: string,
    location?: string,
    status?: CalendarEvent['status'],
    assigneeId?: string,
    programs?: ProgramType[],
    _formats?: FormatType[],
    observations?: string,
    multimedia?: MultimediaItem[],
    assigneeId2?: string
  ) => {
    const prodId = eventId.startsWith('event_') ? eventId.substring(6) : eventId;
    const prod = productions.find(x => x.id === prodId);
    if (!prod) return;

    const originalProd = { ...prod };
    const [prodDate, prodTime] = start ? start.split('T') : [undefined, undefined];
    
    let operationalStatus: ProductionStatus = prod.status;
    if (status !== undefined) {
      if (status === 'confirmed') operationalStatus = 'programada';
      else if (status === 'published') operationalStatus = 'finalizada';
      else if (status === 'pending_confirmation') operationalStatus = 'pendiente_planificacion';
    }

    const prodToUpdate: Production = {
      ...prod,
      title,
      description,
      productionDate: prodDate,
      productionTime: prodTime,
      location: location || prod.location || '',
      status: operationalStatus,
      journalistId: assigneeId || undefined,
      photographerId: assigneeId2 || undefined,
      mediaOutlets: (programs || []) as string[],
      observations: observations !== undefined ? observations : prod.observations,
      multimedia: multimedia !== undefined ? multimedia : prod.multimedia
    };

    setProductions(prods => prods.map(x => x.id === prodId ? prodToUpdate : x));

    (async () => {
      try {
        const { error } = await supabase
          .from('productions')
          .update(mapAppProductionToDb(prodToUpdate))
          .eq('id', prodId);
        if (error) throw error;
      } catch (err: any) {
        setProductions(prods => prods.map(x => x.id === prodId ? originalProd : x));
        reportError('Error al actualizar el compromiso en el servidor.', err);
      }
    })();

    logActivity(undefined, `actualizó el compromiso de agenda: "${title}"`);
  };

  const addProposal = (
    title: string,
    description: string,
    dateTime?: string,
    location?: string,
    assignees?: string[],
    files?: Omit<MultimediaItem, 'id' | 'uploadDate' | 'userId'>[],
    links?: Omit<SharedLink, 'id' | 'uploadDate' | 'userId'>[],
    programs?: ProgramType[],
    formats?: FormatType[]
  ) => {
    if (!currentUser) return;
    const id = crypto.randomUUID();

    const filesToUpload: { blob: Blob; fileId: string; storagePath: string; name: string }[] = [];
    const mappedFiles: MultimediaItem[] = files ? files.map((f) => {
      const fileId = crypto.randomUUID();
      const blob = dataUrlToBlob(f.url);
      const ext = getExtensionFromMime(blob.type);
      const storagePath = `proposals/${id}/${fileId}.${ext}`;
      filesToUpload.push({ blob, fileId, storagePath, name: f.name });
      return {
        id: fileId,
        type: f.type,
        name: f.name,
        url: resolveMediaUrl(storagePath),
        size: f.size,
        uploadDate: new Date().toISOString(),
        userId: currentUser.id
      };
    }) : [];

    const mappedLinks: SharedLink[] = links ? links.map((l, i) => ({
      id: `sl_prop_${id}_${i}`,
      title: l.title,
      url: l.url,
      uploadDate: new Date().toISOString(),
      userId: currentUser.id,
      comments: l.comments
    })) : [];

    const newProposal: Proposal = {
      id,
      title,
      description,
      dateTime,
      location,
      multimedia: mappedFiles,
      sharedLinks: mappedLinks,
      comments: [],
      status: 'pendiente',
      assignees: assignees || [],
      programs: programs || [],
      formats: formats || [],
      createdAt: new Date().toISOString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      decisionHistory: []
    };

    setProposals(prev => [newProposal, ...prev]);

    (async () => {
      const uploadedPaths: string[] = [];
      try {
        // 1. Insert proposal
        const { error: propError } = await supabase.from('proposals').insert([
          {
            id,
            title,
            description,
            date_time: dateTime ? new Date(dateTime).toISOString() : null,
            location: location || null,
            status: 'pendiente',
            priority: 'medium',
            created_at: newProposal.createdAt,
            author_id: currentUser.id
          }
        ]);
        if (propError) throw propError;

        // 2. Upload files and save metadata
        for (const file of filesToUpload) {
          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(file.storagePath, file.blob, { contentType: file.blob.type });

          if (uploadError) throw uploadError;
          uploadedPaths.push(file.storagePath);

          const { error: dbError } = await supabase
            .from('proposal_media')
            .insert({
              id: file.fileId,
              proposal_id: id,
              original_name: file.name,
              storage_path: file.storagePath,
              mime_type: file.blob.type,
              size: file.blob.size,
              uploaded_by: currentUser.id
            });

          if (dbError) throw dbError;
        }

        logActivity(undefined, `Propuesta creada: "${title}"`);
      } catch (err: any) {
        // Rollback state
        setProposals(prev => prev.filter(p => p.id !== id));
        // Cleanup storage uploads
        if (uploadedPaths.length > 0) {
          await supabase.storage.from('media').remove(uploadedPaths);
        }
        // Delete database entry
        await supabase.from('proposals').delete().eq('id', id);

        reportError('Error al guardar la propuesta en el servidor de base de datos.', err);
      }
    })();
  };

  const updateProposalStatus = (
    proposalId: string,
    status: Proposal['status'],
    note?: string
  ) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Solo los administradores pueden cambiar el estado de las propuestas.');
    }

    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) {
      throw new Error('La propuesta no existe.');
    }

    // Exigir comentario obligatorio en rechazada o requiere_cambios
    if ((status === 'rechazada' || status === 'requiere_cambios') && !note?.trim()) {
      throw new Error(`Se requiere ingresar un comentario para el estado: ${status === 'rechazada' ? 'Rechazada' : 'Requiere cambios'}`);
    }

    const originalProposals = [...proposals];

    // Crear la decisión para el historial
    const newDecision: ProposalDecision = {
      status,
      timestamp: new Date().toISOString(),
      note: note || (status === 'aprobada' ? 'Propuesta aprobada por la administración.' : `Estado actualizado a ${status}`),
      deciderName: currentUser.name
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          status,
          decisionHistory: [newDecision, ...(p.decisionHistory || [])]
        };
      }
      return p;
    }));

    (async () => {
      try {
        const { error: propError } = await supabase
          .from('proposals')
          .update({ status })
          .eq('id', proposalId);
        if (propError) throw propError;

        const { error: decError } = await supabase
          .from('proposal_decisions')
          .insert([
            {
              proposal_id: proposalId,
              decider_id: currentUser.id,
              status,
              note: newDecision.note,
              timestamp: newDecision.timestamp
            }
          ]);
        if (decError) throw decError;

        // Acciones y auditoría según estado
        if (status === 'aprobada') {
          // Registrar auditoría de aprobación
          logActivity(undefined, `Propuesta aprobada: "${prop.title}"`);

          // Convertir automáticamente a producción si no existe una producción vinculada aún
          let newCoverageId = '';
          if (!productions.some(p => p.proposalId === proposalId)) {
            newCoverageId = convertProposalToProduction(proposalId);
          } else {
            newCoverageId = productions.find(p => p.proposalId === proposalId)?.id || '';
          }

          // Crear notificación al autor
          if (prop.authorId) {
            const notif: Notification = {
              id: `not_prop_app_${Date.now()}`,
              title: 'Propuesta Aprobada 📈',
              message: `Tu propuesta "${prop.title}" fue aprobada y se inició su cobertura.`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'coverage',
              linkId: newCoverageId
            };
            setNotifications(prev => [notif, ...prev]);
          }
        } else if (status === 'rechazada') {
          // Registrar auditoría de rechazo
          logActivity(undefined, `Propuesta rechazada: "${prop.title}"`);

          // Crear notificación al autor
          if (prop.authorId) {
            const notif: Notification = {
              id: `not_prop_rej_${Date.now()}`,
              title: 'Propuesta Rechazada ❌',
              message: `Tu propuesta "${prop.title}" fue rechazada. Motivo: ${note}`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'coverage',
              linkId: proposalId
            };
            setNotifications(prev => [notif, ...prev]);
          }
        } else if (status === 'requiere_cambios') {
          // Registrar auditoría de cambios solicitados
          logActivity(undefined, `Cambios solicitados en propuesta: "${prop.title}"`);

          // Crear notificación al autor
          if (prop.authorId) {
            const notif: Notification = {
              id: `not_prop_chg_${Date.now()}`,
              title: 'Propuesta: Requiere Cambios ⚠️',
              message: `Tu propuesta "${prop.title}" requiere cambios. Observaciones: ${note}`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'coverage',
              linkId: proposalId
            };
            setNotifications(prev => [notif, ...prev]);
          }
        } else {
          // General status update (like 'en_revision')
          logActivity(undefined, `Propuesta en revisión: "${prop.title}"`);
        }
      } catch (err: any) {
        // Rollback state
        setProposals(originalProposals);
        reportError('Error al actualizar el estado de la propuesta en el servidor.', err);
      }
    })();
  };

  const addCommentToProposal = (proposalId: string, text: string) => {
    if (!currentUser) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('proposal_comments')
          .insert([
            {
              proposal_id: proposalId,
              user_id: currentUser.id,
              text
            }
          ])
          .select(`
            id,
            text,
            timestamp,
            user_id,
            user:profiles!user_id(nombre)
          `)
          .single();

        if (error) throw error;

        if (data) {
          const newComment: Comment = {
            id: data.id,
            userId: data.user_id,
            userName: (Array.isArray(data.user) ? data.user[0]?.nombre : (data.user as any)?.nombre) || currentUser.name,
            text: data.text,
            timestamp: data.timestamp
          };

          setProposals(prev => prev.map(p => {
            if (p.id === proposalId) {
              return {
                ...p,
                comments: [...(p.comments || []), newComment]
              };
            }
            return p;
          }));

          logActivity(undefined, `Agregó un comentario a la propuesta: "${proposals.find(p => p.id === proposalId)?.title || ''}"`);
        }
      } catch (err: any) {
        reportError('Error al agregar el comentario en el servidor.', err);
      }
    })();
  };

  const convertProposalToProduction = (
    proposalId: string,
    extraDetails?: {
      dateTime: string;
      location: string;
      programs: ProgramType[];
      formats: FormatType[];
      assigneeId?: string;
      status: ProductionStatus;
    }
  ): string => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop || !currentUser) return '';

    // Guard to prevent duplicate conversion
    if (productions.some(p => p.proposalId === proposalId)) {
      reportError('Esta propuesta ya ha sido convertida en producción.', new Error('Propuesta ya convertida'));
      return '';
    }

    const id = crypto.randomUUID();
    const targetDateTime = extraDetails?.dateTime || prop.dateTime || '';
    const [prodDate, prodTime] = targetDateTime ? targetDateTime.split('T') : [undefined, undefined];
    const targetLocation = extraDetails?.location || prop.location || '';
    const targetJournalist = extraDetails?.assigneeId || prop.assignees?.[0] || undefined;

    const newProd: Production = {
      id,
      proposalId,
      title: prop.title,
      description: prop.description,
      journalistId: targetJournalist,
      mediaOutlets: [],
      priority: 'medium',
      productionDate: prodDate,
      productionTime: prodTime,
      location: targetLocation,
      observations: '',
      multimedia: prop.multimedia,
      sharedLinks: prop.sharedLinks,
      status: (prodDate && prodTime) ? 'programada' : 'pendiente_planificacion'
    };

    setProductions(prev => [newProd, ...prev]);

    (async () => {
      try {
        const { error } = await supabase.from('productions').insert([mapAppProductionToDb(newProd)]);
        if (error) throw error;
        logActivity(undefined, `Producción creada desde propuesta transitoriamente: "${prop.title}"`);
      } catch (err: any) {
        setProductions(prev => prev.filter(p => p.id !== id));
        reportError('Error al guardar la nueva producción transitoria en Supabase.', err);
      }
    })();



    return id;
  };

  const updateCoverageDetails = (
    coverageId: string,
    title: string,
    description: string,
    dateTime: string,
    location: string,
    assignees: string[],
    _programs: ProgramType[],
    _formats: FormatType[],
    _status?: Coverage['status'],
    _logisticsInfo?: string,
    observations?: string,
    _attachments?: string[],
    categoryId?: string
  ) => {
    const [prodDate, prodTime] = dateTime ? dateTime.split('T') : [undefined, undefined];

    updateProduction(coverageId, {
      title,
      description,
      categoryId,
      journalistId: assignees?.[0] || undefined,
      photographerId: assignees?.[1] || undefined,
      cameramanId: assignees?.[2] || undefined,
      productionDate: prodDate,
      productionTime: prodTime,
      location,
      observations: observations || ''
    });



    logActivity(coverageId, `actualizó los detalles y planificación de la cobertura`);
  };

  // News Radar
  const updateNewsRadarItem = (id: string, updates: Partial<NewsRadarItem>) => {
    setNewsRadarItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Staff schedules
  const updateStaffSchedule = (date: string, schedule: Omit<StaffSchedule, 'date'>) => {
    setStaffSchedules(prev => {
      const exists = prev.some(s => s.date === date);
      if (exists) {
        return prev.map(s => s.date === date ? { date, ...schedule } : s);
      } else {
        return [...prev, { date, ...schedule }];
      }
    });
    logActivity(undefined, `actualizó la agenda operativa del día ${date}`);
  };

  // Proposals Edit
  const updateProposalDetails = (
    proposalId: string,
    title: string,
    description: string,
    dateTime?: string,
    location?: string,
    assignees?: string[],
    programs?: ProgramType[],
    formats?: FormatType[]
  ) => {
    const originalProposals = [...proposals];

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          title,
          description,
          dateTime,
          location,
          assignees: assignees || p.assignees || [],
          programs: programs || p.programs || [],
          formats: formats || p.formats || []
        };
      }
      return p;
    }));

    (async () => {
      try {
        const { error } = await supabase
          .from('proposals')
          .update({
            title,
            description,
            date_time: dateTime ? new Date(dateTime).toISOString() : null,
            location: location || null
          })
          .eq('id', proposalId);
        if (error) throw error;
        logActivity(undefined, `actualizó los detalles de la propuesta: "${title}"`);
      } catch (err: any) {
        setProposals(originalProposals);
        reportError('Error al actualizar los detalles de la propuesta en el servidor.', err);
      }
    })();
  };

  const deleteProposal = async (proposalId: string): Promise<void> => {
    if (!currentUser) return;
    const originalProposals = [...proposals];

    setProposals(prev => prev.filter(p => p.id !== proposalId));

    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: currentUser.id
        })
        .eq('id', proposalId);
      if (error) throw error;
      logActivity(undefined, `Eliminó lógicamente la propuesta ID: ${proposalId}`);
    } catch (err: any) {
      setProposals(originalProposals);
      reportError('Error al eliminar la propuesta en el servidor.', err);
    }
  };

  const uploadProposalMediaFile = async (
    proposalId: string,
    file: Omit<MultimediaItem, 'id' | 'uploadDate' | 'userId'>
  ): Promise<void> => {
    if (!currentUser) return;

    try {
      const blob = dataUrlToBlob(file.url);
      const fileId = crypto.randomUUID();
      const ext = getExtensionFromMime(blob.type);
      const storagePath = `proposals/${proposalId}/${fileId}.${ext}`;

      // 1. Upload to Supabase Storage first
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, blob, { contentType: blob.type });

      if (uploadError) throw uploadError;

      // 2. Insert record in database next
      const { error: dbError } = await supabase
        .from('proposal_media')
        .insert({
          id: fileId,
          proposal_id: proposalId,
          original_name: file.name,
          storage_path: storagePath,
          mime_type: blob.type,
          size: blob.size,
          uploaded_by: currentUser.id
        });

      if (dbError) {
        // Prevent orphan file by cleaning up Storage upload
        await supabase.storage.from('media').remove([storagePath]);
        throw dbError;
      }

      // 3. Update React state
      const newMediaItem: MultimediaItem = {
        id: fileId,
        name: file.name,
        type: mapMimeToMediaType(blob.type),
        url: resolveMediaUrl(storagePath),
        size: formatBytes(blob.size),
        uploadDate: new Date().toISOString(),
        userId: currentUser.id
      };

      setProposals(prev => prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            multimedia: [...(p.multimedia || []), newMediaItem]
          };
        }
        return p;
      }));

      logActivity(undefined, `Cargó archivo multimedia "${file.name}" en la propuesta`);
    } catch (err: any) {
      reportError('Error al subir el archivo multimedia en el servidor.', err);
    }
  };

  const deleteProposalMediaFile = async (
    proposalId: string,
    mediaId: string
  ): Promise<void> => {
    if (!currentUser) return;

    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const mediaItem = prop.multimedia.find(m => m.id === mediaId);
    if (!mediaItem) return;

    const originalProposals = [...proposals];

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          multimedia: p.multimedia.filter(m => m.id !== mediaId)
        };
      }
      return p;
    }));

    try {
      const { data, error: selectError } = await supabase
        .from('proposal_media')
        .select('storage_path')
        .eq('id', mediaId)
        .single();

      if (selectError) throw selectError;
      if (!data) throw new Error('El archivo no existe en el servidor.');

      const storagePath = data.storage_path;

      // 1. Delete from Supabase Storage first
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // 2. Delete from database next
      const { error: dbError } = await supabase
        .from('proposal_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      logActivity(undefined, `Eliminó archivo multimedia de la propuesta`);
    } catch (err: any) {
      setProposals(originalProposals);
      reportError('Error al eliminar el archivo multimedia en el servidor.', err);
    }
  };

  // Instagram CRUD
  const addInstagramPost = (
    date: string,
    time: string,
    title: string,
    type: InstagramPost['type'],
    assigneeId?: string
  ) => {
    const newPost: InstagramPost = {
      id: `ig_${Date.now()}`,
      date,
      time,
      title,
      type,
      assigneeId,
      status: 'idea'
    };
    setInstagramPosts(prev => [...prev, newPost]);
    logActivity(undefined, `programó publicación de Instagram: "${title}" a las ${time} hs`);
  };

  const updateInstagramPost = (id: string, updates: Partial<InstagramPost>) => {
    setInstagramPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteInstagramPost = (id: string) => {
    setInstagramPosts(prev => prev.filter(p => p.id !== id));
  };

  // Alerts
  const createAlert = (title: string, severity: 'critical' | 'high' | 'medium') => {
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      title,
      timestamp: new Date().toISOString(),
      severity,
      status: 'active'
    };
    setAlerts(prev => [newAlert, ...prev]);

    // Send notifications to everyone
    users.forEach((u: User) => {
      if (u.id !== currentUser?.id) {
        const notif: Notification = {
          id: `not_${Date.now()}_${u.id}`,
          title: severity === 'critical' ? '¡ALERTA CRÍTICA!' : severity === 'high' ? '¡ALERTA ALTA!' : 'Alerta Media',
          message: title,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'alert'
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

    logActivity(undefined, `lanzó alerta urgente: "${title}"`);
  };

  const assignAlert = (alertId: string, assigneeId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    // We convert the alert into a Coverage!
    const coverageId = addCoverage(
      alert.title,
      `Cobertura originada de alerta urgente: "${alert.title}".`,
      new Date().toISOString().substring(0, 16),
      'A determinar',
      [assigneeId]
    );

    // Update alert status
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'followed_up',
          assigneeId,
          coverageId
        };
      }
      return a;
    }));

    logActivity(undefined, `derivó la alerta "${alert.title}" a cobertura con responsable asignado.`);
  };

  // Notifications
  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => {
      // In a real app we filter by user. Let's assume notifications target current user
      return { ...n, read: true };
    }));
  };

  const recreateCoverageForEvent = (eventId: string, coverageId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (productions.some(c => c.id === coverageId)) return;

    const [prodDate, prodTime] = event.start ? event.start.split('T') : [undefined, undefined];

    const newProd: Production = {
      id: coverageId,
      title: event.title.replace(/^\[Cobertura\] /, '').replace(/^\[Propuesta Aprobada\] /, '').replace(/^\[Producción\] /, ''),
      description: event.description || 'Recreado a partir de la actividad de agenda.',
      categoryId: undefined,
      journalistId: event.assigneeId || undefined,
      mediaOutlets: [],
      priority: 'medium',
      productionDate: prodDate,
      productionTime: prodTime,
      location: event.location || 'A determinar',
      observations: '',
      multimedia: [],
      sharedLinks: [],
      status: (prodDate && prodTime) ? 'programada' : 'pendiente_planificacion'
    };

    setProductions(prev => [newProd, ...prev]);

    // Persistir asincrónicamente con rollback en caso de fallo
    (async () => {
      try {
        const { error } = await supabase.from('productions').insert([mapAppProductionToDb(newProd)]);
        if (error) throw error;
      } catch (err: any) {
        // Rollback state
        setProductions(prev => prev.filter(c => c.id !== coverageId));
        reportError('Error al recrear la producción en el servidor de base de datos.', err);
      }
    })();

    logActivity(undefined, `recreó la producción "${newProd.title}" vinculada al evento de agenda`);
  };

  return (
    <HubContext.Provider value={{
      currentUser,
      users,
      coverages,
      tasks,
      productions,
      alerts,
      events,
      notifications,
      proposals,
      staffSchedules,
      newsRadarItems,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      login,
      logout,
      resetPassword,
      createHubUser,
      updateHubUser,
      toggleUserActive,
      deleteHubUser,
      addProduction,
      updateProduction,
      deleteProduction,
      addCoverage,
      updateCoverageStatus,
      addCommentToCoverage,
      addMultimediaToCoverage,
      addSharedLinkToCoverage,
      updatePublicationStatus,
      addTask,
      toggleTaskCompleted,
      addEvent,
      updateEvent,
      updateCoverageDetails,
      createAlert,
      assignAlert,
      closedAlertIds,
      closeAlert,
      markNotificationsAsRead,
      searchQuery,
      setSearchQuery,
      logActivity,
      activities,
      addProposal,
      updateProposalStatus,
      addCommentToProposal,
      convertProposalToProduction,
      recreateCoverageForEvent,
      updateStaffSchedule,
      instagramPosts,
      addInstagramPost,
      updateInstagramPost,
      deleteInstagramPost,
      updateProposalDetails,
      deleteProposal,
      uploadProposalMediaFile,
      deleteProposalMediaFile,
      updateNewsRadarItem,
      fetchLiveRadarNews,
      loadingRadar,
      radarError,
      lastRadarUpdate,
      rssDiagnostics
    }}>
      {children}
    </HubContext.Provider>
  );
};
