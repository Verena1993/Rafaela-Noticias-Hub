import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS, INITIAL_COVERAGES, INITIAL_TASKS, INITIAL_ALERTS, INITIAL_EVENTS, INITIAL_NOTIFICATIONS, INITIAL_PROPOSALS, INITIAL_STAFF_SCHEDULE, INITIAL_INSTAGRAM_POSTS, INITIAL_NEWS_RADAR } from '../data/initialData';

import type { User, Coverage, Task, Alert, CalendarEvent, Notification, Activity, Comment, MultimediaItem, SharedLink, PublicationChecklist, Proposal, StaffSchedule, ProgramType, FormatType, InstagramPost, NewsRadarItem, RssDiagnostic } from '../types';
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
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createHubUser: (nombre: string, email: string, password?: string, rol?: 'admin' | 'editor') => Promise<void>;
  updateHubUser: (id: string, updates: Partial<User>) => Promise<void>;
  toggleUserActive: (id: string, activo: boolean) => Promise<void>;
  addCoverage: (title: string, description: string, dateTime: string, location: string, assignees: string[], programs?: ProgramType[], formats?: FormatType[], status?: Coverage['status'], logisticsInfo?: string, observations?: string, attachments?: string[]) => string;
  updateCoverageStatus: (coverageId: string, status: Coverage['status']) => void;
  addCommentToCoverage: (coverageId: string, text: string) => void;
  addMultimediaToCoverage: (coverageId: string, name: string, type: 'photo' | 'video' | 'audio' | 'document', url: string, size: string) => void;
  addSharedLinkToCoverage: (coverageId: string, title: string, url: string, comments?: string) => void;
  updatePublicationStatus: (coverageId: string, platform: keyof PublicationChecklist, status: 'pending' | 'published', link?: string) => void;
  addTask: (title: string, dueDate: string, assigneeId: string, coverageId?: string) => void;
  toggleTaskCompleted: (taskId: string) => void;
  addEvent: (title: string, description: string, type: CalendarEvent['type'], start: string, end: string, location?: string, assigneeId?: string, programs?: ProgramType[], formats?: FormatType[]) => void;
  updateEvent: (eventId: string, title: string, description: string, type: CalendarEvent['type'], start: string, end: string, location?: string, status?: CalendarEvent['status'], assigneeId?: string, programs?: ProgramType[], formats?: FormatType[]) => void;
  updateCoverageDetails: (coverageId: string, title: string, description: string, dateTime: string, location: string, assignees: string[], programs: ProgramType[], formats: FormatType[], status?: Coverage['status'], logisticsInfo?: string, observations?: string, attachments?: string[]) => void;
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
  updateProposalStatus: (proposalId: string, status: Proposal['status']) => void;
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

  // News Radar
  updateNewsRadarItem: (id: string, updates: Partial<NewsRadarItem>) => void;
  fetchLiveRadarNews: () => Promise<void>;
  loadingRadar: boolean;
  radarError: string | null;
  lastRadarUpdate: string | null;
  rssDiagnostics: RssDiagnostic[];
}

const HubContext = createContext<HubContextType | undefined>(undefined);

export const useHub = () => {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error('useHub must be used within a HubProvider');
  }
  return context;
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
    attachments: Array.isArray(dbCov.attachments) ? dbCov.attachments : []
  };
};

