import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { INITIAL_USERS } from '../data/mockData';
import { Radio } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useHub();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Mock default password
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }
    const success = login(email, password);
    if (success) {
      setError('');
    } else {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    login(quickEmail, quickPass);
  };

  return (
    <div className="login-container">
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="login-brand">
            <div className="logo-icon">R</div>
            <div>
              <h1 className="logo-text" style={{ color: 'var(--text-primary)' }}>Rafaela Noticias</h1>
              <span className="login-subtitle">Redacción Hub v1.0</span>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Iniciar Sesión</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ingresa tus credenciales para acceder a la plataforma editorial.
            </p>
          </div>

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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="correo@rafaelanoticias.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              Ingresar al Hub
            </button>
          </form>

          <div className="login-role-selector">
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Accesos Rápidos (Testing de Roles)
            </h3>
            <div className="role-shortcut-grid">
              {INITIAL_USERS.slice(0, 6).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="role-shortcut-btn"
                  onClick={() => handleQuickLogin(u.email, u.password || 'password123')}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="login-art-side">
        <div className="login-art-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
            <Radio size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              En Vivo • Sala de Prensa
            </span>
          </div>
          
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2 }}>
            Coordinación ágil, coberturas en tiempo real.
          </h2>
          
          <p style={{ color: 'var(--sidebar-text-muted)', fontSize: '0.95rem' }}>
            Centraliza la comunicación del equipo, gestiona el material multimedia, mantén al día tus tareas de cobertura y sigue el estado de publicación en todas las redes sociales desde una única plataforma.
          </p>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>15+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)' }}>Periodistas Activos</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)' }}>Móvil & Desktop</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>Real-time</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)' }}>Notificaciones</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
