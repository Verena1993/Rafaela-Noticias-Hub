import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Plus, 
  Users, 
  Edit3,
  Paperclip,
  Trash2
} from 'lucide-react';
import type { CalendarEvent, StaffSchedule, ProgramType, FormatType, Ephemeris } from '../types';

import { formatFriendlyDate, formatDateDMY } from '../utils/dateUtils';
import { TextAutocompleteModal } from './TextAutocompleteModal';

interface CalendarProps {
  setSelectedCoverageId?: (id: string | null) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  setSelectedCoverageId
}) => {
  const { 
    events, 
    productions,
    users, 
    staffSchedules, 
    addEvent, 
    updateStaffSchedule 
  } = useHub();

  const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital', 'Comercial'];
  const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [calendarTab, setCalendarTab] = useState<'producciones' | 'efemerides' | 'guardias' | 'libre'>('producciones');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutocompleteModal, setShowAutocompleteModal] = useState(false);

  // Date state
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<ProgramType | 'Todos'>('Todos');

  // Ephemeris state (localStorage)
  const [ephemerisData, setEphemerisData] = useState<Ephemeris[]>(() => {
    try { return JSON.parse(localStorage.getItem('ephemeris_data') || '[]'); } catch { return []; }
  });
  const [showEphemerisModal, setShowEphemerisModal] = useState(false);
  const [ephemerisDate, setEphemerisDate] = useState('');
  const [ephemerisTitle, setEphemerisTitle] = useState('');
  const [ephemerisDesc, setEphemerisDesc] = useState('');
  const [editingEphemerisId, setEditingEphemerisId] = useState<string | null>(null);

  const saveEphemeris = (list: Ephemeris[]) => {
    setEphemerisData(list);
    localStorage.setItem('ephemeris_data', JSON.stringify(list));
  };

  // Match ephemeris by MM-DD only (yearly repetition)
  const getEphemerisByMonthDay = (dateStr: string) => {
    const mmdd = dateStr.slice(5); // '07-01' from '2026-07-01'
    return ephemerisData.filter(e => e.date.slice(5) === mmdd || e.date === dateStr);
  };

  const handleOpenEphemerisModal = (dateStr: string) => {
    // Look for existing entry by full date first, then by MM-DD
    const existing = ephemerisData.find(e => e.date === dateStr)
      || ephemerisData.find(e => e.date.slice(5) === dateStr.slice(5));
    setEphemerisDate(dateStr);
    if (existing) {
      setEditingEphemerisId(existing.id);
      setEphemerisTitle(existing.title);
      setEphemerisDesc(existing.description || '');
    } else {
      setEditingEphemerisId(null);
      setEphemerisTitle('');
      setEphemerisDesc('');
    }
    setShowEphemerisModal(true);
  };

  const handleSaveEphemeris = () => {
    if (!ephemerisTitle.trim()) return;
    // Store using MM-DD so it repeats every year
    const mmddKey = ephemerisDate.slice(5); // '07-01'
    if (editingEphemerisId) {
      saveEphemeris(ephemerisData.map(e => e.id === editingEphemerisId ? { ...e, date: mmddKey, title: ephemerisTitle, description: ephemerisDesc } : e));
    } else {
      // If there's already one for this MM-DD, update it
      const existingMmdd = ephemerisData.find(e => e.date === mmddKey || e.date.slice(5) === mmddKey);
      if (existingMmdd) {
        saveEphemeris(ephemerisData.map(e => e.id === existingMmdd.id ? { ...e, date: mmddKey, title: ephemerisTitle, description: ephemerisDesc } : e));
      } else {
        saveEphemeris([...ephemerisData, { id: crypto.randomUUID(), date: mmddKey, title: ephemerisTitle, description: ephemerisDesc }]);
      }
    }
    setShowEphemerisModal(false);
  };

  const handleDeleteEphemeris = (id: string) => {
    saveEphemeris(ephemerisData.filter(e => e.id !== id));
    setShowEphemerisModal(false);
  };

  // Simple 2-person picker state for Guardias and Libre tabs
  const [showSimpleStaffModal, setShowSimpleStaffModal] = useState(false);
  const [simpleStaffMode, setSimpleStaffMode] = useState<'guardias' | 'libre'>('guardias');
  const [simpleStaffDate, setSimpleStaffDate] = useState('');
  const [simplePerson1, setSimplePerson1] = useState('');
  const [simplePerson2, setSimplePerson2] = useState('');

  const handleOpenSimpleStaffModal = (dateStr: string, mode: 'guardias' | 'libre') => {
    const sched = getDaySchedule(dateStr);
    const ids = mode === 'guardias' ? sched.guardIds : sched.offIds;
    setSimpleStaffDate(dateStr);
    setSimpleStaffMode(mode);
    setSimplePerson1(ids[0] || '');
    setSimplePerson2(ids[1] || '');
    setShowSimpleStaffModal(true);
  };

  const handleSaveSimpleStaff = () => {
    const ids = [simplePerson1, simplePerson2].filter(Boolean);
    const sched = getDaySchedule(simpleStaffDate);
    if (simpleStaffMode === 'guardias') {
      updateStaffSchedule(simpleStaffDate, { ...sched, guardIds: ids });
    } else {
      updateStaffSchedule(simpleStaffDate, { ...sched, offIds: ids });
    }
    setShowSimpleStaffModal(false);
  };


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



  // Staff management modal states
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaffDate, setSelectedStaffDate] = useState('');
  const [staffDayGuards, setStaffDayGuards] = useState<string[]>([]);
  const [staffDayVacations, setStaffDayVacations] = useState<string[]>([]);
  const [staffDayAbsents, setStaffDayAbsents] = useState<string[]>([]);
  const [staffDayOffs, setStaffDayOffs] = useState<string[]>([]);

  // Form states (new production)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newTime, setNewTime] = useState('10:00');
  const [newLoc, setNewLoc] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newAssigneeId2, setNewAssigneeId2] = useState('');
  const [newPrograms, setNewPrograms] = useState<ProgramType[]>([]);
  const [newFormats, setNewFormats] = useState<FormatType[]>([]);
  const [newStatus, setNewStatus] = useState<CalendarEvent['status']>('pending_confirmation');
  const [formFiles, setFormFiles] = useState<{ id: string; type: 'photo' | 'video' | 'audio' | 'document'; name: string; url: string; size: string; uploadDate: string; userId: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleNewProgram = (prog: ProgramType) => {
    setNewPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };
  const toggleNewFormat = (form: FormatType) => {
    setNewFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileUrl = event.target?.result as string;
        if (!fileUrl) return;
        let type: 'photo' | 'video' | 'audio' | 'document' = 'document';
        if (file.type.startsWith('image/')) type = 'photo';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        setFormFiles(prev => [...prev, {
          id: crypto.randomUUID(),
          name: file.name,
          type,
          url: fileUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadDate: new Date().toISOString(),
          userId: 'system'
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFileForm = (index: number) => {
    setFormFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAutocompleteConfirm = (data: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    interviewees: string[];
    contactInfo: string;
  }) => {
    setNewTitle(data.title);
    setNewLoc(data.location || '');
    
    let desc = data.description;
    if (data.interviewees.length > 0) {
      desc += `\n\nEntrevistados sugeridos: ${data.interviewees.join(', ')}`;
    }
    if (data.contactInfo && data.contactInfo !== 'No detectados') {
      desc += `\nContacto: ${data.contactInfo}`;
    }
    setNewDesc(desc);

    if (data.date) {
      setNewDate(data.date);
    }
    if (data.time) {
      setNewTime(data.time);
    } else {
      setNewTime('10:00');
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const startDateTime = `${newDate}T${newTime || '10:00'}`;
    addEvent(
      newTitle,
      newDesc,
      'coverage',
      startDateTime,
      startDateTime,
      newLoc ? newLoc : undefined,
      newAssigneeId ? newAssigneeId : undefined,
      newPrograms,
      newFormats,
      '',
      formFiles,
      newAssigneeId2 ? newAssigneeId2 : undefined
    );

    setNewTitle('');
    setNewDesc('');
    setNewLoc('');
    setNewAssigneeId('');
    setNewAssigneeId2('');
    setNewPrograms([]);
    setNewFormats([]);
    setFormFiles([]);
    setNewStatus('pending_confirmation');
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
    if (evt.coverageId) {
      navigateToCoverage(evt.coverageId);
    }
  };

  const navigateToCoverage = (coverageId: string) => {
    if (setSelectedCoverageId) {
      setSelectedCoverageId(coverageId);
    }
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
            <Plus size={16} /> Nueva Producción
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="card" style={{ padding: '1rem' }}>
        {/* Calendar Sub-View Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '1rem',
          gap: '0.1rem'
        }}>
          {([
            { key: 'producciones', label: '📅 Producciones' },
            { key: 'efemerides',   label: '🏛️ Efemérides' },
            { key: 'guardias',     label: '🛡️ Guardias' },
            { key: 'libre',        label: '🏖️ Libre' }
          ] as const).map(tab => {
            const isActive = calendarTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCalendarTab(tab.key)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  transition: 'var(--transition)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Program Filter — only for Producciones */}
        {calendarTab === 'producciones' && (
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
        )}
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
              {blankDays.map((_, idx) => (
                <div key={`blank-${idx}`} className="calendar-day-cell empty" style={{ height: '120px', backgroundColor: 'var(--bg-secondary)', opacity: 0.35 }}></div>
              ))}
              {daysArray.map(day => {
                const formattedDay = day < 10 ? `0${day}` : day;
                const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : (currentMonth + 1);
                const dayStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
                const todayObj = new Date();
                const isToday = todayObj.getDate() === day && todayObj.getMonth() === currentMonth && todayObj.getFullYear() === currentYear;
                const daySched = getDaySchedule(dayStr);

                // ── PRODUCCIONES tab ──
                if (calendarTab === 'producciones') {
                  const dayEvents = filteredEvents
                    .filter(e => e.start.startsWith(dayStr))
                    .sort((a, b) => (a.start.split('T')[1] || '').localeCompare(b.start.split('T')[1] || ''));
                  const MAX_VISIBLE = 3;
                  const visibleEvents = dayEvents.slice(0, MAX_VISIBLE);
                  const hiddenCount = dayEvents.length - MAX_VISIBLE;
                  return (
                    <div key={day} className={`calendar-day-cell ${isToday ? 'today' : ''}`} style={{ height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span className="calendar-day-num" style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => { setViewDate(new Date(currentYear, currentMonth, day)); setViewMode('day'); }} title="Ver día">{day}</span>
                        <button onClick={() => handleOpenStaffModal(dayStr)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--primary)', padding: '0.1rem' }} title="Personal"><Users size={11} /></button>
                      </div>
                      {daySched.guardIds.length > 0 && (
                        <div style={{ fontSize: '0.6rem', background: '#d1fae5', color: '#065f46', padding: '0.05rem 0.2rem', borderRadius: '2px', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🛡️ {daySched.guardIds.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).join(', ')}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, overflow: 'hidden' }}>
                        {visibleEvents.map(evt => (
                          <div key={evt.id} className={getEventClass(evt.type)}
                            onClick={(e) => { e.stopPropagation(); if (evt.coverageId) navigateToCoverage(evt.coverageId); else handleSelectEventForView(evt); }}
                            title={`${evt.title} (${getEventTypeName(evt.type)})`}
                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', display: 'block' }}
                          >
                            {evt.start.split('T')[1]?.substring(0,5)} {evt.title.replace(/^\[Cobertura\] /, '')}
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(currentYear, currentMonth, day)); setViewMode('day'); }}
                            style={{ fontSize: '0.6rem', color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: '2px', padding: '0.1rem 0.3rem', cursor: 'pointer', textAlign: 'left', fontWeight: 600, width: '100%' }}
                          >+{hiddenCount} más</button>
                        )}
                      </div>
                    </div>
                  );
                }

                // ── EFEMÉRIDES tab ──
                if (calendarTab === 'efemerides') {
                  const dayEphemerisList = getEphemerisByMonthDay(dayStr);
                  return (
                    <div key={day} className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                      style={{ height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                      onClick={() => handleOpenEphemerisModal(dayStr)}
                    >
                      <span className="calendar-day-num" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{day}</span>
                      {dayEphemerisList.map(ep => (
                        <div key={ep.id} style={{ fontSize: '0.65rem', background: '#fef9c3', color: '#713f12', padding: '0.1rem 0.3rem', borderRadius: '3px', marginBottom: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          🏛️ {ep.title}
                        </div>
                      ))}
                    </div>
                  );
                }

                // ── GUARDIAS tab ──
                if (calendarTab === 'guardias') {
                  const guardNames = daySched.guardIds.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).filter(Boolean);
                  return (
                    <div key={day} className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                      style={{ height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                      onClick={() => handleOpenSimpleStaffModal(dayStr, 'guardias')}
                    >
                      <span className="calendar-day-num" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{day}</span>
                      {guardNames.map((name, i) => (
                        <div key={i} style={{ fontSize: '0.65rem', background: '#d1fae5', color: '#065f46', padding: '0.1rem 0.3rem', borderRadius: '3px', marginBottom: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          🛡️ {name}
                        </div>
                      ))}
                    </div>
                  );
                }

                // ── LIBRE tab ──
                const freeNames = daySched.offIds.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).filter(Boolean);
                return (
                  <div key={day} className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                    style={{ height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => handleOpenSimpleStaffModal(dayStr, 'libre')}
                  >
                    <span className="calendar-day-num" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{day}</span>
                    {freeNames.map((name, i) => (
                      <div key={i} style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.3rem', borderRadius: '3px', marginBottom: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        🏖️ {name}
                      </div>
                    ))}
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
                         const prod = productions.find(p => p.id === evt.coverageId);
                         if (prod) {
                           if (prod.journalistId) assigneesList.push(prod.journalistId);
                           if (prod.photographerId) assigneesList.push(prod.photographerId);
                           if (prod.cameramanId) assigneesList.push(prod.cameramanId);
                         }
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Agenda Operativa: {formatDateDMY(selectedStaffDate)}</h3>
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
              <h3 className="modal-title">Nueva Producción</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="modal-body event-form-grid" style={{ padding: '1.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAutocompleteModal(true)}
                  style={{
                    gridColumn: 'span 3',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--primary)',
                    border: '1px dashed var(--primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    marginBottom: '0.5rem'
                  }}
                >
                  ✨ Autocompletar desde texto con IA
                </button>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Título *</label>
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
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ubicación</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Bº Pizzurno..."
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Hora</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Quién lo cubre</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <select 
                      className="form-select"
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <option value="">Seleccionar redactor 1...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <select 
                      className="form-select"
                      value={newAssigneeId2}
                      onChange={(e) => setNewAssigneeId2(e.target.value)}
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <option value="">Seleccionar redactor 2...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Descripción</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '80px' }}
                    placeholder="Detalles breves..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Programa</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {PROGRAM_OPTIONS.map(prog => {
                      const selected = newPrograms.includes(prog);
                      return (
                        <button
                          key={prog}
                          type="button"
                          className="btn"
                          onClick={() => toggleNewProgram(prog)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
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

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Formato</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {FORMAT_OPTIONS.map(form => {
                      const selected = newFormats.includes(form);
                      return (
                        <button
                          key={form}
                          type="button"
                          className="btn"
                          onClick={() => toggleNewFormat(form)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
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

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Estado</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {([
                      { value: 'pending_confirmation', label: 'Pendiente de confirmación' },
                      { value: 'confirmed', label: 'Confirmada' }
                    ] as const).map(opt => {
                      const selected = newStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className="btn"
                          onClick={() => setNewStatus(opt.value)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '999px',
                            border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border-color)'}`,
                            background: selected ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: selected ? '#fff' : 'var(--text-secondary)',
                            fontWeight: selected ? 700 : 500,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Archivos / Imágenes */}
                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Archivos / Imágenes</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      <Paperclip size={14} /> Seleccionar Archivos
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      multiple 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carga imágenes, PDFs o documentos.</span>
                  </div>
                  {formFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {formFiles.map((file, idx) => (
                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                          <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button type="button" onClick={() => removeFileForm(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Producción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAutocompleteModal && (
        <TextAutocompleteModal
          isOpen={showAutocompleteModal}
          onClose={() => setShowAutocompleteModal(false)}
          onConfirm={handleAutocompleteConfirm}
        />
      )}

      {/* EPHEMERIS MODAL */}
      {showEphemerisModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 120 }} onClick={() => setShowEphemerisModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '94%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🏛️ Efeméride – {formatDateDMY(ephemerisDate)}</h3>
              <button className="modal-close" onClick={() => setShowEphemerisModal(false)}>✕</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Título *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Día del Periodista..."
                  value={ephemerisTitle}
                  onChange={e => setEphemerisTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Descripción (opcional)</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px' }}
                  placeholder="Detalle o contexto de la efeméride..."
                  value={ephemerisDesc}
                  onChange={e => setEphemerisDesc(e.target.value)}
                />
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {editingEphemerisId && (
                  <button className="btn" style={{ color: 'var(--danger)', fontSize: '0.8rem' }} onClick={() => handleDeleteEphemeris(editingEphemerisId!)}>
                    Eliminar
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowEphemerisModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveEphemeris} disabled={!ephemerisTitle.trim()}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE STAFF PICKER MODAL (Guardias / Libre) */}
      {showSimpleStaffModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 120 }} onClick={() => setShowSimpleStaffModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '94%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {simpleStaffMode === 'guardias' ? '🛡️ Guardia' : '🏖️ Libre'} – {formatDateDMY(simpleStaffDate)}
              </h3>
              <button className="modal-close" onClick={() => setShowSimpleStaffModal(false)}>✕</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Persona 1</label>
                <select
                  className="form-select"
                  value={simplePerson1}
                  onChange={e => setSimplePerson1(e.target.value)}
                >
                  <option value="">— Sin asignar —</option>
                  {users.filter(u => u.id !== simplePerson2).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Persona 2</label>
                <select
                  className="form-select"
                  value={simplePerson2}
                  onChange={e => setSimplePerson2(e.target.value)}
                >
                  <option value="">— Sin asignar —</option>
                  {users.filter(u => u.id !== simplePerson1).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowSimpleStaffModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveSimpleStaff}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
