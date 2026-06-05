import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Plus, 
  MapPin, 
  Clock, 
  Tag, 
  User as UserIcon, 
  Users, 
  Eye, 
  Edit3
} from 'lucide-react';
import type { CalendarEvent, StaffSchedule, ProgramType, FormatType } from '../data/mockData';
import { formatFriendlyDate } from '../utils/dateUtils';
import { EventEditModal } from './EventEditModal';
import type { EventEditData } from './EventEditModal';

interface CalendarProps {
  setSelectedCoverageId?: (id: string | null) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  setSelectedCoverageId 
}) => {
  const { 
    events, 
    coverages,
    users, 
    staffSchedules, 
    addEvent, 
    updateEvent, 
    updateStaffSchedule 
  } = useHub();

  const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital'];
  const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Date state
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<ProgramType | 'Todos'>('Todos');


  // Filter events by program
  const filteredEvents = events.filter(evt => {
    if (selectedProgramFilter === 'Todos') return true;
    return evt.programs && evt.programs.includes(selectedProgramFilter);
  });

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Align Mon-Sun

  const blankDays = Array.from({ length: firstDayIndex }, () => null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Event Edit states
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Staff management modal states
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaffDate, setSelectedStaffDate] = useState('');
  const [staffDayGuards, setStaffDayGuards] = useState<string[]>([]);
  const [staffDayVacations, setStaffDayVacations] = useState<string[]>([]);
  const [staffDayAbsents, setStaffDayAbsents] = useState<string[]>([]);
  const [staffDayOffs, setStaffDayOffs] = useState<string[]>([]);

  // Form states (new event)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<CalendarEvent['type']>('press_conference');
  const [newStart, setNewStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T10:00`;
  });
  const [newEnd, setNewEnd] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T12:00`;
  });
  const [newLoc, setNewLoc] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newPrograms, setNewPrograms] = useState<ProgramType[]>([]);
  const [newFormats, setNewFormats] = useState<FormatType[]>([]);

  const toggleNewProgram = (prog: ProgramType) => {
    setNewPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };
  const toggleNewFormat = (form: FormatType) => {
    setNewFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addEvent(
      newTitle,
      newDesc,
      newType,
      newStart,
      newEnd,
      newLoc ? newLoc : undefined,
      newAssigneeId ? newAssigneeId : undefined,
      newPrograms,
      newFormats
    );

    setNewTitle('');
    setNewDesc('');
    setNewLoc('');
    setNewAssigneeId('');
    setNewPrograms([]);
    setNewFormats([]);
    setShowAddModal(false);
  };

  const getEventClass = (type: CalendarEvent['type']) => {
    return `calendar-event-pill event-${type}`;
  };

  const getEventTypeName = (type: CalendarEvent['type']) => {
    const map: Record<CalendarEvent['type'], string> = {
      coverage: 'Cobertura',
      press_conference: 'Conferencia',
      interview: 'Entrevista',
      event: 'Evento Gral.',
      key_date: 'Fecha Impor.'
    };
    return map[type] || 'Evento';
  };



  // Staff Schedule Getter
  const getDaySchedule = (dateStr: string): StaffSchedule => {
    const sched = staffSchedules.find(s => s.date === dateStr);
    return sched || {
      date: dateStr,
      guardIds: [],
      vacationIds: [],
      absentIds: [],
      offIds: []
    };
  };

  const handleOpenStaffModal = (dateStr: string) => {
    const sched = getDaySchedule(dateStr);
    setSelectedStaffDate(dateStr);
    setStaffDayGuards(sched.guardIds);
    setStaffDayVacations(sched.vacationIds);
    setStaffDayAbsents(sched.absentIds);
    setStaffDayOffs(sched.offIds);
    setShowStaffModal(true);
  };

  const handleSaveStaffSchedule = () => {
    updateStaffSchedule(selectedStaffDate, {
      guardIds: staffDayGuards,
      vacationIds: staffDayVacations,
      absentIds: staffDayAbsents,
      offIds: staffDayOffs
    });
    setShowStaffModal(false);
  };

  const handleStaffUserStatusChange = (userId: string, status: 'active' | 'guard' | 'vacation' | 'absent' | 'off') => {
    // Clear all lists for this user
    setStaffDayGuards(prev => prev.filter(id => id !== userId));
    setStaffDayVacations(prev => prev.filter(id => id !== userId));
    setStaffDayAbsents(prev => prev.filter(id => id !== userId));
    setStaffDayOffs(prev => prev.filter(id => id !== userId));

    if (status === 'guard') setStaffDayGuards(prev => [...prev, userId]);
    else if (status === 'vacation') setStaffDayVacations(prev => [...prev, userId]);
    else if (status === 'absent') setStaffDayAbsents(prev => [...prev, userId]);
    else if (status === 'off') setStaffDayOffs(prev => [...prev, userId]);
  };

  const handleSelectEventForView = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setIsEditingEvent(false);
    
    // Prefill edit form
    setEditTitle(evt.title);
    setEditDesc(evt.description || '');
    setEditStart(evt.start);
    setEditEnd(evt.end);
  };

  const handleSaveEditedEvent = (data: EventEditData) => {
    if (!selectedEvent) return;

    updateEvent(
      selectedEvent.id,
      data.title,
      data.description,
      selectedEvent.type, // we don't allow changing type once linked, or maybe we do, but EventEditModal currently doesn't edit type.
      data.start,
      data.end,
      data.location || undefined,
      data.status,
      data.assigneeId || undefined,
      data.programs,
      data.formats
    );

    setSelectedEvent(null);
    setIsEditingEvent(false);
  };

  const navigateToCoverage = (coverageId: string) => {
    if (setSelectedCoverageId) {
      setSelectedCoverageId(coverageId);
      setSelectedEvent(null);
    }
  };

  const getStatusLabel = (status: CalendarEvent['status']) => {
    const map: Record<string, string> = {
      pending_confirmation: 'Pendiente de confirmación',
      confirmed: 'Confirmada',
      in_redaction: 'En Redacción',
      published: 'Publicada'
    };
    return map[status] || 'Pendiente de confirmación';
  };

  return (
    <div className="calendar-module">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Calendario Editorial</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Agenda periodística unificada. Planifica eventos y gestiona las guardias de la redacción.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* View Toggles */}
          <div style={{
            display: 'flex', 
            backgroundColor: 'var(--bg-tertiary)', 
            padding: '0.2rem', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            {['month', 'week', 'day'].map((mode) => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode as any)} 
                className="btn"
                style={{
                  background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => {
            setNewPrograms(selectedProgramFilter !== 'Todos' ? [selectedProgramFilter] : []);
            setNewFormats([]);
            setShowAddModal(true);
          }}>
            <Plus size={16} /> Programar Evento
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="card" style={{ padding: '1rem' }}>
        {/* Program Filter Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1rem',
          overflowX: 'auto',
          gap: '0.25rem',
          paddingBottom: '0.25rem'
        }}>
          {['Todos', 'Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital'].map((prog) => {
            const isActive = selectedProgramFilter === prog;
            return (
              <button
                key={prog}
                onClick={() => setSelectedProgramFilter(prog as any)}
                type="button"
                style={{
                  padding: '0.4rem 0.8rem',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'var(--transition)',
                  whiteSpace: 'nowrap'
                }}
              >
                {prog === 'Todos' ? '🌐 Todos' : `📻 ${prog}`}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.2rem 0.5rem', fontWeight: 'bold' }} 
              onClick={handlePrevMonth}
            >
              ◀
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.2rem 0.5rem', fontWeight: 'bold' }} 
              onClick={handleNextMonth}
            >
              ▶
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 Agenda y Estado Operativo</span>
        </div>

        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <div>
            <div className="calendar-grid">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                <div key={d} className="calendar-header-day">{d}</div>
              ))}
              
              {/* Blank days */}
              {blankDays.map((_, idx) => (
                <div key={`blank-${idx}`} className="calendar-day-cell empty" style={{ height: '120px', backgroundColor: 'var(--bg-secondary)', opacity: 0.35 }}></div>
              ))}

              {/* Render Days */}
              {daysArray.map(day => {
                const formattedDay = day < 10 ? `0${day}` : day;
                const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : (currentMonth + 1);
                const dayStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
                const dayEvents = filteredEvents
                  .filter(e => e.start.startsWith(dayStr))
                  .sort((a, b) => {
                    const timeA = a.start.split('T')[1] || '';
                    const timeB = b.start.split('T')[1] || '';
                    return timeA.localeCompare(timeB);
                  });
                
                const todayObj = new Date();
                const isToday = todayObj.getDate() === day && todayObj.getMonth() === currentMonth && todayObj.getFullYear() === currentYear;
                
                const daySched = getDaySchedule(dayStr);

                const MAX_VISIBLE = 3;
                const visibleEvents = dayEvents.slice(0, MAX_VISIBLE);
                const hiddenCount = dayEvents.length - MAX_VISIBLE;

                return (
                  <div 
                    key={day} 
                    className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                    style={{ height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span 
                        className="calendar-day-num"
                        style={{ cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => {
                          setViewDate(new Date(currentYear, currentMonth, day));
                          setViewMode('day');
                        }}
                        title="Ver detalles del día"
                      >
                        {day}
                      </span>
                      <button 
                        onClick={() => handleOpenStaffModal(dayStr)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--primary)', padding: '0.1rem' }}
                        title="Gestionar personal del día"
                      >
                        <Users size={11} />
                      </button>
                    </div>

                    {/* Staff indicators - compact */}
                    {daySched.guardIds.length > 0 && (
                      <div style={{ fontSize: '0.6rem', background: '#d1fae5', color: '#065f46', padding: '0.05rem 0.2rem', borderRadius: '2px', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🛡️ {daySched.guardIds.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).join(', ')}
                      </div>
                    )}
                    
                    {/* Events pills - compact single line */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, overflow: 'hidden' }}>
                      {visibleEvents.map(evt => (
                        <div 
                          key={evt.id} 
                          className={getEventClass(evt.type)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (evt.coverageId) {
                              navigateToCoverage(evt.coverageId);
                            } else {
                              handleSelectEventForView(evt);
                            }
                          }}
                          title={`${evt.title} (${getEventTypeName(evt.type)})`}
                          style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.3rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                        >
                          {evt.start.split('T')[1]?.substring(0,5)} {evt.title.replace(/^\[Cobertura\] /, '')}
                        </div>
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setViewDate(new Date(currentYear, currentMonth, day));
                            setViewMode('day');
                          }}
                          style={{
                            fontSize: '0.6rem',
                            color: 'var(--primary)',
                            background: 'var(--primary-light)',
                            border: 'none',
                            borderRadius: '2px',
                            padding: '0.1rem 0.3rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: 600,
                            width: '100%'
                          }}
                        >
                          +{hiddenCount} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW (Resumed List of this week) */}
        {viewMode === 'week' && (() => {
          const getMondayOfDate = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setDate(diff));
          };
          const weekStart = getMondayOfDate(viewDate);
          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
          });
          
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {weekDays.map((dayDate, idx) => {
                const year = dayDate.getFullYear();
                const month = String(dayDate.getMonth() + 1).padStart(2, '0');
                const dateVal = String(dayDate.getDate()).padStart(2, '0');
                const dayStr = `${year}-${month}-${dateVal}`;
                
                const dayEvents = filteredEvents
                  .filter(e => e.start.startsWith(dayStr))
                  .sort((a, b) => {
                    const timeA = a.start.split('T')[1] || '';
                    const timeB = b.start.split('T')[1] || '';
                    return timeA.localeCompare(timeB);
                  });
                const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                
                const todayObj = new Date();
                const isToday = todayObj.getDate() === dayDate.getDate() && todayObj.getMonth() === dayDate.getMonth() && todayObj.getFullYear() === dayDate.getFullYear();
                
                const dayLabel = `${dayNames[idx]} ${dayDate.getDate()}${isToday ? ' (Hoy)' : ''}`;
                const sched = getDaySchedule(dayStr);

                return (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)', 
                      backgroundColor: isToday ? 'var(--primary-light)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '260px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setViewDate(dayDate)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{dayLabel}</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenStaffModal(dayStr); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                        >
                          <Users size={12} />
                        </button>
                      </div>

                      {/* Week Day Events */}
                      {dayEvents.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Sin compromisos</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                          {dayEvents.map(evt => (
                            <div 
                              key={evt.id} 
                              style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (evt.coverageId) {
                                  navigateToCoverage(evt.coverageId);
                                } else {
                                  handleSelectEventForView(evt);
                                }
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {evt.title.replace(/^\[Cobertura\] /, '')}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {getEventTypeName(evt.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Staff breakdown block inside week card */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.7rem' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Operativos:</div>
                      {sched.guardIds.length > 0 && (
                        <div>🟢 <b>Guardia:</b> {sched.guardIds.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).join(', ')}</div>
                      )}
                      {sched.offIds.length > 0 && (
                        <div style={{ color: 'var(--text-muted)' }}>🏖️ <b>Franco:</b> {sched.offIds.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).join(', ')}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* DAY VIEW */}
        {viewMode === 'day' && (() => {
          const dayStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`;
          const dayEvents = filteredEvents
            .filter(e => e.start.startsWith(dayStr))
            .sort((a, b) => {
              const timeA = a.start.split('T')[1] || '';
              const timeB = b.start.split('T')[1] || '';
              return timeA.localeCompare(timeB);
            });
          const sched = getDaySchedule(dayStr);
          
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    Compromisos del {formatFriendlyDate(viewDate)}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                      onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - 1))}
                    >
                      ◀ Anterior
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                      onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 1))}
                    >
                      Siguiente ▶
                    </button>
                  </div>
                </div>
                
                {dayEvents.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    No hay actividades programadas para este día.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {dayEvents.map(evt => {
                      const timeStart = evt.start.split('T')[1]?.substring(0, 5) || '00:00';
                      const timeEnd = evt.end.split('T')[1]?.substring(0, 5) || '00:00';
                      
                      const eventStatusLabels: Record<string, string> = {
                        pending: 'Pendiente',
                        confirmed: 'Confirmada',
                        in_coverage: 'En Cobertura',
                        finished: 'Finalizada',
                        suspended: 'Suspendida',
                        pending_confirmation: 'Pendiente de confirmación',
                        in_redaction: 'En Redacción',
                        ready_to_publish: 'En Redacción',
                        published: 'Publicada'
                      };


                      let assigneesList: string[] = [];
                      if (evt.coverageId) {
                         const cov = coverages.find(c => c.id === evt.coverageId);
                         if (cov) assigneesList = cov.assignees;
                      } else if (evt.assigneeId) {
                         assigneesList = [evt.assigneeId];
                      }
                      const assigneeNames = assigneesList.map(uid => users.find(u => u.id === uid)?.name).filter(Boolean).join(', ') || 'Sin asignar';

                      return (
                        <div 
                          key={evt.id} 
                          style={{ 
                            padding: '0.85rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                          onClick={() => {
                            if (evt.coverageId) {
                              navigateToCoverage(evt.coverageId);
                            } else {
                              handleSelectEventForView(evt);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>{evt.title.replace(/^\[Cobertura\] /, '')}</h5>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className={`badge event-${evt.type}`}>{getEventTypeName(evt.type)}</span>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{eventStatusLabels[evt.status || 'pending'] || 'Pendiente'}</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (evt.coverageId) {
                                  navigateToCoverage(evt.coverageId);
                                } else {
                                  handleSelectEventForView(evt);
                                }
                              }}
                            >
                              <Edit3 size={12} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} /> Editar
                            </button>
                          </div>
                          
                          {evt.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{evt.description}</p>}
                          
                          <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600 }}>Responsables:</span> {assigneeNames}
                          </div>

                          {/* Programs & Formats */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.15rem 0' }}>
                            {(evt.programs || []).map((prog, idx) => (
                              <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                📻 {prog}
                              </span>
                            ))}
                            {(evt.formats || []).map((form, idx) => (
                              <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                ⚙️ {form}
                              </span>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>🕒 {timeStart} hs - {timeEnd} hs</span>
                            {evt.location && <span>📍 {evt.location}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Side staff card for Day View */}
              <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Guardias del Día</h4>
                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleOpenStaffModal(dayStr)}>
                    Configurar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#065f46' }}>🟢 En Guardia:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {sched.guardIds.length === 0 ? (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nadie asignado</span>
                      ) : (
                        sched.guardIds.map(uid => (
                          <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                            {users.find(u => u.id === uid)?.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#991b1b' }}>🏖️ Licencias / Francos:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                      {sched.vacationIds.map(uid => (
                        <div key={uid}>✈️ {users.find(u => u.id === uid)?.name} (Vacaciones)</div>
                      ))}
                      {sched.absentIds.map(uid => (
                        <div key={uid}>⚠️ {users.find(u => u.id === uid)?.name} (Ausente)</div>
                      ))}
                      {sched.offIds.map(uid => (
                        <div key={uid}>☕ {users.find(u => u.id === uid)?.name} (Franco)</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* STAFF SCHEDULING CONFIGURATION MODAL */}
      {showStaffModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowStaffModal(false)}>
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Agenda Operativa: {selectedStaffDate}</h3>
              <button onClick={() => setShowStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Asigna el rol de disponibilidad para cada miembro de la redacción periodística en esta fecha.
              </p>
              
              <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Miembro</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Disponibilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      let currentVal = 'active';
                      if (staffDayGuards.includes(u.id)) currentVal = 'guard';
                      else if (staffDayVacations.includes(u.id)) currentVal = 'vacation';
                      else if (staffDayAbsents.includes(u.id)) currentVal = 'absent';
                      else if (staffDayOffs.includes(u.id)) currentVal = 'off';

                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '8px', height: '8px', backgroundColor: u.avatarColor, borderRadius: '50%' }}></span>
                            {u.name}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <select 
                              value={currentVal} 
                              onChange={(e) => handleStaffUserStatusChange(u.id, e.target.value as any)}
                              className="form-select"
                              style={{ padding: '0.25rem', fontSize: '0.75rem', width: '150px' }}
                            >
                              <option value="active">Activo (Disponible)</option>
                              <option value="guard">Guardia</option>
                              <option value="off">Franco</option>
                              <option value="vacation">Vacaciones</option>
                              <option value="absent">Ausente</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowStaffModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveStaffSchedule}>Guardar Agenda</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowAddModal(false)}>
          <div className="modal-content event-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Programar Compromiso / Evento</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="modal-body event-form-grid" style={{ padding: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Título del Compromiso *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Entrevista con concejal..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label">Tipo de Evento</label>
                  <select 
                    className="form-select"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                  >
                    <option value="press_conference">Conferencia de Prensa</option>
                    <option value="interview">Entrevista</option>
                    <option value="event">Evento / Feria / Acto</option>
                    <option value="key_date">Fecha Importante / Efeméride</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Descripción / Pauta</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Detalles breves..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label">Asignar Responsable</label>
                  <select 
                    className="form-select"
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                  >
                    <option value="">Ninguno</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label">Inicio</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label">Fin</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label">Ubicación / Locación</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Jefatura de Policía..."
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Programas Asociados</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {PROGRAM_OPTIONS.map(prog => {
                      const selected = newPrograms.includes(prog);
                      return (
                        <button
                          key={prog}
                          type="button"
                          className="btn"
                          onClick={() => toggleNewProgram(prog)}
                          style={{
                            padding: '0.2rem 0.4rem',
                            fontSize: '0.7rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-color)',
                            background: selected ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: selected ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {prog}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Formatos Logísticos</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {FORMAT_OPTIONS.map(form => {
                      const selected = newFormats.includes(form);
                      return (
                        <button
                          key={form}
                          type="button"
                          className="btn"
                          onClick={() => toggleNewFormat(form)}
                          style={{
                            padding: '0.2rem 0.4rem',
                            fontSize: '0.7rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-color)',
                            background: selected ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: selected ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {form}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar a la Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details FULL EDITABLE Overlay Popover */}
      {selectedEvent && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setSelectedEvent(null)}>
          <div className="modal-content event-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Ficha del Evento</h3>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            
            {isEditingEvent && selectedEvent ? (
              <EventEditModal
                initialData={{
                  title: editTitle,
                  description: editDesc,
                  start: editStart,
                  end: editEnd,
                  location: selectedEvent.location || '',
                  status: selectedEvent.status || 'pending',
                  assigneeId: selectedEvent.assigneeId || '',
                  programs: selectedEvent.programs || [],
                  formats: selectedEvent.formats || []
                }}
                onSave={handleSaveEditedEvent}
                onClose={() => setIsEditingEvent(false)}
              />
            ) : (
              <div>
                <div className="modal-body event-detail-grid" style={{ padding: '1.25rem' }}>
                  {/* Columna Principal (Izquierda en desktop, arriba en móvil) */}
                  <div className="event-detail-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Tag size={16} color="var(--primary)" />
                      <span className={`badge event-${selectedEvent.type}`} style={{ textTransform: 'capitalize' }}>
                        {getEventTypeName(selectedEvent.type)}
                      </span>
                      <span className={`badge status-${selectedEvent.status || 'pending'}`}>
                        {getStatusLabel(selectedEvent.status || 'pending')}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedEvent.title.replace(/^\[Cobertura\] /, '')}
                    </h4>

                    {selectedEvent.description && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Descripción / Pauta
                        </h5>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Columna Lateral (Derecha en desktop, abajo en móvil) */}
                  <div className="event-detail-side-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Horario
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Clock size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                        <span>
                          <b>Inicio:</b> {new Date(selectedEvent.start).toLocaleString()} <br />
                          <b>Fin:</b> {new Date(selectedEvent.end).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {selectedEvent.location && (
                      <div>
                        <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          Ubicación
                        </h5>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={14} style={{ flexShrink: 0 }} />
                          <span>{selectedEvent.location}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Responsable
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <UserIcon size={14} style={{ flexShrink: 0 }} />
                        <span>{selectedEvent.assigneeId ? users.find(u => u.id === selectedEvent.assigneeId)?.name : 'Ninguno'}</span>
                      </div>
                    </div>

                    {/* Programs and Formats */}
                    {((selectedEvent.programs && selectedEvent.programs.length > 0) || (selectedEvent.formats && selectedEvent.formats.length > 0)) && (
                      <div>
                        <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                          Planificación Editorial
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {selectedEvent.programs?.map((prog, idx) => (
                            <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              📻 {prog}
                            </span>
                          ))}
                          {selectedEvent.formats?.map((form, idx) => (
                            <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              ⚙️ {form}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvent.coverageId && (
                      <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--primary-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Enlazado a Cobertura Activa</span>
                        <button 
                          type="button"
                          className="btn btn-primary" 
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', width: '100%', justifyContent: 'center' }} 
                          onClick={() => navigateToCoverage(selectedEvent.coverageId!)}
                        >
                          <Eye size={12} /> Ver Cobertura
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                    Cerrar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => setIsEditingEvent(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Edit3 size={14} /> Editar Ficha
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
