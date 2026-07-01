import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import type { CalendarEvent, ProgramType, FormatType } from '../types';


import { Paperclip, Trash2 } from 'lucide-react';

const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital', 'Comercial'];
const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

export interface EventEditData {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  status: CalendarEvent['status'];
  assigneeId: string;
  assigneeId2: string;
  programs: ProgramType[];
  formats: FormatType[];
  observations?: string;
  multimedia?: any[];
}

interface EventEditModalProps {
  initialData: EventEditData;
  isCoverage?: boolean; // If true, it might just display different labels
  onSave: (data: EventEditData) => void;
  onClose: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  initialData,
  isCoverage: _isCoverage = false,
  onSave,
  onClose
}) => {
  const { users } = useHub();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [date, setDate] = useState(() => initialData.start ? initialData.start.split('T')[0] : '');
  const [time, setTime] = useState(() => initialData.start ? initialData.start.split('T')[1] || '10:00' : '10:00');
  const [location, setLocation] = useState(initialData.location);
  const [status, setStatus] = useState<CalendarEvent['status']>(initialData.status);
  const [assigneeId, setAssigneeId] = useState(initialData.assigneeId);
  const [assigneeId2, setAssigneeId2] = useState(initialData.assigneeId2 || '');
  const [programs, setPrograms] = useState<ProgramType[]>(initialData.programs);
  const [formats, setFormats] = useState<FormatType[]>(initialData.formats);
  const [formFiles, setFormFiles] = useState<any[]>(initialData.multimedia || []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleProgram = (prog: ProgramType) => {
    setPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };

  const toggleFormat = (fmt: FormatType) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = `${date}T${time || '10:00'}`;
    onSave({
      title,
      description,
      start: startDateTime,
      end: startDateTime,
      location,
      status,
      assigneeId,
      assigneeId2,
      programs,
      formats,
      observations: '',
      multimedia: formFiles
    });
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={onClose}>
      <div className="modal-content event-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Editar Producción</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body event-form-grid" style={{ padding: '1.5rem' }}>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Título *</label>
              <input
                type="text"
                required
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 1' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ubicación</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 1' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha *</label>
              <input
                type="date"
                required
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 1' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Hora *</label>
              <input
                type="time"
                required
                className="form-input"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 1' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Quién lo cubre</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <select 
                  className="form-select"
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                >
                  <option value="">Sin asignar 1...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <select 
                  className="form-select"
                  value={assigneeId2}
                  onChange={e => setAssigneeId2(e.target.value)}
                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                >
                  <option value="">Sin asignar 2...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Descripción *</label>
              <textarea
                required
                className="form-textarea"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Programa</label>
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

            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Formato</label>
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

            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Estado</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {([
                  { value: 'pending_confirmation', label: 'Pendiente de confirmación' },
                  { value: 'confirmed', label: 'Confirmada' }
                ] as const).map(opt => {
                  const selected = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className="btn"
                      onClick={() => setStatus(opt.value)}
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
                    <div key={file.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                      <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button type="button" onClick={() => removeFileForm(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};
