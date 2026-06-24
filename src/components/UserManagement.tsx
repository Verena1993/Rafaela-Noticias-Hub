import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { UserPlus, Edit2, Shield, UserCheck, UserX, Mail, Key, Trash2 } from 'lucide-react';
import type { User } from '../types';

export const UserManagement: React.FC = () => {
  const { users, createHubUser, updateHubUser, currentUser, deleteHubUser } = useHub();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete Form State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteError('');
    setDeleteSuccess('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError('');
    setDeleteSuccess('');
    try {
      await deleteHubUser(userToDelete.id);
      setDeleteSuccess('Usuario eliminado con éxito.');
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        setDeleteSuccess('');
      }, 1500);
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar el usuario.');
    } finally {
      setDeleting(false);
    }
  };

  // Creation Form State
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('password123');
  const [createRole, setCreateRole] = useState<'admin' | 'editor'>('editor');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'editor'>('editor');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Check if a user is a real database user (UUID vs mock 'u1')
  const isDbUser = (user: User) => {
    return user.id.includes('-') || !user.id.startsWith('u');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await createHubUser(createName, createEmail, createPassword, createRole);
      setShowCreateModal(false);
      // Reset form
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('password123');
      setCreateRole('editor');
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear el usuario. Inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role as 'admin' | 'editor');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');
    setUpdating(true);
    try {
      await updateHubUser(selectedUser.id, {
        name: editName,
        role: editRole
      });
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar el usuario.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const nextActive = !(user.activo ?? true);
    try {
      await updateHubUser(user.id, { activo: nextActive });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado del usuario.');
    }
  };

  const dbUsersList = users.filter(isDbUser);
  const mockUsersList = users.filter(u => !isDbUser(u));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={22} style={{ color: 'var(--primary)' }} />
            Gestión de Usuarios
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Administración de accesos de la redacción, control de roles e inicio de sesión con Supabase Auth.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <UserPlus size={16} />
          Registrar Usuario
        </button>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Usuarios Base de Datos
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {dbUsersList.length}
          </span>
        </div>
        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Activos
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {dbUsersList.filter(u => u.activo !== false).length}
          </span>
        </div>
        <div className="card" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Suspendidos
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)' }}>
            {dbUsersList.filter(u => u.activo === false).length}
          </span>
        </div>
      </div>

      {/* Database Users Section */}
      <div className="card">
        <h3 className="section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          Usuarios del Sistema (Supabase Auth)
        </h3>
        
        {dbUsersList.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
            No hay usuarios registrados en Supabase aún. ¡Haz clic en "Registrar Usuario" para agregar el primero!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Nombre</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Rol</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Último Acceso</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Fecha Creación</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dbUsersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px',
                        backgroundColor: u.role === 'admin' ? '#fee2e2' : '#e0f2fe',
                        color: u.role === 'admin' ? '#b91c1c' : '#0369a1',
                        textTransform: 'uppercase'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${u.activo !== false ? 'status-published' : 'priority-high'}`} style={{ fontSize: '0.7rem' }}>
                        {u.activo !== false ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleEditClick(u)}
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                        <button 
                          className={`btn ${u.activo !== false ? 'btn-secondary' : 'btn-primary'}`} 
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            fontSize: '0.75rem',
                            backgroundColor: u.activo !== false ? '#fee2e2' : 'var(--success)',
                            color: u.activo !== false ? '#b91c1c' : 'white',
                            borderColor: 'transparent'
                          }}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.activo !== false ? <><UserX size={12} /> Suspender</> : <><UserCheck size={12} /> Activar</>}
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button 
                            className="btn" 
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              fontSize: '0.75rem',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              borderColor: 'transparent'
                            }}
                            onClick={() => handleDeleteClick(u)}
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mock Users Section (Information Only) */}
      <div className="card">
        <h3 className="section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Usuarios de Prueba (Mocks - Locales)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Estos usuarios están configurados localmente en la redacción y son de solo lectura. Se migrarán a Supabase Auth en la Fase 2.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', opacity: 0.75 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Nombre</th>
                <th style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Rol Mock</th>
                <th style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Último Acceso</th>
                <th style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              {mockUsersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem 1rem' }}>{u.name}</td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '0.5rem 1rem' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '4px',
                      backgroundColor: u.role === 'admin' ? '#fee2e2' : '#e0f2fe',
                      color: u.role === 'admin' ? '#b91c1c' : '#0369a1',
                      textTransform: 'uppercase'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 1rem' }}>
                    <span className="badge status-published" style={{ fontSize: '0.65rem', padding: '0.05rem 0.25rem' }}>
                      Activo
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {createError && (
                  <div style={{
                    backgroundColor: 'var(--danger-light)', color: 'var(--danger-text)',
                    padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 500
                  }}>
                    {createError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Ej. Juan Pérez"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={14} /> Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    placeholder="correo@rafaelanoticias.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Key size={14} /> Contraseña Inicial
                  </label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol en el Hub</label>
                  <select 
                    className="form-select"
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as any)}
                  >
                    <option value="editor">Editor (Acceso de redacción estándar)</option>
                    <option value="admin">Administrador (Acceso total al sistema)</option>
                  </select>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Registrando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Editar Usuario: {selectedUser.email}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {editError && (
                  <div style={{
                    backgroundColor: 'var(--danger-light)', color: 'var(--danger-text)',
                    padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 500
                  }}>
                    {editError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol en el Hub</label>
                  <select 
                    className="form-select"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                  >
                    <option value="editor">Editor (Acceso de redacción estándar)</option>
                    <option value="admin">Administrador (Acceso total al sistema)</option>
                  </select>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteConfirm && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Eliminar Usuario</h3>
              <button className="modal-close" onClick={() => { if (!deleting) setShowDeleteConfirm(false); }} disabled={deleting}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
              
              {deleteError && (
                <div style={{
                  backgroundColor: 'var(--danger-light)', color: 'var(--danger-text)',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 500
                }}>
                  {deleteError}
                </div>
              )}

              {deleteSuccess && (
                <div style={{
                  backgroundColor: 'var(--success-light)', color: 'var(--success-text)',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 500
                }}>
                  {deleteSuccess}
                </div>
              )}

              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
                ¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.
              </p>
              
              <div style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '4px solid var(--primary)' }}>
                <strong>Usuario:</strong> {userToDelete.name} ({userToDelete.email})
              </div>

            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
