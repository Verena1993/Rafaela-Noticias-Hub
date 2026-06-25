import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Settings as SettingsIcon, Tag, Folder, Plus, Edit2, Trash2, Globe, ShieldAlert,
  FileText, AlertCircle, Award, Heart, Film, Briefcase
} from 'lucide-react';
import type { Category } from '../types';

export const iconMap: Record<string, React.ComponentType<any>> = {
  Folder,
  Tag,
  Globe,
  FileText,
  AlertCircle,
  Award,
  Heart,
  Film,
  Briefcase
};

export const predefinedColors = [
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Verde', hex: '#10b981' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Amarillo', hex: '#f59e0b' },
  { name: 'Púrpura', hex: '#8b5cf6' },
  { name: 'Índigo', hex: '#6366f1' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Gris', hex: '#6b7280' }
];

export const Settings: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useHub();

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // States
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState('#3b82f6');
  const [iconInput, setIconInput] = useState('Folder');
  const [activeInput, setActiveInput] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await addCategory(nameInput.trim(), colorInput, iconInput, activeInput);
      setShowCreateModal(false);
      setNameInput('');
    } catch (err: any) {
      setError(err.message || 'Error al crear la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setNameInput(category.name);
    setColorInput(category.color || '#3b82f6');
    setIconInput(category.icon || 'Folder');
    setActiveInput(category.active !== false);
    setError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !nameInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await updateCategory(selectedCategory.id, nameInput.trim(), colorInput, iconInput, activeInput);
      setShowEditModal(false);
      setSelectedCategory(null);
      setNameInput('');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setError('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    setError('');
    try {
      await deleteCategory(selectedCategory.id);
      setShowDeleteConfirm(false);
      setSelectedCategory(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la categoría. Asegúrate de que no existan coberturas asociadas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={22} style={{ color: 'var(--primary)' }} />
          Configuración de Categorías
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Administración de las categorías y taxonomía oficial del portal.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Listado de Categorías</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Secciones oficiales del portal para organizar coberturas y artículos periodísticos.
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setNameInput('');
              setColorInput('#3b82f6');
              setIconInput('Folder');
              setActiveInput(true);
              setError('');
              setShowCreateModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Agregar Categoría
          </button>
        </div>

        {categories.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            No existen categorías registradas en el sistema. Presiona "Agregar Categoría" para crear la primera.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Slug (URL)</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Fecha Creación</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => {
                  const CategoryIcon = iconMap[c.icon] || Folder;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 550 }}>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: c.color || '#3b82f6', 
                          display: 'inline-block' 
                        }} />
                        <CategoryIcon size={16} style={{ color: c.color || '#3b82f6' }} />
                        <span>{c.name}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.slug}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${c.active !== false ? 'status-confirmed' : 'status-pending_confirmation'}`} style={{ fontSize: '0.75rem' }}>
                          {c.active !== false ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('es-AR') : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-icon" 
                            onClick={() => handleEditClick(c)}
                            title="Editar Categoría"
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-icon btn-danger" 
                            onClick={() => handleDeleteClick(c)}
                            title="Eliminar Categoría"
                            style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-text)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nueva Categoría</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nombre de la Categoría</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Ej. Policiales o Deportes"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {predefinedColors.map(color => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setColorInput(color.hex)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: color.hex,
                          border: colorInput === color.hex ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          boxShadow: colorInput === color.hex ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ícono</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {Object.keys(iconMap).map(iconName => {
                      const ItemIcon = iconMap[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setIconInput(iconName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.4rem',
                            borderRadius: '6px',
                            border: iconInput === iconName ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                            background: iconInput === iconName ? 'var(--primary-light)' : 'transparent',
                            color: iconInput === iconName ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <ItemIcon size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="active-category-create"
                    checked={activeInput}
                    onChange={e => setActiveInput(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="active-category-create" className="form-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Categoría Activa (disponible para asignaciones)
                  </label>
                </div>

              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Editar Categoría</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                  <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nombre de la Categoría</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {predefinedColors.map(color => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setColorInput(color.hex)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: color.hex,
                          border: colorInput === color.hex ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          boxShadow: colorInput === color.hex ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ícono</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {Object.keys(iconMap).map(iconName => {
                      const ItemIcon = iconMap[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setIconInput(iconName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.4rem',
                            borderRadius: '6px',
                            border: iconInput === iconName ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                            background: iconInput === iconName ? 'var(--primary-light)' : 'transparent',
                            color: iconInput === iconName ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <ItemIcon size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="active-category-edit"
                    checked={activeInput}
                    onChange={e => setActiveInput(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="active-category-edit" className="form-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Categoría Activa (disponible para asignaciones)
                  </label>
                </div>

              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger-text)' }}>
                <ShieldAlert size={20} /> Confirmar Eliminación
              </h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                ¿Estás seguro de que deseas eliminar la categoría <strong>{selectedCategory?.name}</strong>?
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Esta acción no se puede deshacer y puede fallar si existen coberturas vinculadas a esta categoría.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={loading}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={loading} style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
