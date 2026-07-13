import React, { useState, useRef, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Calendar, 
  Activity, 
  LogOut,
  Table,
  User,
  Settings as SettingsIcon,
  Megaphone,
  Lightbulb,
  Users,
  ChevronLeft,
  ChevronRight,
  Radio,
  Target
} from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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

  // Menu items are rendered directly with structural layout below

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
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{ 
        width: isCollapsed ? '70px' : '260px', 
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}
    >
      <div 
        className="sidebar-header"
        style={{ 
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '1rem 0.5rem' : '1.25rem',
          gap: '0.5rem',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="logo-icon">RN</div>
        {!isCollapsed && <span className="logo-text">RN Hub</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sidebar-text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            marginLeft: isCollapsed ? '0' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {/* Block 1: Dashboard */}
        <button
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Dashboard" : undefined}
        >
          <LayoutDashboard size={18} />
          {!isCollapsed && <span>Dashboard</span>}
          {!isCollapsed && unreadCount > 0 && (
            <span className="menu-badge">{unreadCount}</span>
          )}
        </button>

        {/* Separator 1 */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.50rem 0' }} />

        {/* Block 2: Herramientas */}
        <button
          className={`menu-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => handleNavClick('calendar')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Agenda" : undefined}
        >
          <Calendar size={18} />
          {!isCollapsed && <span>Agenda</span>}
        </button>

        <button
          className={`menu-item ${activeTab === 'production' ? 'active' : ''}`}
          onClick={() => handleNavClick('production')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Producción" : undefined}
        >
          <Table size={18} />
          {!isCollapsed && <span>Producción</span>}
        </button>

        <button
          className={`menu-item ${activeTab === 'publications' ? 'active' : ''}`}
          onClick={() => handleNavClick('publications')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Publicaciones" : undefined}
        >
          <Megaphone size={18} />
          {!isCollapsed && <span>Publicaciones</span>}
        </button>

        <button
          className={`menu-item ${activeTab === 'publicity' ? 'active' : ''}`}
          onClick={() => handleNavClick('publicity')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Publicidad" : undefined}
        >
          <Target size={18} />
          {!isCollapsed && <span>Publicidad</span>}
        </button>

        <button
          className={`menu-item ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => handleNavClick('proposals')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Propuestas" : undefined}
        >
          <Lightbulb size={18} />
          {!isCollapsed && <span>Propuestas</span>}
        </button>

        <button
          className={`menu-item ${activeTab === 'radar' ? 'active' : ''}`}
          onClick={() => handleNavClick('radar')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Radar de Noticias" : undefined}
        >
          <Radio size={18} />
          {!isCollapsed && <span>Radar de Noticias</span>}
        </button>

        {/* Block 3 & 4: Administración y Configuración (Admin only) */}
        {currentUser?.role === 'admin' && (
          <>
            {/* Separator 2 */}
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.50rem 0' }} />

            {/* ADMINISTRACIÓN */}
            {!isCollapsed && (
              <span className="menu-section-title" style={{ padding: '0.5rem 0.75rem 0.25rem', userSelect: 'none', pointerEvents: 'none' }}>
                ADMINISTRACIÓN
              </span>
            )}

            <button
              className={`menu-item ${activeTab === 'user-management' ? 'active' : ''}`}
              onClick={() => handleNavClick('user-management')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                width: '100%', 
                textAlign: isCollapsed ? 'center' : 'left',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
              }}
              title={isCollapsed ? "Usuarios" : undefined}
            >
              <Users size={18} />
              {!isCollapsed && <span>Usuarios</span>}
            </button>

            {/* Separator 3 */}
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.50rem 0' }} />

            {/* CONFIGURACIÓN */}
            {!isCollapsed && (
              <span className="menu-section-title" style={{ padding: '0.5rem 0.75rem 0.25rem', userSelect: 'none', pointerEvents: 'none' }}>
                CONFIGURACIÓN
              </span>
            )}

            <button
              className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                width: '100%', 
                textAlign: isCollapsed ? 'center' : 'left',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
              }}
              title={isCollapsed ? "Categorías" : undefined}
            >
              <SettingsIcon size={18} />
              {!isCollapsed && <span>Categorías</span>}
            </button>
          </>
        )}

        {/* Separator 4 */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.50rem 0' }} />

        {/* Block 5: Actividad y Mi Perfil */}
        <button
          className={`menu-item ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleNavClick('activity')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Actividad" : undefined}
        >
          <Activity size={18} />
          {!isCollapsed && <span>Actividad</span>}
        </button>

        <button
          className="menu-item"
          onClick={() => setShowProfileModal(true)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: isCollapsed ? 'center' : 'left',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem'
          }}
          title={isCollapsed ? "Mi Perfil" : undefined}
        >
          <User size={18} />
          {!isCollapsed && <span>Mi Perfil</span>}
        </button>
      </nav>

      <div 
        className="sidebar-footer" 
        ref={menuRef} 
        style={{ 
          position: 'relative',
          padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          display: 'flex',
          alignItems: 'center'
        }}
      >
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
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isCollapsed ? '0' : '0.75rem', 
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            flex: 1, 
            cursor: 'pointer', 
            overflow: 'hidden' 
          }}
        >
          <div 
            className="user-avatar" 
            style={{ backgroundColor: currentUser.avatarColor, flexShrink: 0 }}
          >
            {currentUser.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>
                {currentUser.role === 'admin' ? 'Administrador' : 'Editor'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mi Perfil Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="profile-modal-content">
            <button 
              type="button" 
              className="profile-modal-close" 
              onClick={() => {
                setShowProfileModal(false);
                setError('');
                setSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <div className="profile-modal-header">
              <h3 className="profile-modal-title">Mi Perfil</h3>
            </div>
            
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="profile-modal-body">
                {error && (
                  <div className="recovery-message error">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="recovery-message success">
                    {success}
                  </div>
                )}

                {/* Personal Info */}
                <div className="profile-section">
                  <h4 className="profile-section-title">
                    Información Personal
                  </h4>
                  
                  <div className="profile-form-group">
                    <label className="profile-form-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      disabled={profileLoading}
                    />
                  </div>
                  
                  <div className="profile-form-group">
                    <label className="profile-form-label">Email (Solo Lectura)</label>
                    <input
                      type="email"
                      className="profile-form-input"
                      value={currentUser.email}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>

                {/* Password Change */}
                <div className="profile-section">
                  <h4 className="profile-section-title">
                    Cambiar Contraseña
                  </h4>
                  <p className="profile-section-subtitle">
                    Deja los siguientes campos vacíos si no deseas cambiar tu contraseña.
                  </p>
                  
                  <div className="profile-form-group">
                    <label className="profile-form-label">Contraseña Actual</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Contraseña actual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Nueva Contraseña (mínimo 8 caracteres)</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Repite la nueva contraseña"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="profile-modal-footer">
                <button 
                  type="button" 
                  className="profile-btn-secondary" 
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
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="profile-btn-primary"
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
