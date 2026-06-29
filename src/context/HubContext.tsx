import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_TASKS, INITIAL_ALERTS, INITIAL_EVENTS, INITIAL_NOTIFICATIONS, INITIAL_STAFF_SCHEDULE, INITIAL_INSTAGRAM_POSTS, INITIAL_NEWS_RADAR } from '../data/initialData';

import type { User, Coverage, Task, Alert, CalendarEvent, Notification, Activity, Comment, MultimediaItem, SharedLink, PublicationChecklist, Proposal, ProposalDecision, StaffSchedule, ProgramType, FormatType, InstagramPost, NewsRadarItem, RssDiagnostic, Category } from '../types';
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
  addEvent: (title: string, description: string, type: CalendarEvent['type'], start: string, end: string, location?: string, assigneeId?: string, programs?: ProgramType[], formats?: FormatType[]) => void;
  updateEvent: (eventId: string, title: string, description: string, type: CalendarEvent['type'], start: string, end: string, location?: string, status?: CalendarEvent['status'], assigneeId?: string, programs?: ProgramType[], formats?: FormatType[]) => void;
  updateCoverageDetails: (coverageId: string, title: string, description: string, dateTime: string, location: string, assignees: string[], programs: ProgramType[], formats: FormatType[], status?: Coverage['status'], logisticsInfo?: string, observations?: string, attachments?: string[], categoryId?: string) => void;
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
  convertProposalToCoverage: (proposalId: string, extraDetails?: { dateTime: string; location: string; programs: ProgramType[]; formats: FormatType[]; assigneeId?: string; status: Coverage['status'] }) => string;
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

const mapDbCoverageToApp = (dbCov: any): Coverage => {
  let formattedDateTime = '';
  if (dbCov.datetime) {
    const d = new Date(dbCov.datetime);
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
    id: dbCov.id,
    proposalId: dbCov.proposal_id || undefined,
    title: dbCov.title,
    description: dbCov.description || '',
    dateTime: formattedDateTime,
    location: dbCov.location || '',
    status: dbCov.status,
    assignees: Array.isArray(dbCov.assignees) ? dbCov.assignees : [],
    comments: Array.isArray(dbCov.comments) ? dbCov.comments : [],
    multimedia: Array.isArray(dbCov.multimedia) ? dbCov.multimedia : [],
    sharedLinks: Array.isArray(dbCov.shared_links) ? dbCov.shared_links : [],
    publications: dbCov.publications || {
      portal: { status: 'pending' },
      facebook: { status: 'pending' },
      instagram: { status: 'pending' },
      youtube: { status: 'pending' }
    },
    activities: Array.isArray(dbCov.activities) ? dbCov.activities : [],
    programs: Array.isArray(dbCov.programs) ? dbCov.programs : [],
    formats: Array.isArray(dbCov.formats) ? dbCov.formats : [],
    logisticsInfo: dbCov.logistics_info || '',
    observations: dbCov.observations || '',
    attachments: Array.isArray(dbCov.attachments) ? dbCov.attachments : [],
    categoryId: dbCov.category_id || undefined
  };
};

