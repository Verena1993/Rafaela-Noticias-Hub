import React from 'react';
import { useHub } from '../context/HubContext';
import { 
  LayoutDashboard, 
  Radar,
  Inbox,
  CheckSquare, 
  Calendar, 
  Activity, 
  LogOut,
  Table
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
  const { currentUser, logout, notifications } = useHub();

  if (!currentUser) return null;
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'production', name: 'Producción', icon: Table },
    { id: 'proposals', name: 'Propuestas', icon: Inbox },
    { id: 'tasks', name: 'Tareas', icon: CheckSquare },
    { id: 'calendar', name: 'Calendario Editorial', icon: Calendar },
    { id: 'radar', name: 'Radar de Noticias', icon: Radar },
    { id: 'publications', name: 'Publicaciones', icon: CheckSquare },
    { id: 'instagram', name: 'Instagram Plan', icon: Instagram },
    { id: 'activity', name: 'Panel de Actividad', icon: Activity }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close sidebar on mobile
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

      <div className="sidebar-footer">
        <div 
          className="user-avatar" 
          style={{ backgroundColor: currentUser.avatarColor }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <div className="user-info">
          <span className="user-name">{currentUser.name}</span>
          <span className="user-role">Miembro del equipo</span>
        </div>
        <button 
          className="logout-btn" 
          onClick={logout}
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
