import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { Plus, List, Kanban } from 'lucide-react';
import type { Coverage, FormatType } from '../types';


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
  const { coverages, users, addCoverage, searchQuery } = useHub();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
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
  const [newStatus, setNewStatus] = useState<Coverage['status']>('pending_confirmation');
  const [newMainResponsable, setNewMainResponsable] = useState('');
  const [newAssignees, setNewAssignees] = useState<string[]>([]); // Team members
  const [newFormats, setNewFormats] = useState<FormatType[]>([]);
  const [newLogisticsInfo, setNewLogisticsInfo] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');
  const FORMAT_OPTIONS: FormatType[] = ['TV', 'Radio', 'Web', 'Redes', 'Multiplataforma'];

  const addAttachment = () => {
    if (attachmentInput.trim()) {
      setNewAttachments(prev => [...prev, attachmentInput.trim()]);
      setAttachmentInput('');
    }
  };

  useEffect(() => {
    if (autoOpenCreateModal) {
      setShowAddModal(true);
      if (setAutoOpenCreateModal) {
        setAutoOpenCreateModal(false);
      }
    }
  }, [autoOpenCreateModal, setAutoOpenCreateModal]);

  const toggleNewFormat = (form: FormatType) => {
    setNewFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };

  // Filter states
  const [filterAssignee, setFilterAssignee] = useState('all');

  const columns: { id: Coverage['status']; name: string; count: number }[] = [
    { id: 'pending_confirmation', name: 'Pendiente de confirmación', count: 0 },
    { id: 'confirmed', name: 'Confirmada', count: 0 },
    { id: 'in_redaction', name: 'En Redacción', count: 0 },
    { id: 'published', name: 'Publicada', count: 0 }
  ];

  // Filtering
  const filteredCoverages = coverages.filter(cov => {
    const matchesSearch = searchQuery
      ? cov.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        cov.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cov.location.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesAssignee = filterAssignee === 'all' || cov.assignees.includes(filterAssignee);

    return matchesSearch && matchesAssignee;
  });

  // Calculate card counts per column
  columns.forEach(col => {
    col.count = filteredCoverages.filter(c => c.status === col.id).length;
  });

  const handleCreateCoverage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const finalAssignees: string[] = [];
    if (newMainResponsable) {
      finalAssignees.push(newMainResponsable);
    }
    newAssignees.forEach(uid => {
      if (!finalAssignees.includes(uid)) {
        finalAssignees.push(uid);
      }
    });

    const combinedDateTime = `${newDate}T${newTime}`;

    const createdId = addCoverage(
      newTitle,
      newObservations || newTitle,
      combinedDateTime,
      newLocation,
      finalAssignees,
      [],
      newFormats,
      newStatus,
      newLogisticsInfo,
      newObservations,
      newAttachments
    );

    setNewTitle('');
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
    setNewStatus('pending_confirmation');
    setNewMainResponsable('');
    setNewAssignees([]);
    setNewFormats([]);
    setNewLogisticsInfo('');
    setNewObservations('');
    setNewAttachments([]);
    setAttachmentInput('');
    setShowAddModal(false);

    // Auto open details of new coverage
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
          <h2 className="page-title">Módulo de Coberturas</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Planifica e instrumenta coberturas en vivo para la mesa editorial.
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
            <Plus size={16} /> Nueva Cobertura
          </button>
        </div>
      </div>

      {/* Advanced Filter Row */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ fontSize: '0.8', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Filtrar por:
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Asignado</span>
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
            const colCoverages = filteredCoverages.filter(c => c.status === col.id);
            return (
              <div key={col.id} className="board-column">
                <div className="column-header">
                  <span>{col.name}</span>
                  <span className="column-count">{col.count}</span>
                </div>
                <div className="column-cards">
                  {colCoverages.map(cov => (
                    <div 
                      key={cov.id} 
                      className="board-card" 
                      onClick={() => handleCardClick(cov.id)}
                    >
                      <h4 className="card-title">{cov.title}</h4>
                      
                      {/* Program/Format tags on Kanban Card */}
                      {((cov.programs && cov.programs.length > 0) || (cov.formats && cov.formats.length > 0)) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.4rem' }}>
                          {cov.programs?.map((prog, idx) => (
                            <span key={idx} style={{ fontSize: '0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                              📻 {prog}
                            </span>
                          ))}
                          {cov.formats?.map((form, idx) => (
                            <span key={idx} style={{ fontSize: '0.6rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                              ⚙️ {form}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>📍 {cov.location.length > 25 ? `${cov.location.substring(0, 25)}...` : cov.location}</span>
                        <span>🕒 {new Date(cov.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</span>
                      </div>
                      <div className="card-meta">
                        <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          {cov.comments.length > 0 && <span>💬 {cov.comments.length}</span>}
                          {cov.sharedLinks.length > 0 && <span>🔗 {cov.sharedLinks.length}</span>}
                        </div>
                        <div className="card-assignees">
                          {cov.assignees.map(uid => {
                            const u = users.find(usr => usr.id === uid);
                            return (
                              <div 
                                key={uid} 
                                className="avatar-circle" 
                                style={{ backgroundColor: u?.avatarColor }}
                                title={u?.name}
                              >
                                {u?.name.charAt(0)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colCoverages.length === 0 && (
                    <div style={{ 
                      padding: '2rem 1rem', 
                      textAlign: 'center', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-muted)', 
                      border: '1.5px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      Sin coberturas
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
              {filteredCoverages.map(cov => (
                <tr 
                  key={cov.id} 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => handleCardClick(cov.id)}
                  className="table-row-hover"
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    <div>{cov.title}</div>
                    {/* Program/Format tags in table cell */}
                    {((cov.programs && cov.programs.length > 0) || (cov.formats && cov.formats.length > 0)) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.25rem' }}>
                        {cov.programs?.map((prog, idx) => (
                          <span key={idx} style={{ fontSize: '0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                            📻 {prog}
                          </span>
                        ))}
                        {cov.formats?.map((form, idx) => (
                          <span key={idx} style={{ fontSize: '0.6rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.05rem 0.2rem', borderRadius: '4px', fontWeight: 600 }}>
                            ⚙️ {form}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge status-${cov.status}`}>{cov.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{cov.location}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="card-assignees">
                      {cov.assignees.map(uid => {
                        const u = users.find(usr => usr.id === uid);
                        return (
                          <div 
                            key={uid} 
                            className="avatar-circle" 
                            style={{ backgroundColor: u?.avatarColor }}
                            title={u?.name}
                          >
                            {u?.name.charAt(0)}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCoverages.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron coberturas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Coverage Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '950px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Programar Nueva Cobertura</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCoverage}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="coverage-create-grid">
                  
                  {/* Left Column - Core Data */}
                  <div className="coverage-create-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Título de la Cobertura *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej. Sesión en el Concejo Deliberante por el presupuesto."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fecha *</label>
                        <input
                          type="date"
                          required
                          className="form-input"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hora *</label>
                        <input
                          type="time"
                          required
                          className="form-input"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ubicación *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej. Bv. Santa Fe 300, Rafaela"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estado *</label>
                      <select
                        className="form-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        style={{ padding: '0.5rem', fontWeight: 600 }}
                      >
                        <option value="pending_confirmation">Pendiente de confirmación</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="in_redaction">En Redacción</option>
                        <option value="published">Publicada</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Formato</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                        {FORMAT_OPTIONS.map(form => {
                          const isSelected = newFormats.includes(form);
                          return (
                            <button
                              key={form}
                              type="button"
                              className="btn"
                              onClick={() => toggleNewFormat(form)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                background: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                              }}
                            >
                              {form}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Team & Logistics */}
                  <div className="coverage-create-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Responsable Principal *</label>
                      <select
                        className="form-select"
                        required
                        value={newMainResponsable}
                        onChange={e => setNewMainResponsable(e.target.value)}
                      >
                        <option value="">Seleccionar responsable...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Equipo Asignado</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        {newAssignees.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Ningún integrante asignado al equipo</span>
                        ) : (
                          newAssignees.map(uid => {
                            const u = users.find(usr => usr.id === uid);
                            if (!u) return null;
                            return (
                              <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: u.avatarColor }} />
                                <span>{u.name.split(' ')[0]}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setNewAssignees(prev => prev.filter(id => id !== uid))} 
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0 0.1rem' }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <select
                        className="form-select"
                        value=""
                        onChange={e => {
                          const uid = e.target.value;
                          if (uid && !newAssignees.includes(uid)) {
                            setNewAssignees(prev => [...prev, uid]);
                          }
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                      >
                        <option value="">+ Agregar integrante...</option>
                        {users
                          .filter(u => u.id !== newMainResponsable && !newAssignees.includes(u.id))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Información Logística</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Direcciones secundarias, accesos, teléfonos de contacto, transporte..."
                        value={newLogisticsInfo}
                        onChange={(e) => setNewLogisticsInfo(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Observaciones</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Comentarios adicionales, enfoques sugeridos..."
                        value={newObservations}
                        onChange={(e) => setNewObservations(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Adjuntos (Enlaces / Archivos)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.4rem' }}>
                        {newAttachments.map((att, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', color: 'var(--text-secondary)' }}>📎 {att}</span>
                            <button 
                              type="button" 
                              onClick={() => setNewAttachments(prev => prev.filter((_, i) => i !== idx))} 
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.8rem' }}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej: https://drive.google.com/... o gacetilla.pdf" 
                          style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          value={attachmentInput}
                          onChange={e => setAttachmentInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addAttachment();
                            }
                          }}
                        />
                        <button type="button" onClick={addAttachment} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Cobertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
