import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { Plus, List, Kanban } from 'lucide-react';
import type { Coverage, ProgramType, FormatType } from '../data/mockData';

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
  const [newDescription, setNewDescription] = useState('');
  const [newDateTime, setNewDateTime] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [newLocation, setNewLocation] = useState('');

  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  
  const [newPrograms, setNewPrograms] = useState<ProgramType[]>([]);
  const [newFormats, setNewFormats] = useState<FormatType[]>([]);

  const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital'];
  const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

  useEffect(() => {
    if (autoOpenCreateModal) {
      setShowAddModal(true);
      if (setAutoOpenCreateModal) {
        setAutoOpenCreateModal(false);
      }
    }
  }, [autoOpenCreateModal, setAutoOpenCreateModal]);

  const toggleNewProgram = (prog: ProgramType) => {
    setNewPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };
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

    const createdId = addCoverage(
      newTitle,
      newDescription,
      newDateTime,
      newLocation,
      newAssignees,
      newPrograms,
      newFormats
    );

    setNewTitle('');
    setNewDescription('');
    setNewLocation('');
    setNewAssignees([]);
    setNewPrograms([]);
    setNewFormats([]);
    setShowAddModal(false);

    // Auto open details of new coverage
    setSelectedCoverageId(createdId);
    onViewDetail();
  };

  const handleAssigneeCheckboxChange = (userId: string) => {
    setNewAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Programar Nueva Cobertura</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCoverage}>
              <div className="modal-body">
                <div className="coverage-create-grid">
                  
                  {/* Left Column */}
                  <div className="coverage-create-col">
                    <div className="form-group">
                      <label className="form-label">Título de la Noticia / Cobertura</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej. Sesión en el Concejo Deliberante por el presupuesto."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descripción / Pauta</label>
                      <textarea
                        required
                        className="form-textarea"
                        rows={4}
                        placeholder="Detalles sobre lo que el móvil debe reportar..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-row-grid">
                      <div className="form-group">
                        <label className="form-label">Fecha y Hora</label>
                        <input
                          type="datetime-local"
                          required
                          className="form-input"
                          value={newDateTime}
                          onChange={(e) => setNewDateTime(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ubicación</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Ej. Bv. Santa Fe 300, Rafaela"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="coverage-create-col">
                    {/* Programs and Formats Selectors */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Programas Destino</label>
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

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Formatos de Cobertura</label>
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

                    <div className="form-group">
                      <label className="form-label">Asignar Equipo (Selecciona uno o más)</label>
                      <div className="assignee-select-grid" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                        {users.map(u => (
                          <label key={u.id} className="assignee-checkbox-label">
                            <input
                              type="checkbox"
                              checked={newAssignees.includes(u.id)}
                              onChange={() => handleAssigneeCheckboxChange(u.id)}
                            />
                            <span 
                              style={{ 
                                display: 'inline-block', 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                backgroundColor: u.avatarColor 
                              }}
                            />
                            <span>{u.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer">
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