const mapAppCoverageToDb = (appCov: Coverage) => ({
  id: appCov.id,
  proposal_id: appCov.proposalId || null,
  title: appCov.title,
  description: appCov.description,
  datetime: appCov.dateTime ? new Date(appCov.dateTime).toISOString() : null,
  location: appCov.location,
  status: appCov.status,
  assignees: appCov.assignees,
  comments: appCov.comments,
  multimedia: appCov.multimedia,
  shared_links: appCov.sharedLinks,
  publications: appCov.publications,
  activities: appCov.activities,
  programs: appCov.programs || [],
  formats: appCov.formats || [],
  logistics_info: appCov.logisticsInfo || '',
  observations: appCov.observations || '',
  attachments: appCov.attachments || [],
  category_id: appCov.categoryId || null
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

  const [coverages, setCoverages] = useState<Coverage[]>(() => {
    const saved = localStorage.getItem('hub_coverages');
    return saved ? JSON.parse(saved) : [];
  });

  const [loadingCoverages, setLoadingCoverages] = useState(true);

  const fetchCoverages = async () => {
    try {
      const { data, error } = await supabase.from('coverages').select('*');
      if (error) {
        reportError('Error al cargar las coberturas desde el servidor: ' + error.message, error);
        setCoverages([]);
        return;
      }

      if (data) {
        const loaded = data.map(mapDbCoverageToApp);
        setCoverages(loaded);
        localStorage.setItem('hub_coverages', JSON.stringify(loaded));
      }
    } catch (err: any) {
      reportError('Error inesperado al cargar las coberturas.', err);
      setCoverages([]);
    } finally {
      setLoadingCoverages(false);
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

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('hub_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

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
    // Automatically load RSS feeds, coverages and categories on initial mount in parallel
    Promise.all([
      fetchLiveRadarNews(),
      fetchCoverages(),
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
  }, [coverages]);

  useEffect(() => {
    localStorage.setItem('hub_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hub_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('hub_events', JSON.stringify(events));
  }, [events]);

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

  // Enforce bidireccional event <-> coverage 1-to-1 sync and auto-creation of missing coverages (Req 33 & 35)
  useEffect(() => {
    if (loadingCoverages) return; // Prevent sync before coverages are loaded

    let coveragesUpdated = false;
    const currentCoverages = [...coverages];
    const currentEvents = [...events];
    const newCoveragesToInsert: Coverage[] = [];

    // Check all events and ensure they have a coverage
    const updatedEvents = currentEvents.map(evt => {
      let covId = evt.coverageId;
      let eventChanged = false;

      // Every event must have a coverageId
      if (!covId) {
        covId = crypto.randomUUID();
        eventChanged = true;
      }

      // Verify if corresponding coverage exists in list
      const coverageExists = currentCoverages.some(c => c.id === covId);
      if (!coverageExists) {
        // Auto-generate coverage sheet
        const newCoverage: Coverage = {
          id: covId!,
          title: evt.title.replace(/^\[Cobertura\] /, '').replace(/^\[Propuesta Aprobada\] /, ''),
          description: evt.description || 'Creado automáticamente a partir del evento de la agenda.',
          dateTime: evt.start,
          location: evt.location || 'A determinar',
          status: evt.status === 'published' ? 'published' : (evt.status === 'in_redaction' ? 'in_redaction' : (evt.status === 'confirmed' ? 'confirmed' : 'pending_confirmation')),
          assignees: evt.assigneeId ? [evt.assigneeId] : [],
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
            {
              id: `act_auto_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              userId: 'system',
              userName: 'Sistema',
              action: 'generó automáticamente la cobertura vinculada al evento de la agenda',
              timestamp: new Date().toISOString()
            }
          ],
          programs: evt.programs || [],
          formats: evt.formats || []
        };
        currentCoverages.push(newCoverage);
        newCoveragesToInsert.push(newCoverage);
        coveragesUpdated = true;
      }

      return eventChanged ? { ...evt, coverageId: covId } : evt;
    });

    // Update state only if changed, using string comparison to avoid loops
    const eventsStr = JSON.stringify(events);
    const updatedEventsStr = JSON.stringify(updatedEvents);
    if (eventsStr !== updatedEventsStr) {
      setEvents(updatedEvents);
    }

    if (coveragesUpdated) {
      setCoverages(currentCoverages);
    }

    if (newCoveragesToInsert.length > 0) {
      (async () => {
        try {
          const { error } = await supabase.from('coverages').insert(newCoveragesToInsert.map(mapAppCoverageToDb));
          if (error) throw error;
        } catch (err: any) {
          console.error('Error auto-creating coverages in Supabase:', err.message || err);
        }
      })();
    }
  }, [events, coverages, loadingCoverages]);

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
  const logActivity = (coverageId: string | undefined, action: string) => {
    if (!currentUser) return;
    const newAct: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      timestamp: new Date().toISOString()
    };

    if (coverageId) {
      const cov = coverages.find(c => c.id === coverageId);
      if (!cov) return;
      const originalCov = { ...cov };
      const updatedCov = {
        ...cov,
        activities: [newAct, ...(cov.activities || [])]
      };

      setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

      // Persistir asincrónicamente con try-catch
      (async () => {
        try {
          const { error } = await supabase
            .from('coverages')
            .update(mapAppCoverageToDb(updatedCov))
            .eq('id', coverageId);
          if (error) throw error;
        } catch (err: any) {
          console.error('Error logging coverage activity in Supabase:', err.message || err);
          // Rollback
          setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
        }
      })();
    } else {
      // Global activity
      setActivities(prev => {
        const newActs = [newAct, ...prev];
        const globalActs = newActs.filter(act => !act.coverageId);
        localStorage.setItem('hub_global_activities', JSON.stringify(globalActs));
        return newActs;
      });
    }
  };

  // Coverages
  const addCoverage = (
    title: string,
    description: string,
    dateTime: string,
    location: string,
    assignees: string[],
    programs?: ProgramType[],
    formats?: FormatType[],
    status?: Coverage['status'],
    logisticsInfo?: string,
    observations?: string,
    attachments?: string[],
    categoryId?: string
  ): string => {
    const id = crypto.randomUUID();
    const newCoverage: Coverage = {
      id,
      title,
      description,
      dateTime,
      location,
      status: status || 'pending_confirmation',
      assignees,
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
        {
          id: `act_${Date.now()}`,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Sistema',
          action: 'creó la cobertura periodística',
          timestamp: new Date().toISOString()
        }
      ],
      programs: programs || [],
      formats: formats || [],
      logisticsInfo: logisticsInfo || '',
      observations: observations || '',
      attachments: attachments || [],
      categoryId
    };

    setCoverages(prev => [newCoverage, ...prev]);

    // Persistencia asíncrona robusta con await y rollback
    (async () => {
      try {
        const { error } = await supabase.from('coverages').insert([mapAppCoverageToDb(newCoverage)]);
        if (error) throw error;
      } catch (err: any) {
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== id));
        setEvents(prev => prev.filter(e => e.coverageId !== id));
        reportError('Error al crear la cobertura en el servidor de base de datos.', err);
      }
    })();

    // Also add to calendar events
    const newEvent: CalendarEvent = {
      id: `e_${id}`,
      title: `[Cobertura] ${title}`,
      description,
      type: 'coverage',
      start: dateTime,
      end: new Date(new Date(dateTime).getTime() + 4 * 60 * 60 * 1000).toISOString().substring(0, 16),
      location,
      status: status || 'pending_confirmation',
      assigneeId: assignees.length > 0 ? assignees[0] : undefined,
      coverageId: id,
      programs: programs || [],
      formats: formats || []
    };
    setEvents(prev => [...prev, newEvent]);

    // Send notifications to assignees
    assignees.forEach(uid => {
      if (uid !== currentUser?.id) {
        const notif: Notification = {
          id: `not_${Date.now()}_${uid}`,
          title: 'Nueva Cobertura Asignada',
          message: `Fuiste asignado a la cobertura: "${title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'coverage',
          linkId: id
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

    logActivity(undefined, `creó la cobertura "${title}"`);
    return id;
  };

  const updateCoverageStatus = (coverageId: string, status: Coverage['status']) => {
    const statusMap: Record<Coverage['status'], string> = {
      pending_confirmation: 'Pendiente de confirmación',
      confirmed: 'Confirmada',
      in_redaction: 'En Redacción',
      published: 'Publicada'
    };

    const cov = coverages.find(c => c.id === coverageId);
    if (!cov) return;

    const originalCov = { ...cov };
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: `cambió el estado a "${statusMap[status]}"`,
      timestamp: new Date().toISOString()
    };
    const updatedCov = {
      ...cov,
      status,
      activities: [newAct, ...(cov.activities || [])]
    };

    setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

    // Persistencia asíncrona robusta con await y rollback
    (async () => {
      try {
        const { error } = await supabase
          .from('coverages')
          .update(mapAppCoverageToDb(updatedCov))
          .eq('id', coverageId);
        if (error) throw error;
      } catch (err: any) {
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
        reportError('Error al actualizar el estado de la cobertura en el servidor de base de datos.', err);
      }
    })();

    // Also update corresponding calendar event status
    setEvents(prev => prev.map(e => {
      if (e.coverageId === coverageId) {
        let eventStatus: CalendarEvent['status'] = 'pending_confirmation';
        if (status === 'confirmed') eventStatus = 'confirmed';
        else if (status === 'in_redaction') eventStatus = 'in_redaction';
        else if (status === 'published') eventStatus = 'published';
        return { ...e, status: eventStatus };
      }
      return e;
    }));

    // Notify users
    cov.assignees.forEach(uid => {
      if (uid !== currentUser?.id) {
        const notif: Notification = {
          id: `not_${Date.now()}_${uid}`,
          title: 'Cambio de Estado',
          message: `El estado de "${cov.title}" cambió a: ${statusMap[status]}`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'coverage',
          linkId: coverageId
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });
  };

  const addCommentToCoverage = (coverageId: string, text: string) => {
    if (!currentUser) return;

    const cov = coverages.find(c => c.id === coverageId);
    if (!cov) return;

    const originalCov = { ...cov };
    const newComment: Comment = {
      id: `com_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString()
    };
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'escribió en el chat de la cobertura',
      timestamp: new Date().toISOString()
    };
    const updatedCov = {
      ...cov,
      comments: [...(cov.comments || []), newComment],
      activities: [newAct, ...(cov.activities || [])]
    };

    setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

    // Persistir asincrónicamente con try-catch y rollback
    (async () => {
      try {
        const { error } = await supabase
          .from('coverages')
          .update(mapAppCoverageToDb(updatedCov))
          .eq('id', coverageId);
        if (error) throw error;
      } catch (err: any) {
        console.error('Error adding comment to coverage in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
      }
    })();

    // Handle mentions e.g., @Juan or @Laura
    // Find matches for @Name in the text
    users.forEach((u: User) => {
      if (text.toLowerCase().includes(`@${u.name.toLowerCase().split(' ')[0]}`) && u.id !== currentUser.id) {
        const notif: Notification = {
          id: `not_${Date.now()}_${u.id}`,
          title: 'Mención en Cobertura',
          message: `${currentUser.name} te mencionó en la cobertura "${cov.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'comment',
          linkId: coverageId
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

    // Send general comment notifications to other assignees
    cov.assignees.forEach(uid => {
      if (uid !== currentUser.id && !text.toLowerCase().includes(`@${(users.find((user: User) => user.id === uid) as User | undefined)?.name.toLowerCase().split(' ')[0]}`)) {
        const notif: Notification = {
          id: `not_${Date.now()}_${uid}`,
          title: 'Nuevo Comentario en Cobertura',
          message: `${currentUser.name} comentó en "${cov.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'comment',
          linkId: coverageId
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });
  };

  const addMultimediaToCoverage = (
    coverageId: string,
    name: string,
    type: 'photo' | 'video' | 'audio' | 'document',
    url: string,
    size: string
  ) => {
    if (!currentUser) return;
    const cov = coverages.find(c => c.id === coverageId);
    if (!cov) return;

    const originalCov = { ...cov };
    const newItem: MultimediaItem = {
      id: `m_${Date.now()}`,
      type,
      name,
      url,
      size,
      uploadDate: new Date().toISOString(),
      userId: currentUser.id
    };
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: `cargó el archivo "${name}"`,
      timestamp: new Date().toISOString()
    };
    const updatedCov = {
      ...cov,
      multimedia: [...(cov.multimedia || []), newItem],
      activities: [newAct, ...(cov.activities || [])]
    };

    setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

    // Persistir en Supabase asíncronamente con rollback
    (async () => {
      try {
        const { error } = await supabase
          .from('coverages')
          .update(mapAppCoverageToDb(updatedCov))
          .eq('id', coverageId);
        if (error) throw error;
      } catch (err: any) {
        console.error('Error adding multimedia in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
      }
    })();
  };

  const addSharedLinkToCoverage = (
    coverageId: string,
    title: string,
    url: string,
    comments?: string
  ) => {
    if (!currentUser) return;
    const cov = coverages.find(c => c.id === coverageId);
    if (!cov) return;

    const originalCov = { ...cov };
    const newLink: SharedLink = {
      id: `sl_${Date.now()}`,
      title,
      url,
      uploadDate: new Date().toISOString(),
      userId: currentUser.id,
      comments
    };
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: `agregó el enlace externo "${title}"`,
      timestamp: new Date().toISOString()
    };
    const updatedCov = {
      ...cov,
      sharedLinks: [...(cov.sharedLinks || []), newLink],
      activities: [newAct, ...(cov.activities || [])]
    };

    setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

    // Persistir en Supabase asíncronamente con rollback
    (async () => {
      try {
        const { error } = await supabase
          .from('coverages')
          .update(mapAppCoverageToDb(updatedCov))
          .eq('id', coverageId);
        if (error) throw error;
      } catch (err: any) {
        console.error('Error adding shared link in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
      }
    })();
  };

  const updatePublicationStatus = (
    coverageId: string,
    platform: keyof PublicationChecklist,
    status: 'pending' | 'published',
    link?: string
  ) => {
    if (!currentUser) return;
    const cov = coverages.find(c => c.id === coverageId);
    if (!cov) return;

    const originalCov = { ...cov };
    const platformNames: Record<keyof PublicationChecklist, string> = {
      portal: 'Portal Web',
      facebook: 'Facebook',
      instagram: 'Instagram',
      youtube: 'YouTube'
    };

    const currentPubs = { ...cov.publications };
    currentPubs[platform] = {
      status,
      date: status === 'published' ? new Date().toISOString() : undefined,
      userId: status === 'published' ? currentUser.id : undefined,
      link: status === 'published' ? link : undefined
    };

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: status === 'published'
        ? `marcó como PUBLICADO en ${platformNames[platform]}`
        : `desmarcó publicación en ${platformNames[platform]}`,
      timestamp: new Date().toISOString()
    };

    const updatedCov = {
      ...cov,
      publications: currentPubs,
      activities: [newAct, ...(cov.activities || [])]
    };

    setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

    // Persistir en Supabase asíncronamente con rollback
    (async () => {
      try {
        const { error } = await supabase
          .from('coverages')
          .update(mapAppCoverageToDb(updatedCov))
          .eq('id', coverageId);
        if (error) throw error;
      } catch (err: any) {
        console.error('Error updating publication status in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
      }
    })();
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

  // Calendar addEvent - creates matching coverage automatically
  const addEvent = (
    title: string,
    description: string,
    type: CalendarEvent['type'],
    start: string,
    end: string,
    location?: string,
    assigneeId?: string,
    programs?: ProgramType[],
    formats?: FormatType[]
  ) => {
    const coverageId = crypto.randomUUID();

    // Auto-create corresponding Coverage
    const newCoverage: Coverage = {
      id: coverageId,
      title,
      description,
      dateTime: start,
      location: location || '',
      status: 'pending_confirmation',
      assignees: assigneeId ? [assigneeId] : [],
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
        {
          id: `act_${Date.now()}`,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Sistema',
          action: `creó la cobertura a partir del evento de agenda "${title}"`,
          timestamp: new Date().toISOString()
        }
      ],
      programs: programs || [],
      formats: formats || []
    };

    setCoverages(prev => [newCoverage, ...prev]);

    const newEvent: CalendarEvent = {
      id: `event_${Date.now()}`,
      title: type === 'coverage' ? `[Cobertura] ${title}` : title,
      description,
      type,
      start,
      end,
      location,
      status: 'pending_confirmation',
      assigneeId,
      coverageId, // Link the coverage!
      programs: programs || [],
      formats: formats || []
    };
    setEvents(prev => [...prev, newEvent]);

    // Persistir asincrónicamente con rollback en caso de fallo
    (async () => {
      try {
        const { error } = await supabase.from('coverages').insert([mapAppCoverageToDb(newCoverage)]);
        if (error) throw error;
      } catch (err: any) {
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== coverageId));
        setEvents(prev => prev.filter(e => e.coverageId !== coverageId));
        reportError('Error al crear el evento y su cobertura correspondiente.', err);
      }
    })();

    logActivity(undefined, `creó el evento de agenda "${title}" y su cobertura correspondiente`);
  };

  const updateEvent = (
    eventId: string,
    title: string,
    description: string,
    type: CalendarEvent['type'],
    start: string,
    end: string,
    location?: string,
    status?: CalendarEvent['status'],
    assigneeId?: string,
    programs?: ProgramType[],
    formats?: FormatType[]
  ) => {
    const originalEvents = [...events];
    let originalCov: any = null;
    let covToUpdate: any = null;

    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        // If it is linked to a coverage, also update the coverage details!
        if (e.coverageId) {
          const c = coverages.find(x => x.id === e.coverageId);
          if (c) {
            originalCov = { ...c };
            let coverageStatus: Coverage['status'] = c.status;
            if (status !== undefined) {
              if (status === 'in_redaction') coverageStatus = 'in_redaction';
              else if (status === 'published') coverageStatus = 'published';
              else if (status === 'pending_confirmation') coverageStatus = 'pending_confirmation';
              else if (status === 'confirmed') coverageStatus = 'confirmed';
            }
            covToUpdate = {
              ...c,
              title,
              description,
              dateTime: start,
              location: location || c.location || '',
              status: coverageStatus,
              assignees: assigneeId ? [assigneeId] : [],
              programs: programs || [],
              formats: formats || []
            };
            setCoverages(covs => covs.map(x => x.id === e.coverageId ? covToUpdate! : x));
          }
        }

        return {
          ...e,
          title,
          description,
          type,
          start,
          end,
          location,
          status: status || 'pending_confirmation',
          assigneeId,
          programs: programs || [],
          formats: formats || []
        };
      }
      return e;
    }));

    if (covToUpdate && originalCov) {
      const targetCov = covToUpdate;
      const prevCov = originalCov;
      (async () => {
        try {
          const { error } = await supabase
            .from('coverages')
            .update(mapAppCoverageToDb(targetCov))
            .eq('id', targetCov.id);
          if (error) throw error;
        } catch (err: any) {
          console.error('Error updating coverage from event in Supabase:', err.message || err);
          // Rollback both coverages and events
          setCoverages(covs => covs.map(x => x.id === targetCov.id ? prevCov : x));
          setEvents(originalEvents);
        }
      })();
    }

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

          // Convertir automáticamente a cobertura
          const newCoverageId = convertProposalToCoverage(proposalId);

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

  const convertProposalToCoverage = (
    proposalId: string,
    extraDetails?: {
      dateTime: string;
      location: string;
      programs: ProgramType[];
      formats: FormatType[];
      assigneeId?: string;
      status: Coverage['status'];
    }
  ): string => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop || !currentUser) return '';

    // Guard to prevent duplicate conversion
    if (prop.status === 'convertida') {
      reportError('Esta propuesta ya ha sido convertida en cobertura.', new Error('Propuesta ya convertida'));
      return '';
    }

    const id = crypto.randomUUID();
    const targetDateTime = extraDetails?.dateTime || prop.dateTime || new Date().toISOString().substring(0, 16);
    const targetLocation = extraDetails?.location || prop.location || 'A determinar';
    const targetPrograms = extraDetails?.programs || prop.programs || [];
    const targetFormats = extraDetails?.formats || prop.formats || [];
    const targetAssignees = extraDetails?.assigneeId ? [extraDetails.assigneeId] : prop.assignees;
    const targetStatus = extraDetails?.status || 'pending_confirmation';

    const newCoverage: Coverage = {
      id,
      proposalId, // Link coverage to proposal
      title: prop.title,
      description: prop.description,
      dateTime: targetDateTime,
      location: targetLocation,
      status: targetStatus,
      assignees: targetAssignees,
      comments: [], // Clear comments as per Stage 4.5 rules
      multimedia: prop.multimedia, // Reuse original multimedia list directly (JSONB references resolved URLs)
      sharedLinks: prop.sharedLinks, // Reuse links directly
      publications: {
        portal: { status: 'pending' },
        facebook: { status: 'pending' },
        instagram: { status: 'pending' },
        youtube: { status: 'pending' }
      },
      activities: [
        {
          id: `act_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          action: `creó cobertura convirtiendo la propuesta "${prop.title}"`,
          timestamp: new Date().toISOString()
        }
      ],
      programs: targetPrograms,
      formats: targetFormats
    };

    const originalProposals = [...proposals];
    const originalCoverages = [...coverages];
    const originalEvents = [...events];

    setCoverages(prev => [newCoverage, ...prev]);

    const conversionDecision: ProposalDecision = {
      status: 'convertida',
      timestamp: new Date().toISOString(),
      note: `Cobertura iniciada con ID: ${id}`,
      deciderName: currentUser.name
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          status: 'convertida',
          decisionHistory: [conversionDecision, ...(p.decisionHistory || [])]
        };
      }
      return p;
    }));

    // Async DB update with rollback
    (async () => {
      try {
        // 1. Insert coverage
        const { error: covErr } = await supabase.from('coverages').insert([mapAppCoverageToDb(newCoverage)]);
        if (covErr) throw covErr;

        // 2. Update proposals status to 'convertida'
        const { error: propErr } = await supabase
          .from('proposals')
          .update({ status: 'convertida' })
          .eq('id', proposalId);
        if (propErr) throw propErr;

        // 3. Add to decision history audit
        const { error: decErr } = await supabase
          .from('proposal_decisions')
          .insert([
            {
              proposal_id: proposalId,
              decider_id: currentUser.id,
              status: 'convertida',
              note: conversionDecision.note,
              timestamp: conversionDecision.timestamp
            }
          ]);
        if (decErr) throw decErr;

        logActivity(undefined, `Cobertura creada desde propuesta: "${prop.title}"`);
      } catch (err: any) {
        // Rollback states
        setCoverages(originalCoverages);
        setProposals(originalProposals);
        setEvents(originalEvents);

        // Delete coverage if inserted
        await supabase.from('coverages').delete().eq('id', id);
        // Reset status
        await supabase.from('proposals').update({ status: prop.status }).eq('id', proposalId);
        // Delete decision audit
        await supabase
          .from('proposal_decisions')
          .delete()
          .eq('proposal_id', proposalId)
          .eq('status', 'convertida');

        reportError('Error al guardar la nueva cobertura en el servidor de base de datos.', err);
      }
    })();

    // Also add to calendar events
    let eventStatus: CalendarEvent['status'] = 'pending_confirmation';
    if (targetStatus === 'confirmed') eventStatus = 'confirmed';
    else if (targetStatus === 'in_redaction') eventStatus = 'in_redaction';
    else if (targetStatus === 'published') eventStatus = 'published';

    const newEvent: CalendarEvent = {
      id: `e_${id}`,
      title: `[Cobertura] ${prop.title}`,
      description: prop.description,
      type: 'coverage',
      start: targetDateTime,
      end: new Date(new Date(targetDateTime).getTime() + 4 * 60 * 60 * 1000).toISOString().substring(0, 16),
      location: targetLocation,
      status: eventStatus,
      assigneeId: targetAssignees.length > 0 ? targetAssignees[0] : undefined,
      coverageId: id,
      programs: targetPrograms,
      formats: targetFormats
    };

    // Remove the old proposal event from calendar if exists, and insert this new coverage event
    setEvents(prev => {
      const filtered = prev.filter(e => e.id !== `e_prop_${proposalId}`);
      return [...filtered, newEvent];
    });

    return id;
  };

  const updateCoverageDetails = (
    coverageId: string,
    title: string,
    description: string,
    dateTime: string,
    location: string,
    assignees: string[],
    programs: ProgramType[],
    formats: FormatType[],
    status?: Coverage['status'],
    logisticsInfo?: string,
    observations?: string,
    attachments?: string[],
    categoryId?: string
  ) => {
    const cov = coverages.find(c => c.id === coverageId);
    if (!cov) return;

    const originalCov = { ...cov };
    const originalEvents = [...events];

    const updatedCov: Coverage = {
      ...cov,
      title,
      description,
      dateTime,
      location,
      assignees,
      programs,
      formats,
      status: status !== undefined ? status : cov.status,
      logisticsInfo: logisticsInfo !== undefined ? logisticsInfo : cov.logisticsInfo,
      observations: observations !== undefined ? observations : cov.observations,
      attachments: attachments !== undefined ? attachments : cov.attachments,
      categoryId: categoryId !== undefined ? categoryId : cov.categoryId
    };

    setCoverages(prev => prev.map(c => c.id === coverageId ? updatedCov : c));

    // Persistir asincrónicamente con rollback en caso de fallo
    (async () => {
      try {
        const { error } = await supabase
          .from('coverages')
          .update(mapAppCoverageToDb(updatedCov))
          .eq('id', coverageId);
        if (error) throw error;
      } catch (err: any) {
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
        setEvents(originalEvents);
        reportError('Error al guardar los detalles de la cobertura en el servidor de base de datos.', err);
      }
    })();

    // Update corresponding calendar event
    setEvents(prev => prev.map(e => {
      if (e.coverageId === coverageId) {
        let eventStatus: CalendarEvent['status'] = e.status;
        if (status !== undefined) {
          if (status === 'confirmed') eventStatus = 'confirmed';
          else if (status === 'in_redaction') eventStatus = 'in_redaction';
          else if (status === 'published') eventStatus = 'published';
          else if (status === 'pending_confirmation') eventStatus = 'pending_confirmation';
        }

        return {
          ...e,
          title: `[Cobertura] ${title}`,
          description,
          start: dateTime,
          end: new Date(new Date(dateTime).getTime() + 4 * 60 * 60 * 1000).toISOString().substring(0, 16),
          location,
          assigneeId: assignees.length > 0 ? assignees[0] : undefined,
          programs,
          formats,
          status: eventStatus
        };
      }
      return e;
    }));

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

    if (coverages.some(c => c.id === coverageId)) return;

    const newCoverage: Coverage = {
      id: coverageId,
      title: event.title.replace(/^\[Cobertura\] /, '').replace(/^\[Propuesta Aprobada\] /, ''),
      description: event.description || 'Recreado a partir de la actividad de agenda.',
      dateTime: event.start,
      location: event.location || 'A determinar',
      status: event.status === 'published' ? 'published' : (event.status === 'in_redaction' ? 'in_redaction' : (event.status === 'confirmed' ? 'confirmed' : 'pending_confirmation')),
      assignees: event.assigneeId ? [event.assigneeId] : [],
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
        {
          id: `act_recreate_${Date.now()}`,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Sistema',
          action: 'recreó la cobertura a partir de la actividad de agenda',
          timestamp: new Date().toISOString()
        }
      ],
      programs: event.programs || [],
      formats: event.formats || []
    };

    setCoverages(prev => [newCoverage, ...prev]);

    // Persistir asincrónicamente con rollback en caso de fallo
    (async () => {
      try {
        const { error } = await supabase.from('coverages').insert([mapAppCoverageToDb(newCoverage)]);
        if (error) throw error;
      } catch (err: any) {
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== coverageId));
        reportError('Error al recrear la cobertura en el servidor de base de datos.', err);
      }
    })();

    logActivity(undefined, `recreó la cobertura "${newCoverage.title}" vinculada al evento de agenda`);
  };

  return (
    <HubContext.Provider value={{
      currentUser,
      users,
      coverages,
      tasks,
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
      convertProposalToCoverage,
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
