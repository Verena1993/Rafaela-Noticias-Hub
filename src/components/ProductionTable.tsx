import React, { useState, useMemo } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Calendar, User, Clock,
  Edit3, Table, ChevronLeft, ChevronRight, Search, Filter
} from 'lucide-react';
import { formatFriendlyDate } from '../utils/dateUtils';
import type { CalendarEvent } from '../data/mockData';
import { EventEditModal } from './EventEditModal';
import type { EventEditData } from './EventEditModal';

export const ProductionTable: React.FC = () => {
  const { events, users, coverages } = useHub();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Bugfix: Estado para el modal de edición
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { updateEvent } = useHub();

  const handleEditClick = (evt: CalendarEvent) => {
    setEditingEvent(evt);
  };

  const handleSaveEdit = (data: EventEditData) => {
    if (!editingEvent) return;
    updateEvent(
      editingEvent.id,
      data.title,
      data.description,
      editingEvent.type,
      data.start,
      data.end,
      data.location,
      data.status,
      data.assigneeId || undefined,
      data.programs,
      data.formats
    );
    setEditingEvent(null);
  };

  // Day browsing helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter(evt => evt.start.startsWith(selectedDate))
      .filter(evt => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          evt.title.toLowerCase().includes(q) || 
          (evt.description || '').toLowerCase().includes(q) ||
          (evt.location || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const timeA = a.start.split('T')[1] || '';
        const timeB = b.start.split('T')[1] || '';
        return timeA.localeCompare(timeB);
      });
  }, [events, selectedDate, searchQuery]);

  const eventStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    in_coverage: 'En Cobertura',
    finished: 'Finalizada',
    suspended: 'Suspendida',
    pending_confirmation: 'Por Confirmar',
    in_redaction: 'En Redacción',
    ready_to_publish: 'Lista',
    published: 'Publicada'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={24} style={{ color: 'var(--primary)' }} />
            Planilla de Producción
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Planificación detallada de notas, actividades y recursos para todos los programas.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handlePrevDay} style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronLeft size={18} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', minWidth: '180px', justifyContent: 'center' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            {formatFriendlyDate(selectedDate)}
          </div>
          
          <button className="btn btn-secondary" onClick={handleNextDay} style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '400px' }}>
          <div className="search-bar" style={{ flex: 1, margin: 0 }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar actividad o tema..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <Filter size={16} /> Filtros
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Horario</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Programa</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', width: '20%' }}>Nota / Actividad</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', width: '20%' }}>Tema / Zócalo</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Formato</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Responsable</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Info Extra</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay actividades registradas en la planilla para esta fecha.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(evt => {
                  const timeStart = evt.start.split('T')[1]?.substring(0, 5) || '--:--';
                  
                  // Get assignees list
                  let assigneesList: string[] = [];
                  if (evt.coverageId) {
                     const cov = coverages.find(c => c.id === evt.coverageId);
                     if (cov) assigneesList = cov.assignees;
                  } else if (evt.assigneeId) {
                     assigneesList = [evt.assigneeId];
                  }
                  const assigneeNames = assigneesList.map(uid => users.find(u => u.id === uid)?.name.split(' ')[0]).filter(Boolean).join(', ');

                  return (
                    <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="hover-card-bg">
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '0.2rem', color: 'var(--text-muted)' }} />
                        {timeStart}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {(evt.programs || []).map((prog, idx) => (
                            <span key={idx} style={{ display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                              {prog}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {evt.title.replace(/^\[Cobertura\] /, '')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {evt.description ? (
                          <span title={evt.description} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {evt.description}
                          </span>
                        ) : <span style={{ color: 'var(--border-color)' }}>-</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge event-${evt.type}`} style={{ backgroundColor: evt.status === 'published' ? '#dcfce7' : undefined, color: evt.status === 'published' ? '#166534' : undefined }}>
                          {eventStatusLabels[evt.status || 'pending'] || 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {(evt.formats || []).map((form, idx) => (
                            <span key={idx} style={{ display: 'inline-block', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                              {form}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {assigneeNames ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                            <User size={12} style={{ color: 'var(--text-muted)' }} />
                            {assigneeNames}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {evt.location ? `📍 ${evt.location}` : <span style={{ color: 'var(--border-color)' }}>-</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem' }} title="Editar Actividad" onClick={() => handleEditClick(evt)}>
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición de Actividad */}
      {editingEvent && (
        <EventEditModal
          initialData={{
            title: editingEvent.title,
            description: editingEvent.description || '',
            start: editingEvent.start,
            end: editingEvent.end,
            location: editingEvent.location || '',
            status: editingEvent.status,
            assigneeId: editingEvent.assigneeId || '',
            programs: editingEvent.programs || [],
            formats: editingEvent.formats || []
          }}
          onSave={handleSaveEdit}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};
