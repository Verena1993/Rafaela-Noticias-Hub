import React from 'react';
import { useHub } from '../context/HubContext';
import { MessageSquare, AlertCircle, FileText, CheckSquare } from 'lucide-react';

interface NotificationsProps {
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedCoverageId: (id: string | null) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
  onClose, 
  setActiveTab, 
  setSelectedCoverageId 
}) => {
  const { notifications, markNotificationsAsRead } = useHub();

  const handleNotificationClick = (type: string, linkId?: string) => {
    markNotificationsAsRead();
    onClose();

    if (linkId) {
      if (type === 'coverage' || type === 'comment') {
        setSelectedCoverageId(linkId);
        setActiveTab('coverages');
      } else if (type === 'task') {
        setActiveTab('tasks');
      }
    } else {
      if (type === 'alert') {
        setActiveTab('dashboard');
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle size={14} className="text-danger" style={{ color: 'var(--danger)' }} />;
      case 'comment':
        return <MessageSquare size={14} className="text-info" style={{ color: 'var(--info)' }} />;
      case 'task':
        return <CheckSquare size={14} className="text-warning" style={{ color: 'var(--warning)' }} />;
      default:
        return <FileText size={14} className="text-primary" style={{ color: 'var(--primary)' }} />;
    }
  };

  return (
    <div className="notif-drawer">
      <div className="notif-drawer-header">
        <span>Notificaciones</span>
        <button 
          onClick={markNotificationsAsRead}
          style={{ 
            fontSize: '0.75rem', 
            color: 'var(--primary)', 
            border: 'none', 
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Marcar leídas
        </button>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No tienes notificaciones
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notif-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notif.type, notif.linkId)}
            >
              <div className="notif-title">
                {getIcon(notif.type)}
                <span>{notif.title}</span>
              </div>
              <div className="notif-msg">{notif.message}</div>
              <div className="notif-time">
                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
