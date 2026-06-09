import React, { useState, useMemo } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Plus, Trash2, Edit3, ChevronLeft, ChevronRight, 
  Calendar as CalendarIcon, Save
} from 'lucide-react';
import { formatFriendlyDate } from '../utils/dateUtils';
import type { InstagramPost } from '../types';


// Custom Instagram SVG Icon for reliability across lucide-react versions
const Instagram = ({ size = 24, className = '', style = {} }: { size?: number, className?: string, style?: React.CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export const InstagramPlanner: React.FC = () => {
  const { 
    instagramPosts, addInstagramPost, updateInstagramPost, deleteInstagramPost, 
    users 
  } = useHub();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Create / Edit modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTime, setNewTime] = useState('10:00');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<InstagramPost['type']>('reel');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<InstagramPost['type']>('reel');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editStatus, setEditStatus] = useState<InstagramPost['status']>('idea');

  // Filter and sort posts based on viewMode
  const getPostsForDate = (dateStr: string) => {
    return instagramPosts
      .filter(p => p.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const datesToRender = useMemo(() => {
    const dates = [];
    const baseDate = new Date(selectedDate + 'T00:00:00');
    
    if (viewMode === 'day') {
      dates.push(selectedDate);
    } else if (viewMode === 'week') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        const pad = (n: number) => String(n).padStart(2, '0');
        dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      }
    } else if (viewMode === 'month') {
      for (let i = 0; i < 30; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        const pad = (n: number) => String(n).padStart(2, '0');
        dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      }
    }
    return dates;
  }, [selectedDate, viewMode]);

  const displayedPosts = useMemo(() => {
    return instagramPosts.filter((p: InstagramPost) => datesToRender.includes(p.date));
  }, [instagramPosts, datesToRender]);

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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addInstagramPost(selectedDate, newTime, newTitle, newType, newAssigneeId || undefined);
    
    // Reset Form
    setNewTitle('');
    setNewTime('10:00');
    setNewType('reel');
    setNewAssigneeId('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (post: InstagramPost) => {
    setSelectedPost(post);
    setEditTime(post.time);
    setEditTitle(post.title);
    setEditType(post.type);
    setEditAssigneeId(post.assigneeId || '');
    setEditStatus(post.status);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !editTitle.trim()) return;

    updateInstagramPost(selectedPost.id, {
      time: editTime,
      title: editTitle,
      type: editType,
      assigneeId: editAssigneeId || undefined,
      status: editStatus
    });

    setShowEditModal(false);
    setSelectedPost(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta publicación planificada?')) {
      deleteInstagramPost(id);
    }
  };

  // Badge configurations
  const typeLabels: Record<InstagramPost['type'], { label: string; icon: string; style: React.CSSProperties }> = {
    reel: { label: 'Reel', icon: '🎬', style: { backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' } },
    carousel: { label: 'Carrusel', icon: '📖', style: { backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' } },
    story: { label: 'Historia', icon: '⚡', style: { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' } },
    simple: { label: 'Post Simple', icon: '📷', style: { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' } }
  };

  const statusLabels: Record<InstagramPost['status'], { label: string; className: string }> = {
    idea: { label: 'Idea', className: 'status-pending' },
    in_production: { label: 'En Producción', className: 'status-in_coverage' },
    ready: { label: 'Listo', className: 'status-in_redaction' },
    scheduled: { label: 'Programado', className: 'status-ready_to_publish' },
    published: { label: 'Publicado', className: 'status-published' }
  };

  return (
    <div className="instagram-module">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Instagram size={24} style={{ color: '#db2777' }} />
            Planificador de Instagram
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Estrategia de contenidos en redes. Programa y audita publicaciones sin límite horario.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Planificar Publicación
        </button>
      </div>

      {/* Date Navigation Bar */}
      <div className="card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.75rem 1.5rem', 
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={handlePrevDay}>
            <ChevronLeft size={16} /> Anterior
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={handleNextDay}>
            Siguiente <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={16} color="var(--primary)" />
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '150px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setViewMode('day')}
          >
            Día
          </button>
          <button 
            className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
          <button 
            className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setViewMode('month')}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Timeline Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {datesToRender.map(dateStr => {
            const dayPosts = getPostsForDate(dateStr);
            if (viewMode !== 'day' && dayPosts.length === 0) return null;

            return (
              <div key={dateStr}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  ⏰ {formatFriendlyDate(dateStr + 'T00:00:00')} ({dayPosts.length} publicaciones)
                </h3>

                {dayPosts.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Instagram size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No hay publicaciones agendadas para esta fecha.</p>
                    <p style={{ fontSize: '0.8rem' }}>Haz clic en "Planificar Publicación" para armar la grilla.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                    {/* Vertical line connector */}
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      bottom: '15px',
                      left: '28px',
                      width: '2px',
                      backgroundColor: 'var(--border-color)',
                      zIndex: 1
                    }} />

                    {dayPosts.map((post) => {
                      const assignee = users.find(u => u.id === post.assigneeId);
                      const typeConfig = typeLabels[post.type];
                
                return (
                  <div 
                    key={post.id}
                    className="hover-card-bg"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      position: 'relative',
                      zIndex: 2,
                      transition: 'var(--transition)'
                    }}
                  >
                    {/* Time Indicator dot */}
                    <div style={{
                      backgroundColor: 'var(--primary-light)',
                      border: '2px solid var(--primary)',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      textAlign: 'center',
                      minWidth: '55px',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {post.time} hs
                    </div>

                    {/* Post type tag */}
                    <span 
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        ...typeConfig.style
                      }}
                    >
                      <span>{typeConfig.icon}</span>
                      <span>{typeConfig.label}</span>
                    </span>

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 700, 
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-primary)'
                      }}>
                        {post.title}
                      </h4>
                      {assignee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                          <div 
                            className="avatar-circle"
                            style={{ backgroundColor: assignee.avatarColor, width: '14px', height: '14px', fontSize: '0.5rem', margin: 0 }}
                          >
                            {assignee.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{assignee.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Status and actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span className={`badge ${statusLabels[post.status].className}`} style={{ fontSize: '0.7rem' }}>
                        {statusLabels[post.status].label}
                      </span>

                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem', borderRadius: '4px' }}
                          title="Editar"
                          onClick={() => handleOpenEdit(post)}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem', borderRadius: '4px', color: 'var(--danger)' }}
                          title="Eliminar"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Info & Helpers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ background: '#db277705', border: '1.5px dashed #db277730' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#db2777', marginBottom: '0.5rem' }}>
              <Instagram size={16} /> Estrategia de Redes
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Define el ritmo diario de publicaciones en Instagram. Planifica y reordena los contenidos de forma cronológica estableciendo horarios precisos sin restricciones de intervalos fijos.
            </p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Resumen de Estado
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              {Object.entries(statusLabels).map(([statusKey, cfg]) => {
                const count = displayedPosts.filter((p: InstagramPost) => p.status === statusKey).length;
                return (
                  <div key={statusKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${cfg.className}`} style={{ fontSize: '0.7rem', display: 'inline-block', minWidth: '95px', textAlign: 'center' }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Planificar Publicación de Instagram</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Título de la Publicación *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Galería de fotos choque Ruta 34 / Placa Informativa"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Hora *</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Publicación</label>
                    <select
                      className="form-select"
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                    >
                      <option value="reel">🎬 Reel</option>
                      <option value="carousel">📖 Carrusel</option>
                      <option value="story">⚡ Historia</option>
                      <option value="simple">📷 Publicación simple</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable de Redes</label>
                  <select
                    className="form-select"
                    value={newAssigneeId}
                    onChange={e => setNewAssigneeId(e.target.value)}
                  >
                    <option value="">Ninguno</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar a la Grilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Publicación de Instagram</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Título de la Publicación *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Hora *</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={editTime}
                      onChange={e => setEditTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Publicación</label>
                    <select
                      className="form-select"
                      value={editType}
                      onChange={e => setEditType(e.target.value as any)}
                    >
                      <option value="reel">🎬 Reel</option>
                      <option value="carousel">📖 Carrusel</option>
                      <option value="story">⚡ Historia</option>
                      <option value="simple">📷 Publicación simple</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Responsable de Redes</label>
                    <select
                      className="form-select"
                      value={editAssigneeId}
                      onChange={e => setEditAssigneeId(e.target.value)}
                    >
                      <option value="">Ninguno</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado de Producción</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as any)}
                    >
                      <option value="idea">Idea</option>
                      <option value="in_production">En Producción</option>
                      <option value="ready">Listo</option>
                      <option value="scheduled">Programado</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Save size={14} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
