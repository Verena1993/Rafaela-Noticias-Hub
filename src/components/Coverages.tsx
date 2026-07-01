import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { Plus, List, Kanban, Paperclip, Trash2 } from 'lucide-react';
import type { ProgramType, FormatType } from '../types';
import { formatDateDMY } from '../utils/dateUtils';

const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital', 'Comercial'];
const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];
import type { ProductionStatus } from '../types';
import { TextAutocompleteModal } from './TextAutocompleteModal';

interface CoveragesProps {
  setSelectedCoverageId: (id: string | null) => void;
  onViewDetail: () => void;
  autoOpenCreateModal?: boolean;
  setAutoOpenCreateModal?: (open: boolean) => void;
}

export const Coverages: React.FC<CoveragesProps> = ({ 
  setSelectedCoverageId, 
  onViewDetail,
  autoOpenCreateModal,
  setAutoOpenCreateModal
}) => {
  const { productions, users, addProduction, searchQuery, categories } = useHub();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutocompleteModal, setShowAutocompleteModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [newTime, setNewTime] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState<ProductionStatus>('pendiente_planificacion');
  const [newJournalistId, setNewJournalistId] = useState('');
  const [newJournalistId2, setNewJournalistId2] = useState('');
  const [newPrograms, setNewPrograms] = useState<ProgramType[]>([]);
  const [newFormats, setNewFormats] = useState<FormatType[]>([]);
  const [formFiles, setFormFiles] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (data.date) setNewDate(data.date);
    if (data.time) setNewTime(data.time);
    setNewLocation(data.location || '');
    
    let obs = data.description;
    if (data.interviewees.length > 0) {
      obs += `\n\nEntrevistados sugeridos: ${data.interviewees.join(', ')}`;
    }
    if (data.contactInfo && data.contactInfo !== 'No detectados') {
      obs += `\nContacto: ${data.contactInfo}`;
    }
    setNewDesc(obs);
  };



  useEffect(() => {
    if (autoOpenCreateModal) {
      setShowAddModal(true);
      if (setAutoOpenCreateModal) {
        setAutoOpenCreateModal(false);
      }
    }
  }, [autoOpenCreateModal, setAutoOpenCreateModal]);

  // Filter states
  const [filterAssignee, setFilterAssignee] = useState('all');

  const columns: { id: ProductionStatus; name: string; count: number }[] = [
    { id: 'pendiente_planificacion', name: 'Pendiente de Planificación', count: 0 },
    { id: 'programada', name: 'Programada', count: 0 },
    { id: 'finalizada', name: 'Finalizada', count: 0 },
    { id: 'suspendida', name: 'Suspendida', count: 0 }
  ];

  // Filtering
  const filteredProductions = productions.filter(prod => {
    const matchesSearch = searchQuery
      ? prod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (prod.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.location || '').toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesAssignee = filterAssignee === 'all' || 
      prod.journalistId === filterAssignee ||
      prod.photographerId === filterAssignee ||
      prod.cameramanId === filterAssignee;

    return matchesSearch && matchesAssignee;
  });

  // Calculate card counts per column
  columns.forEach(col => {
    col.count = filteredProductions.filter(p => p.status === col.id).length;
  });

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const titleToSave = newTitle.trim() || 'Producción sin título';

    const finalDate = newDate || undefined;
    const finalTime = newTime || undefined;

    const createdId = await addProduction(
      titleToSave,
      undefined, // proposalId
      newDesc || titleToSave, // description
      undefined, // categoryId (removed!)
      newJournalistId || undefined,
      newJournalistId2 || undefined, // photographerId mapped to second assignee
      undefined, // cameramanId (removed!)
      newPrograms, // mediaOutlets
      undefined, // formatId
      'medium', // priority
      finalDate,
      finalTime,
      newLocation,
      '', // observations (removed!)
      formFiles
    );

    setNewTitle('');
    setNewDesc('');
    setNewDate(() => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    });
    setNewTime(() => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
    setNewLocation('');
    setNewStatus('pendiente_planificacion');
    setNewJournalistId('');
    setNewJournalistId2('');
    setNewPrograms([]);
    setNewFormats([]);
    setFormFiles([]);
    setShowAddModal(false);

    // Auto open details of new production
    setSelectedCoverageId(createdId);
    onViewDetail();
  };

  const handleCardClick = (id: string) => {
    setSelectedCoverageId(id);
    onViewDetail();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Tablero de Producción</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Planifica e instrumenta producciones en vivo para la mesa editorial.
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
            <button 
              onClick={() => setViewMode('board')} 
              style={{
                background: viewMode === 'board' ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: viewMode === 'board' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Kanban size={14} /> Tablero
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <List size={14} /> Lista
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Nueva Producción
          </button>
        </div>
      </div>

      {/* Advanced Filter Row */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Filtrar por:
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Asignado (Cualquier Rol)</span>
          <select 
            className="form-select" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="all">Todos</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Render Mode */}
      {viewMode === 'board' ? (
        <div className="board-container">
          {columns.map(col => {
            const colProductions = filteredProductions.filter(c => c.status === col.id);
            return (
              <div key={col.id} className="board-column">
                <div className="column-header">
                  <span>{col.name}</span>
                  <span className="column-count">{col.count}</span>
                </div>
                <div className="column-cards">
                  {colProductions.map(prod => {
                    const cat = categories.find(c => c.id === prod.categoryId);
                    const activeAssignees = [
                      { id: prod.journalistId, role: 'Periodista' },
                      { id: prod.photographerId, role: 'Fotógrafo' },
                      { id: prod.cameramanId, role: 'Camarógrafo' }
                    ].filter(x => x.id);

                    return (
                      <div 
                        key={prod.id} 
                        className="board-card" 
                        onClick={() => handleCardClick(prod.id)}
                      >
                        <h4 className="card-title">{prod.title}</h4>
                        
                        {/* Program/Category tags on Kanban Card */}
                        {((prod.mediaOutlets && prod.mediaOutlets.length > 0) || cat) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.4rem' }}>
                            {cat && (
                              <span style={{ fontSize: '0.6rem', backgroundColor: `${cat.color}15`, color: cat.color, padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                                📁 {cat.name}
                              </span>
                            )}
                            {prod.mediaOutlets?.map((prog, idx) => (
                              <span key={idx} style={{ fontSize: '0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                                📺 {prog}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>📍 {prod.location && prod.location.length > 25 ? `${prod.location.substring(0, 25)}...` : prod.location || 'Sin ubicación'}</span>
                          <span>🕒 {prod.productionDate ? `${formatDateDMY(prod.productionDate)} ${prod.productionTime || '00:00'}` : 'Sin fecha'}</span>
                        </div>
                        <div className="card-meta">
                          <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-muted)' }}>
                            {prod.multimedia && prod.multimedia.length > 0 && <span>🖼️ {prod.multimedia.length}</span>}
                            {prod.sharedLinks && prod.sharedLinks.length > 0 && <span>🔗 {prod.sharedLinks.length}</span>}
                          </div>
                          <div className="card-assignees">
                            {activeAssignees.map(item => {
                              const u = users.find(usr => usr.id === item.id);
                              if (!u) return null;
                              return (
                                <div 
                                  key={item.id} 
                                  className="avatar-circle" 
                                  style={{ backgroundColor: u.avatarColor }}
                                  title={`${u.name} (${item.role})`}
                                >
                                  {u.name.charAt(0)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colProductions.length === 0 && (
                    <div style={{ 
                      padding: '2rem 1rem', 
                      textAlign: 'center', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-muted)', 
                      border: '1.5px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      Sin producciones
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Título</th>
                <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ubicación</th>
                <th style={{ padding: '0.75rem 1rem' }}>Asignados</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductions.map(prod => {
                const cat = categories.find(c => c.id === prod.categoryId);
                const activeAssignees = [
                  { id: prod.journalistId, role: 'Periodista' },
                  { id: prod.photographerId, role: 'Fotógrafo' },
                  { id: prod.cameramanId, role: 'Camarógrafo' }
                ].filter(x => x.id);

                return (
                  <tr 
                    key={prod.id} 
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition)' }}
                    onClick={() => handleCardClick(prod.id)}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      <div>{prod.title}</div>
                      {/* Tags in table cell */}
                      {((prod.mediaOutlets && prod.mediaOutlets.length > 0) || cat) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.25rem' }}>
                          {cat && (
                            <span style={{ fontSize: '0.6rem', backgroundColor: `${cat.color}15`, color: cat.color, padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                              📁 {cat.name}
                            </span>
                          )}
                          {prod.mediaOutlets?.map((prog, idx) => (
                            <span key={idx} style={{ fontSize: '0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                              📺 {prog}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge status-${prod.status}`}>{prod.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{prod.location || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div className="card-assignees">
                        {activeAssignees.map(item => {
                          const u = users.find(usr => usr.id === item.id);
                          if (!u) return null;
                          return (
                            <div 
                              key={item.id} 
                              className="avatar-circle" 
                              style={{ backgroundColor: u.avatarColor }}
                              title={`${u.name} (${item.role})`}
                            >
                              {u.name.charAt(0)}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProductions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron producciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Production Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowAddModal(false)}>
          <div className="modal-content event-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Programar Nueva Producción</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduction}>
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
                    placeholder="Ej. Sesión en el Concejo Deliberante..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ubicación</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Bv. Santa Fe 300..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Hora *</label>
                  <input
                    type="time"
                    required
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
                      value={newJournalistId}
                      onChange={(e) => setNewJournalistId(e.target.value)}
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <option value="">Seleccionar redactor 1...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <select 
                      className="form-select"
                      value={newJournalistId2}
                      onChange={(e) => setNewJournalistId2(e.target.value)}
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
                    placeholder="Detalles breves de la cobertura..."
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
                          onClick={() => {
                            setNewPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
                          }}
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
                          onClick={() => {
                            setNewFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
                          }}
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
                      { value: 'pendiente_planificacion', label: 'Pendiente de confirmación' },
                      { value: 'programada', label: 'Confirmada' }
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
    </div>
  );
};
