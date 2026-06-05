import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import type { CalendarEvent, ProgramType, FormatType } from '../data/mockData';

const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital'];
const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

export interface EventEditData {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  status: CalendarEvent['status'];
  assigneeId: string;
  programs: ProgramType[];
  formats: FormatType[];
}

interface EventEditModalProps {
  initialData: EventEditData;
  isCoverage?: boolean; // If true, it might just display different labels
  onSave: (data: EventEditData) => void;
  onClose: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  initialData,
  isCoverage = false,
  onSave,
  onClose
}) => {
  const { users } = useHub();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [start, setStart] = useState(initialData.start);
  const [end, setEnd] = useState(initialData.end);
  const [location, setLocation] = useState(initialData.location);
  const [status, setStatus] = useState<CalendarEvent['status']>(initialData.status);
  const [assigneeId, setAssigneeId] = useState(initialData.assigneeId);
  const [programs, setPrograms] = useState<ProgramType[]>(initialData.programs);
  const [formats, setFormats] = useState<FormatType[]>(initialData.formats);

  const toggleProgram = (prog: ProgramType) => {
    setPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };

  const toggleFormat = (fmt: FormatType) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      start,
      end,
      location,
      status,
      assigneeId,
      programs,
      formats
    });
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isCoverage ? 'Editar Planificación de Cobertura' : 'Editar Actividad Programada'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                type="text"
                required
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción / Pauta *</label>
              <textarea
                required
                className="form-textarea"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Inicio</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fin</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                >
                  <option value="pending_confirmation">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="in_redaction">En Redacción</option>
                  <option value="published">Publicada</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Responsable Principal</label>
              <select 
                className="form-select"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Programas Destino</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                {PROGRAM_OPTIONS.map(prog => {
                  const selected = programs.includes(prog);
                  return (
                    <button
                      key={prog}
                      type="button"
                      className="btn"
                      onClick={() => toggleProgram(prog)}
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

            <div className="form-group">
              <label className="form-label">Formatos Esperados</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                {FORMAT_OPTIONS.map(fmt => {
                  const selected = formats.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      className="btn"
                      onClick={() => toggleFormat(fmt)}
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
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};
