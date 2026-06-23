import React, { useState, useRef, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Radar,
  Inbox,
  CheckSquare, 
  Calendar, 
  Activity, 
  LogOut,
  Table,
  Kanban,
  UserCheck,
  User
} from 'lucide-react';

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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { currentUser, logout, notifications, updateHubUser } = useHub();
  
  // User menu & profile modal states
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Profile edit states
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize profile values when modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
    }
  }, [currentUser, showProfileModal]);

  // Click outside to close user menu popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'coverages', name: 'Coberturas', icon: Kanban },
    { id: 'production', name: 'Producción', icon: Table },
    { id: 'proposals', name: 'Propuestas', icon: Inbox },
    { id: 'tasks', name: 'Tareas', icon: CheckSquare },
    { id: 'calendar', name: 'Calendario Editorial', icon: Calendar },
    { id: 'radar', name: 'Radar de Noticias', icon: Radar },
    { id: 'publications', name: 'Publicaciones', icon: CheckSquare },
    { id: 'instagram', name: 'Instagram Plan', icon: Instagram },
    { id: 'activity', name: 'Panel de Actividad', icon: Activity }
  ];

  if (currentUser?.role === 'admin') {
    menuItems.push({ id: 'user-management', name: 'Gestión de Usuarios', icon: UserCheck });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close sidebar on mobile
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setProfileLoading(true);

    try {
      // 1. Update basic info (name) in Profiles table
      const nameChanged = profileName !== currentUser.name;

      if (nameChanged) {
        await updateHubUser(currentUser.id, {
          name: profileName
        });
      }

      // 2. Update password if fields are completed
      if (currentPassword || newPassword || confirmNewPassword) {
        if (!currentPassword) {
          setError('Debes ingresar tu contraseña actual para cambiarla.');
          setProfileLoading(false);
          return;
        }

        if (newPassword.length < 8) {
          setError('La nueva contraseña debe tener al menos 8 caracteres.');
          setProfileLoading(false);
          return;
        }

        if (newPassword !== confirmNewPassword) {
          setError('La nueva contraseña y la confirmación no coinciden.');
          setProfileLoading(false);
          return;
        }

        // Re-authenticate to verify current password
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword
        });

        if (authError) {
          setError('La contraseña actual es incorrecta.');
          setProfileLoading(false);
          return;
        }

        // Update the password in auth.users
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          throw updateError;
        }

        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }

      setSuccess('Perfil actualizado correctamente.');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al actualizar el perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">RN</div>
        <span className="logo-text">RN Hub</span>
      </div>

      <nav className="sidebar-menu">
        <span className="menu-section-title">Navegación</span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Icon size={18} />
              <span>{item.name}</span>
              {item.id === 'dashboard' && unreadCount > 0 && (
                <span className="menu-badge">{unreadCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" ref={menuRef} style={{ position: 'relative' }}>
        {/* User popover menu */}
        {showMenu && (
          <div className="user-menu-popover">
            <button 
              type="button" 
              className="popover-item"
              onClick={() => {
                setShowProfileModal(true);
                setShowMenu(false);
              }}
            >
              <User size={14} />
              Mi Perfil
            </button>
            <div className="popover-divider"></div>
            <button 
              type="button" 
              className="popover-item logout"
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
            >
              <LogOut size={14} />
              Cerrar Sesión
            </button>
          </div>
        )}

        <div 
          className="user-profile-trigger" 
          onClick={() => setShowMenu(!showMenu)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer', overflow: 'hidden' }}
        >
          <div 
            className="user-avatar" 
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role" style={{ textTransform: 'capitalize' }}>
              {currentUser.role === 'admin' ? 'Administrador' : 'Editor'}
            </span>
          </div>
        </div>
      </div>

      {/* Mi Perfil Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Mi Perfil</h3>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => {
                  setShowProfileModal(false);
                  setError('');
                  setSuccess('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
                {error && (
                  <div style={{
                    backgroundColor: 'var(--danger-light)',
                    color: 'var(--danger-text)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{
                    backgroundColor: 'var(--success-light)',
                    color: 'var(--success-text)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}>
                    {success}
                  </div>
                )}

                {/* Personal Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', letterSpacing: '0.05em' }}>
                    Información Personal
                  </h4>
                  
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      disabled={profileLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email (Solo Lectura)</label>
                    <input
                      type="email"
                      className="form-input"
                      value={currentUser.email}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>

                {/* Password Change */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', letterSpacing: '0.05em' }}>
                    Cambiar Contraseña
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.25rem' }}>
                    Deja los siguientes campos vacíos si no deseas cambiar tu contraseña.
                  </p>
                  
                  <div className="form-group">
                    <label className="form-label">Contraseña Actual</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Contraseña actual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nueva Contraseña (mínimo 8 caracteres)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Repite la nueva contraseña"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowProfileModal(false);
                    setError('');
                    setSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  disabled={profileLoading}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
