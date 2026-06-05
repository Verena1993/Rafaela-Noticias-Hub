import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { Plus, Clock, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const Tasks: React.FC = () => {
  const { tasks, users, currentUser, addTask, toggleTaskCompleted, coverages } = useHub();

  const [showAddModal, setShowAddModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'my' | 'all'>('my');
  const [statusTab, setStatusTab] = useState<'in_progress' | 'completed' | 'expired'>('in_progress');

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2); // default deadline +2h
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newCoverageId, setNewCoverageId] = useState('');

  const now = new Date('2026-06-04T08:30:00'); // Consistent local mock time

  // Open modal config
  const openModal = () => {
    setShowAddModal(true);
    setNewAssigneeId(currentUser?.id || '');
    if (coverages.length > 0) {
      setNewCoverageId(coverages[0].id);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAssigneeId) return;

    addTask(
      newTitle,
      newDueDate,
      newAssigneeId,
      newCoverageId ? newCoverageId : undefined
    );

    setNewTitle('');
    setNewCoverageId('');
    setShowAddModal(false);
  };

  // Filter logic
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'my') {
      return t.assigneeId === currentUser?.id;
    }
    return true;
  });

  const displayTasks = filteredTasks.filter(t => {
    const isExpired = new Date(t.dueDate).getTime() < now.getTime() && !t.completed;
    
    if (statusTab === 'completed') {
      return t.completed;
    }
    if (statusTab === 'expired') {
      return isExpired;
    }
    // 'in_progress' tab (not completed and not expired)
    return !t.completed && !isExpired;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Módulo de Tareas</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Asigna tareas de reporteo, fotografía o publicación para el equipo.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={16} /> Crear Tarea
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* User Scope Toggles */}
        <div style={{
          display: 'flex', 
          backgroundColor: 'var(--bg-tertiary)', 
          padding: '0.2rem', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <button 
            onClick={() => setTaskFilter('my')} 
            style={{
              background: taskFilter === 'my' ? 'var(--bg-primary)' : 'transparent',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: taskFilter === 'my' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Mis Tareas
          </button>
          <button 
            onClick={() => setTaskFilter('all')}
            style={{
              background: taskFilter === 'all' ? 'var(--bg-primary)' : 'transparent',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: taskFilter === 'all' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Todas las Tareas
          </button>
        </div>

        {/* Status Tab Row */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'in_progress', name: 'En Curso' },
            { id: 'completed', name: 'Completadas' },
            { id: 'expired', name: 'Vencidas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id as any)}
              style={{
                border: 'none',
                background: statusTab === tab.id ? 'var(--primary-light)' : 'transparent',
                color: statusTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {displayTasks.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay tareas en esta categoría.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayTasks.map((task) => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const coverage = coverages.find(c => c.id === task.coverageId);
              const isExpired = new Date(task.dueDate).getTime() < now.getTime() && !task.completed;

              return (
                <div 
                  key={task.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => toggleTaskCompleted(task.id)}
                      style={{ marginTop: '0.25rem', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                    
                    <div>
                      <h4 style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 700, 
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                      }}>
                        {task.title}
                      </h4>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> Vence: {new Date(task.dueDate).toLocaleDateString()} a las {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                          {isExpired && <span style={{ color: 'var(--danger)', fontWeight: 700, marginLeft: '4px' }}>(Vencida)</span>}
                        </span>

                        {coverage && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                            <FileText size={12} /> {coverage.title.substring(0, 30)}...
                          </span>
                        )}

                        {taskFilter === 'all' && assignee && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <User size={12} /> Asignado a: {assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {task.completed ? (
                      <CheckCircle2 size={20} color="var(--success)" />
                    ) : isExpired ? (
                      <AlertCircle size={20} color="var(--danger)" />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--info)', fontWeight: 600 }}>En curso</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Crear Nueva Tarea</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título de la Tarea</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Grabar testimonios de vecinos de la plaza."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-row-grid">
                  <div className="form-group">
                    <label className="form-label">Fecha y Hora Límite</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-input"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Asignar Responsable</label>
                    <select 
                      className="form-select"
                      required
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                    >
                      <option value="">Selecciona usuario...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Vincular a Cobertura (Opcional)</label>
                  <select 
                    className="form-select"
                    value={newCoverageId}
                    onChange={(e) => setNewCoverageId(e.target.value)}
                  >
                    <option value="">Ninguna - Tarea General de Redacción</option>
                    {coverages.map(cov => (
                      <option key={cov.id} value={cov.id}>{cov.title.substring(0, 60)}...</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Asignar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
