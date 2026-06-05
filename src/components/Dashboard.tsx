import React, { useState, useMemo } from 'react';
import { useHub } from '../context/HubContext';
import { 
  FileText, CheckSquare, AlertTriangle, UserPlus, 
  ExternalLink, ArrowRight, UserCheck, Clock, Activity as ActivityIcon
} from 'lucide-react';
import type { Alert, ProgramType, FormatType } from '../data/mockData';
import { formatFriendlyDate } from '../utils/dateUtils';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedCoverageId: (id: string | null) => void;
  setAutoOpenCreateModal: (open: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedCoverageId, setAutoOpenCreateModal }) => {
  const { 
    coverages, tasks, alerts, events, activities, currentUser, users, 
    assignAlert, toggleTaskCompleted, createAlert, proposals 
  } = useHub();

  // Today's date reference
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const [assigningAlert, setAssigningAlert] = useState<Alert | null>(null);
  const [selectedJournalistId, setSelectedJournalistId] = useState('');
  
  // Alert creation state (for testing)
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'critical' | 'warning'>('warning');


  interface MyDayItem {
    id: string;
    type: string;
    title: string;
    time: string;
    rawTime: string;
    location?: string;
    programs?: ProgramType[];
    formats?: FormatType[];
    completed?: boolean;
    statusLabel: string;
    priorityIndex: number;
    rawItem: any;
  }




  // 1. Get user's today's tasks
  const todayTasks: MyDayItem[] = tasks
    .filter(t => t.assigneeId === currentUser?.id && t.dueDate.startsWith(todayStr))
    .map(t => {
      const timeStr = t.dueDate.split('T')[1]?.substring(0, 5) || '00:00';
      const linkedCov = coverages.find(c => c.id === t.coverageId);
      const subLabel = linkedCov ? `Tarea asignada - Cobertura: ${linkedCov.title}` : 'Tarea asignada';
      return {
        id: t.id,
        type: 'task',
        title: t.title,
        time: timeStr,
        rawTime: t.dueDate,
        statusLabel: subLabel,
        completed: t.completed,
        priorityIndex: 2,
        rawItem: t
      };
    });

  // 2. Get user's today's events/activities/coverages
  const todayEvents: MyDayItem[] = events
    .filter(evt => {
      const isStartToday = evt.start.startsWith(todayStr);
      if (!isStartToday) return false;
      
      const isUserAssignee = evt.assigneeId === currentUser?.id;
      const isUserInCoverage = evt.coverageId && coverages.find(c => c.id === evt.coverageId)?.assignees.includes(currentUser?.id || '');
      
      return isUserAssignee || isUserInCoverage;
    })
    .map(evt => {
      const timeStr = evt.start.split('T')[1]?.substring(0, 5) || '00:00';
      let statusLabel = 'Actividad asignada';
      if (evt.type === 'coverage') statusLabel = 'Cobertura asignada';
      else if (evt.type === 'press_conference') statusLabel = 'Conferencia de prensa';
      else if (evt.type === 'interview') statusLabel = 'Entrevista programada';
      else if (evt.type === 'key_date') statusLabel = 'Fecha clave';

      return {
        id: evt.id,
        type: evt.type,
        title: evt.title.replace(/^\[Cobertura\] /, '').replace(/^\[Propuesta Aprobada\] /, ''),
        time: timeStr,
        rawTime: evt.start,
        location: evt.location,
        programs: evt.programs,
        formats: evt.formats,
        statusLabel,
        priorityIndex: 1,
        rawItem: evt
      };
    });

  // 3. Unify and sort
  const myDayItems: MyDayItem[] = [...todayTasks, ...todayEvents].sort((a, b) => {
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;
    return a.priorityIndex - b.priorityIndex;
  });

  // Filter alerts (only active ones)
  const activeAlerts = alerts.filter(a => a.status === 'active');

  // Today's events
  const upcomingEvents = events
    .filter(e => e.start.startsWith(todayStr))
    .sort((a, b) => a.start.localeCompare(b.start));

  // Recent shared links across all coverages
  const recentLinks: { covId: string; covTitle: string; title: string; url: string; uploadDate: string; userName: string }[] = [];
  coverages.forEach(cov => {
    cov.sharedLinks.forEach(link => {
      const u = users.find(usr => usr.id === link.userId);
      recentLinks.push({
        covId: cov.id,
        covTitle: cov.title,
        title: link.title,
        url: link.url,
        uploadDate: link.uploadDate,
        userName: u ? u.name : 'Usuario'
      });
    });
  });
  // Sort links by date
  recentLinks.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const handleCoverageClick = (id: string) => {
    setSelectedCoverageId(id);
  };

  const decisionItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      subtitle: string;
      reason: string;
      type: 'proposal' | 'flyer' | 'event_pending' | 'coverage_unassigned' | 'activity_unassigned';
      severity: 'high' | 'medium';
      targetId: string;
      tab: 'proposals' | 'coverages' | 'calendar';
    }[] = [];

    // 1. Proposals requiring approval
    proposals.forEach(p => {
      if (p.status === 'new') {
        items.push({
          id: `prop_${p.id}`,
          title: p.title,
          subtitle: p.description ? (p.description.substring(0, 80) + '...') : 'Sin descripción',
          reason: 'Propuesta requiere aprobación',
          type: 'proposal',
          severity: 'high',
          targetId: p.id,
          tab: 'proposals'
        });
      }
    });

    // 2. Flyers received
    proposals.forEach(p => {
      const hasPhoto = p.multimedia.some(m => m.type === 'photo');
      if (hasPhoto && p.status !== 'approved' && p.status !== 'rejected') {
        if (!items.some(it => it.targetId === p.id)) {
          items.push({
            id: `flyer_${p.id}`,
            title: p.title,
            subtitle: `Archivo: ${p.multimedia.find(m => m.type === 'photo')?.name}`,
            reason: 'Flyer recibido pendiente de evaluar',
            type: 'flyer',
            severity: 'medium',
            targetId: p.id,
            tab: 'proposals'
          });
        }
      }
    });

    // 3. Events pending approval
    events.forEach(e => {
      if (e.status === 'pending_confirmation') {
        items.push({
          id: `evt_pend_${e.id}`,
          title: e.title.replace(/^\[Cobertura\] /, ''),
          subtitle: `Horario: ${new Date(e.start).toLocaleString()} - Locación: ${e.location || 'No especificada'}`,
          reason: 'Evento pendiente de aprobación',
          type: 'event_pending',
          severity: 'medium',
          targetId: e.coverageId || e.id,
          tab: e.coverageId ? 'coverages' : 'calendar'
        });
      }
    });

    // 4. Coverages without assignees
    coverages.forEach(c => {
      if (!c.assignees || c.assignees.length === 0) {
        items.push({
          id: `cov_unass_${c.id}`,
          title: c.title,
          subtitle: `Programada para: ${new Date(c.dateTime).toLocaleString()}`,
          reason: 'Cobertura sin responsable',
          type: 'coverage_unassigned',
          severity: 'high',
          targetId: c.id,
          tab: 'coverages'
        });
      }
    });

    // 5. Activities/Events starting soon without assignee
    events.forEach(e => {
      const isSoon = e.start.startsWith(todayStr);
      if (isSoon && !e.assigneeId) {
        if (!items.some(it => it.targetId === (e.coverageId || e.id))) {
          items.push({
            id: `act_unass_${e.id}`,
            title: e.title.replace(/^\[Cobertura\] /, ''),
            subtitle: `Comienza hoy a las ${e.start.split('T')[1] || '00:00'} hs`,
            reason: 'Actividad próxima sin responsable',
            type: 'activity_unassigned',
            severity: 'high',
            targetId: e.coverageId || e.id,
            tab: e.coverageId ? 'coverages' : 'calendar'
          });
        }
      }
    });

    return items;
  }, [proposals, coverages, events, todayStr]);

  const criticalItems = useMemo(() => {
    return decisionItems.filter(item => item.severity === 'high');
  }, [decisionItems]);

  const openAssignModal = (alert: Alert) => {
    setAssigningAlert(alert);
    // Auto-select first journalist
    const journalists = users.filter(u => u.role === 'journalist');
    if (journalists.length > 0) {
      setSelectedJournalistId(journalists[0].id);
    }
  };

  const handleAssignAlert = () => {
    if (assigningAlert && selectedJournalistId) {
      assignAlert(assigningAlert.id, selectedJournalistId);
      setAssigningAlert(null);
      setSelectedJournalistId('');
    }
  };

  const handleCreateAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim()) return;
    createAlert(alertTitle, alertSeverity);
    setAlertTitle('');
    setShowAlertModal(false);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Panel de Control</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Resumen de actividad y tareas para <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatFriendlyDate(todayStr)}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(currentUser?.role === 'admin') && (
            <button className="btn btn-danger" onClick={() => setShowAlertModal(true)}>
              <AlertTriangle size={16} />
              Lanzar Alerta
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setSelectedCoverageId(null); setAutoOpenCreateModal(true); setActiveTab('coverages'); }}>
            <FileText size={16} />
            Nueva Cobertura
          </button>
        </div>
      </div>

      {/* Urgent Alerts Banner Section */}
      {activeAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {activeAlerts.map(alert => (
            <div key={alert.id} className="urgent-banner">
              <span className={`urgent-badge ${alert.severity === 'critical' ? 'priority-high' : 'priority-medium'}`}>
                {alert.severity === 'critical' ? 'Urgente' : 'Último Momento'}
              </span>
              <div className="urgent-content">
                <h4 className="urgent-title">{alert.title}</h4>
                <div className="urgent-time">
                  <Clock size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                </div>
              </div>
              <div>
                {(currentUser?.role === 'admin') ? (
                  <button 
                    className="btn btn-primary" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => openAssignModal(alert)}
                  >
                    <UserPlus size={14} />
                    Asignar Móvil
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger-text)', fontWeight: 600 }}>
                    Esperando asignación
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Main Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Main Column */}
        <div className="dashboard-main-col">
          {/* Today's Coverages */}
          <div className="card">
            <h3 className="section-title">
              <FileText size={18} />
              Coberturas del Día
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingEvents.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                  No hay actividades o coberturas programadas para hoy.
                </p>
              ) : (
                upcomingEvents.map((evt) => {
                  const assignee = users.find(u => u.id === evt.assigneeId);
                  const isAssigned = evt.assigneeId === currentUser?.id || (evt.coverageId && coverages.find(c => c.id === evt.coverageId)?.assignees.includes(currentUser?.id || ''));
                  
                  // Clean event title from prefixes
                  const cleanTitle = evt.title.replace(/^\[Cobertura\] /, '').replace(/^\[Propuesta Aprobada\] /, '');
                  const timeStr = evt.start.split('T')[1]?.substring(0, 5) || '00:00';
                  
                  // Programs and Formats list
                  const eventPrograms = evt.programs || [];
                  const eventFormats = evt.formats || [];

                  // Map statuses to styling classes
                  const statusClassMap: Record<string, string> = {
                    // Event statuses
                    pending: 'status-pending',
                    confirmed: 'status-ready_to_publish',
                    in_coverage: 'status-in_coverage',
                    finished: 'status-published',
                    suspended: 'priority-high',
                    // Coverage statuses
                    pending_confirmation: 'status-pending',
                    in_redaction: 'status-in_coverage',
                    ready_to_publish: 'status-in_coverage',
                    published: 'status-published'
                  };
                  const statusLabelMap: Record<string, string> = {
                    // Event statuses
                    pending: 'Pendiente',
                    confirmed: 'Confirmada',
                    in_coverage: 'En Cobertura',
                    finished: 'Finalizada',
                    suspended: 'Suspendida',
                    // Coverage statuses
                    pending_confirmation: 'Pendiente de confirmación',
                    in_redaction: 'En Redacción',
                    ready_to_publish: 'En Redacción',
                    published: 'Publicada'
                  };

                  return (
                    <div 
                      key={evt.id} 
                      style={{ 
                        padding: '0.85rem', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        backgroundColor: isAssigned ? 'var(--primary-light)' : 'transparent'
                      }}
                      onClick={() => {
                        const cid = evt.coverageId || evt.id;
                        handleCoverageClick(cid);
                      }}
                      className="hover-card-bg"
                    >
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Time badge */}
                        <div style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '0.35rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          textAlign: 'center',
                          minWidth: '60px',
                          flexShrink: 0
                        }}>
                          {timeStr} hs
                        </div>

                        {/* Title and meta tags */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.2rem' }}>
                            {cleanTitle}
                          </h4>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                            {eventPrograms.map((prog, idx) => (
                              <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 600 }}>
                                📻 {prog}
                              </span>
                            ))}
                            {eventFormats.map((form, idx) => (
                              <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 600 }}>
                                ⚙️ {form}
                              </span>
                            ))}
                            {assignee && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.25rem' }}>
                                <div 
                                  className="avatar-circle"
                                  style={{ backgroundColor: assignee.avatarColor, width: '16px', height: '16px', fontSize: '0.55rem', margin: 0 }}
                                >
                                  {assignee.name.charAt(0)}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{assignee.name.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span className={`badge ${statusClassMap[evt.status] || 'status-pending'}`}>
                          {statusLabelMap[evt.status] || evt.status}
                        </span>
                        <ArrowRight size={16} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => setActiveTab('calendar')}
              >
                Ver agenda de producción
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => setActiveTab('coverages')}
              >
                Ir a coberturas (Kanban)
              </button>
            </div>
          </div>

          {/* Shared Material (Central Hub Section) */}
          <div className="card">
            <h3 className="section-title">
              <ExternalLink size={18} />
              Material Compartido Reciente
            </h3>
            {recentLinks.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                Aún no hay enlaces multimedia agregados.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {recentLinks.slice(0, 4).map((link, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)', 
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {link.covTitle.substring(0, 25)}...
                      </span>
                    </div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{link.title}</h5>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Por {link.userName.split(' ')[0]}</span>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Ir al enlace <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="dashboard-sidebar-col">
          {/* My Pending Tasks */}
          <div className="card">
            <h3 className="section-title">
              <CheckSquare size={18} />
              Mis Tareas del Día ({myDayItems.filter(item => item.type === 'task' ? !item.completed : true).length})
            </h3>
            
            {myDayItems.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0' }}>
                No tienes actividades ni tareas asignadas para hoy.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {myDayItems.map((item) => {
                  const isTask = item.type === 'task';
                  
                  if (isTask) {
                    return (
                      <label 
                        key={item.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '0.5rem', 
                          fontSize: '0.85rem', 
                          cursor: 'pointer',
                          padding: '0.65rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: '4px solid var(--text-muted)',
                          backgroundColor: 'var(--bg-secondary)',
                          transition: 'var(--transition)'
                        }}
                        className="hover-card-bg"
                      >
                        <input 
                          type="checkbox" 
                          checked={item.completed} 
                          onChange={() => toggleTaskCompleted(item.id)}
                          style={{ marginTop: '0.25rem' }}
                        />
                        <div style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            🕒 {item.time} hs — {item.statusLabel}
                          </div>
                          <div style={{ fontWeight: 500, marginTop: '0.15rem' }}>{item.title}</div>
                        </div>
                      </label>
                    );
                  }

                  const eventTypeColor = item.type === 'coverage' ? 'var(--primary)' : 'var(--success)';
                  const eventBg = item.type === 'coverage' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(16, 185, 129, 0.04)';
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => {
                        const cid = item.rawItem.coverageId || item.id;
                        handleCoverageClick(cid);
                      }}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.35rem', 
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid ${eventTypeColor}`,
                        backgroundColor: eventBg,
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      className="hover-card-bg"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: eventTypeColor, textTransform: 'uppercase' }}>
                          🕒 {item.time} hs — {item.statusLabel}
                        </span>
                        {item.location && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            📍 {item.location.split(',')[0]}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>

                      {((item.programs && item.programs.length > 0) || (item.formats && item.formats.length > 0)) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.15rem' }}>
                          {item.programs?.map((prog: string, idx: number) => (
                            <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                              📻 {prog}
                            </span>
                          ))}
                          {item.formats?.map((form: string, idx: number) => (
                            <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                              ⚙️ {form}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('tasks')}
            >
              Ver todas las tareas
            </button>
          </div>

          {/* Pendientes de Decisión Section */}
          <div className="card">
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="var(--warning)" />
              Pendientes de Decisión ({decisionItems.length})
            </h3>
            
            {/* Panel de Prioridades Editoriales (Destacado) */}
            {criticalItems.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ⚠️ Prioridad Editorial Requerida
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {criticalItems.slice(0, 3).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setSelectedCoverageId(item.targetId);
                        setActiveTab(item.tab);
                      }}
                      style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#7f1d1d', lineHeight: '1.3' }}
                      className="hover-card-bg"
                    >
                      • <b>{item.reason}:</b> <span style={{ textDecoration: 'underline' }}>{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {decisionItems.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center' }}>
                No hay decisiones pendientes para hoy.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {decisionItems.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: '0.6rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      transition: 'var(--transition)'
                    }}
                    onClick={() => {
                      setSelectedCoverageId(item.targetId);
                      setActiveTab(item.tab);
                    }}
                    className="hover-card-bg"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${item.severity === 'high' ? 'priority-high' : 'priority-medium'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                        {item.reason}
                      </span>
                    </div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{item.title}</h5>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {item.subtitle}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Log */}
          <div className="card">
            <h3 className="section-title">
              <ActivityIcon size={18} />
              Actividad Reciente
            </h3>

            <div className="activity-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {activities.slice(0, 6).map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-circle">A</div>
                  <div>
                    <span style={{ fontWeight: 700 }}>{act.userName.split(' ')[0]} </span>
                    <span>{act.action}</span>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Alert Creation Modal */}
      {showAlertModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Lanzar Nueva Alerta de Último Momento</h3>
              <button className="modal-close" onClick={() => setShowAlertModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAlertSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título de la Alerta</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. ¡Último momento! Accidente grave frente a Plaza 25 de Mayo."
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Severidad / Prioridad</label>
                  <select 
                    className="form-select"
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                  >
                    <option value="warning">Último momento (Alerta media)</option>
                    <option value="critical">Crítico (Alerta roja)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAlertModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Lanzar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Alert to Mobile Modal */}
      {assigningAlert && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Asignar Periodista a Alerta</h3>
              <button className="modal-close" onClick={() => setAssigningAlert(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Estás derivando la alerta: <strong>"{assigningAlert.title}"</strong> a cobertura periodística. Selecciona un redactor o móvil para asignarlo inmediatamente.
              </p>
              
              <div className="form-group">
                <label className="form-label">Seleccionar Responsable</label>
                <select 
                  className="form-select"
                  value={selectedJournalistId}
                  onChange={(e) => setSelectedJournalistId(e.target.value)}
                >
                  {users.filter(u => u.role === 'journalist').map(j => (
                    <option key={j.id} value={j.id}>{j.name} (Móvil)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setAssigningAlert(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAssignAlert}>
                <UserCheck size={14} /> Asignar y Crear Cobertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