const mapAppCoverageToDb = (appCov: Coverage) => ({
  id: appCov.id,
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
  attachments: appCov.attachments || []
});

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const [coverages, setCoverages] = useState<Coverage[]>(() => {
    const saved = localStorage.getItem('hub_coverages');
    return saved ? JSON.parse(saved) : INITIAL_COVERAGES;
  });

  const [loadingCoverages, setLoadingCoverages] = useState(true);

  const fetchCoverages = async () => {
    try {
      const { data, error } = await supabase.from('coverages').select('*');
      if (error) {
        console.error('Error fetching coverages from Supabase:', error.message);
        // Fallback a localStorage o INITIAL_COVERAGES
        const saved = localStorage.getItem('hub_coverages');
        setCoverages(saved ? JSON.parse(saved) : INITIAL_COVERAGES);
        return;
      }

      if (data && data.length > 0) {
        const loaded = data.map(mapDbCoverageToApp);
        setCoverages(loaded);
        localStorage.setItem('hub_coverages', JSON.stringify(loaded));
      } else {
        // Seeding inicial con fallback de localStorage o INITIAL_COVERAGES
        const saved = localStorage.getItem('hub_coverages');
        const fallback = saved ? JSON.parse(saved) : INITIAL_COVERAGES;
        const dbData = fallback.map(mapAppCoverageToDb);
        const { error: insertError } = await supabase.from('coverages').insert(dbData);
        if (insertError) {
          console.error('Error seeding initial coverages to Supabase:', insertError.message);
        }
        setCoverages(fallback);
        localStorage.setItem('hub_coverages', JSON.stringify(fallback));
      }
    } catch (err) {
      console.error('Unexpected error in fetchCoverages:', err);
      const saved = localStorage.getItem('hub_coverages');
      setCoverages(saved ? JSON.parse(saved) : INITIAL_COVERAGES);
    } finally {
      setLoadingCoverages(false);
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
    return saved ? JSON.parse(saved) : INITIAL_PROPOSALS;
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

  // Collect all activities from all coverages
  const [activities, setActivities] = useState<Activity[]>(() => {
    const allActs: Activity[] = [];
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
      if (error) {
        console.error('Error fetching profiles:', error.message);
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
          created_at: p.created_at
        }));

        // Merge dbUsers with INITIAL_USERS to keep mock users
        const merged = [...INITIAL_USERS];
        dbUsers.forEach(dbU => {
          const idx = merged.findIndex(u => u.email.toLowerCase() === dbU.email.toLowerCase());
          if (idx !== -1) {
            merged[idx] = { ...merged[idx], ...dbU };
          } else {
            merged.push(dbU);
          }
        });
        setUsers(merged);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  useEffect(() => {
    // 1. Initial auth check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile && profile.activo) {
          setCurrentUser({
            id: profile.id,
            name: profile.nombre,
            email: profile.email,
            role: profile.rol as 'admin' | 'editor',
            avatarColor: profile.rol === 'admin' ? '#1e3a8a' : '#0f766e',
            activo: profile.activo,
            created_at: profile.created_at
          });
        } else {
          if (profile && !profile.activo) {
            await supabase.auth.signOut();
          }
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      fetchUsers();
    };

    checkUser();

    // 2. Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile && profile.activo) {
          setCurrentUser({
            id: profile.id,
            name: profile.nombre,
            email: profile.email,
            role: profile.rol as 'admin' | 'editor',
            avatarColor: profile.rol === 'admin' ? '#1e3a8a' : '#0f766e',
            activo: profile.activo,
            created_at: profile.created_at
          });
        } else {
          if (profile && !profile.activo) {
            await supabase.auth.signOut();
          }
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      fetchUsers();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Automatically load RSS feeds on initial mount
    fetchLiveRadarNews();
    fetchCoverages();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hub_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('hub_coverages', JSON.stringify(coverages));
    // Update local activity list whenever coverages change
    const allActs: Activity[] = [];
    coverages.forEach(cov => {
      if (cov.activities) {
        allActs.push(...cov.activities.map(act => ({ ...act, coverageId: cov.id })));
      }
    });
    setActivities(allActs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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

        setCurrentUser({
          id: profile.id,
          name: profile.nombre,
          email: profile.email,
          role: profile.rol as 'admin' | 'editor',
          avatarColor: profile.rol === 'admin' ? '#1e3a8a' : '#0f766e',
          activo: profile.activo,
          created_at: profile.created_at
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

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id);
      if (error) {
        throw error;
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
      setActivities(prev => [newAct, ...prev]);
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
    attachments?: string[]
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
      attachments: attachments || []
    };

    setCoverages(prev => [newCoverage, ...prev]);

    // Persistencia asíncrona robusta con await y rollback
    (async () => {
      try {
        const { error } = await supabase.from('coverages').insert([mapAppCoverageToDb(newCoverage)]);
        if (error) throw error;
      } catch (err: any) {
        console.error('Error inserting coverage into Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== id));
        setEvents(prev => prev.filter(e => e.coverageId !== id));
        alert('Error al crear la cobertura en el servidor de base de datos.');
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
        console.error('Error updating status in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
        alert('Error al actualizar el estado de la cobertura en el servidor de base de datos.');
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
    INITIAL_USERS.forEach(u => {
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
      if (uid !== currentUser.id && !text.toLowerCase().includes(`@${INITIAL_USERS.find(user => user.id === uid)?.name.toLowerCase().split(' ')[0]}`)) {
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
      logActivity(coverageId, `asignó la tarea "${title}" a ${INITIAL_USERS.find(u => u.id === assigneeId)?.name}`);
    } else {
      logActivity(undefined, `asignó la tarea general "${title}" a ${INITIAL_USERS.find(u => u.id === assigneeId)?.name}`);
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
        console.error('Error auto-creating coverage from agenda event in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== coverageId));
        setEvents(prev => prev.filter(e => e.coverageId !== coverageId));
        alert('Error al crear el evento y su cobertura correspondiente.');
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
    const id = `prop_${Date.now()}`;

    const mappedFiles: MultimediaItem[] = files ? files.map((f, i) => ({
      id: `m_prop_${Date.now()}_${i}`,
      type: f.type,
      name: f.name,
      url: f.url,
      size: f.size,
      uploadDate: new Date().toISOString(),
      userId: currentUser.id
    })) : [];

    const mappedLinks: SharedLink[] = links ? links.map((l, i) => ({
      id: `sl_prop_${Date.now()}_${i}`,
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
      status: 'new',
      assignees: assignees || [],
      programs: programs || [],
      formats: formats || []
    };

    setProposals(prev => [newProposal, ...prev]);
    logActivity(undefined, `creó una propuesta de nota: "${title}"`);
  };

  const updateProposalStatus = (
    proposalId: string,
    status: Proposal['status'],
    extra?: { priority?: 'high' | 'medium' | 'low'; dateTime?: string; location?: string; assignees?: string[]; programs?: ProgramType[]; formats?: FormatType[] }
  ) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        const nextProposal = {
          ...p,
          status,
          priority: extra?.priority !== undefined ? extra.priority : p.priority,
          dateTime: extra?.dateTime !== undefined ? extra.dateTime : p.dateTime,
          location: extra?.location !== undefined ? extra.location : p.location,
          assignees: extra?.assignees !== undefined ? extra.assignees : p.assignees,
          programs: extra?.programs !== undefined ? extra.programs : p.programs,
          formats: extra?.formats !== undefined ? extra.formats : p.formats
        };

        // If approved and has date/time, verify if it is already in the calendar, otherwise add it
        if (status === 'approved' && nextProposal.dateTime) {
          const eventId = `e_prop_${proposalId}`;
          setEvents(evts => {
            const exists = evts.some(e => e.id === eventId);
            if (!exists) {
              const newEvt: CalendarEvent = {
                id: eventId,
                title: `[Propuesta Aprobada] ${p.title}`,
                description: p.description,
                type: 'event',
                start: nextProposal.dateTime!,
                end: new Date(new Date(nextProposal.dateTime!).getTime() + 2 * 60 * 60 * 1000).toISOString().substring(0, 16),
                location: nextProposal.location,
                status: 'confirmed',
                assigneeId: nextProposal.assignees.length > 0 ? nextProposal.assignees[0] : undefined,
                programs: nextProposal.programs || [],
                formats: nextProposal.formats || []
              };
              return [...evts, newEvt];
            } else {
              // Update existing event date/time
              return evts.map(e => e.id === eventId ? {
                ...e,
                start: nextProposal.dateTime!,
                end: new Date(new Date(nextProposal.dateTime!).getTime() + 2 * 60 * 60 * 1000).toISOString().substring(0, 16),
                location: nextProposal.location,
                assigneeId: nextProposal.assignees.length > 0 ? nextProposal.assignees[0] : undefined,
                programs: nextProposal.programs || [],
                formats: nextProposal.formats || []
              } : e);
            }
          });
        }

        return nextProposal;
      }
      return p;
    }));

    const statusNames: Record<Proposal['status'], string> = {
      new: 'Nueva',
      in_evaluation: 'En Evaluación',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      assigned: 'Asignada',
      covered: 'Cubierta'
    };
    logActivity(undefined, `cambió el estado de propuesta a "${statusNames[status]}"`);
  };

  const addCommentToProposal = (proposalId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `com_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString()
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));
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

    const id = crypto.randomUUID();
    const targetDateTime = extraDetails?.dateTime || prop.dateTime || new Date().toISOString().substring(0, 16);
    const targetLocation = extraDetails?.location || prop.location || 'A determinar';
    const targetPrograms = extraDetails?.programs || prop.programs || [];
    const targetFormats = extraDetails?.formats || prop.formats || [];
    const targetAssignees = extraDetails?.assigneeId ? [extraDetails.assigneeId] : prop.assignees;
    const targetStatus = extraDetails?.status || 'pending_confirmation';

    const newCoverage: Coverage = {
      id,
      title: prop.title,
      description: prop.description,
      dateTime: targetDateTime,
      location: targetLocation,
      status: targetStatus,
      assignees: targetAssignees,
      comments: prop.comments, // carry over
      multimedia: prop.multimedia, // carry over
      sharedLinks: prop.sharedLinks, // carry over
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

    setCoverages(prev => [newCoverage, ...prev]);

    // Persistir asincrónicamente con rollback en caso de fallo
    (async () => {
      try {
        const { error } = await supabase.from('coverages').insert([mapAppCoverageToDb(newCoverage)]);
        if (error) throw error;
      } catch (err: any) {
        console.error('Error inserting coverage from proposal into Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== id));
        setEvents(prev => prev.filter(e => e.coverageId !== id));
        alert('Error al guardar la nueva cobertura en el servidor de base de datos.');
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

    // Mark proposal as covered
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return { ...p, status: 'covered' };
      }
      return p;
    }));

    logActivity(undefined, `convirtió propuesta "${prop.title}" en cobertura periodística activa`);
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
    attachments?: string[]
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
      attachments: attachments !== undefined ? attachments : cov.attachments
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
        console.error('Error updating coverage details in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.map(c => c.id === coverageId ? originalCov : c));
        setEvents(originalEvents);
        alert('Error al guardar los detalles de la cobertura en el servidor de base de datos.');
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
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          title,
          description,
          dateTime,
          location,
          assignees: assignees || [],
          programs: programs || [],
          formats: formats || []
        };
      }
      return p;
    }));
    logActivity(undefined, `actualizó los detalles de la propuesta: "${title}"`);
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
    INITIAL_USERS.forEach(u => {
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
        console.error('Error recreating coverage in Supabase:', err.message || err);
        // Rollback state
        setCoverages(prev => prev.filter(c => c.id !== coverageId));
        alert('Error al recrear la cobertura en el servidor de base de datos.');
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
      login,
      logout,
      createHubUser,
      updateHubUser,
      toggleUserActive,
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
