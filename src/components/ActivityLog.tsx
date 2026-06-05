import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { Activity as ActivityIcon, Clock, Filter } from 'lucide-react';
import { formatFriendlyDate } from '../utils/dateUtils';

export const ActivityLog: React.FC = () => {
  const { activities, users } = useHub();
  const [filterUser, setFilterUser] = useState('all');

  const filteredActs = activities.filter(act => {
    if (filterUser === 'all') return true;
    return act.userId === filterUser;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Panel de Actividad</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Registro de auditoría en tiempo real de todas las acciones del equipo.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Filter size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Filtrar Auditoría:
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuario</span>
          <select 
            className="form-select"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="all">Todos los integrantes</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="section-title">
          <ActivityIcon size={18} />
          Historial Global de Acciones ({filteredActs.length})
        </h3>

        {filteredActs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
            No hay actividades registradas con el filtro actual.
          </p>
        ) : (
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredActs.map((act) => {
              const u = users.find(usr => usr.id === act.userId);
              return (
                <div 
                  key={act.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: u?.avatarColor || '#64748b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {act.userName.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{act.userName}</strong>
                      <span style={{ color: 'var(--text-secondary)' }}> ({u?.role.replace('_', ' ')}) </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{act.action}</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <Clock size={10} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatFriendlyDate(act.timestamp)} a las {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
