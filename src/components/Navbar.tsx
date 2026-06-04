import React, { useState, useRef, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { Search, Bell, Menu } from 'lucide-react';
import { Notifications } from './Notifications';

interface NavbarProps {
  onToggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedCoverageId: (id: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onToggleSidebar, 
  setActiveTab, 
  setSelectedCoverageId 
}) => {
  const { searchQuery, setSearchQuery, notifications } = useHub();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notifications list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar">
      <button className="mobile-menu-toggle" onClick={onToggleSidebar}>
        <Menu size={24} />
      </button>

      <div className="search-container">
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Buscar coberturas, tareas, personas..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-actions" ref={notifRef}>
        <button 
          className="nav-action-btn"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={20} color="var(--text-secondary)" />
          {unreadCount > 0 && <span className="notif-badge"></span>}
        </button>

        {showNotifications && (
          <Notifications 
            onClose={() => setShowNotifications(false)}
            setActiveTab={setActiveTab}
            setSelectedCoverageId={setSelectedCoverageId}
          />
        )}
      </div>
    </header>
  );
};
