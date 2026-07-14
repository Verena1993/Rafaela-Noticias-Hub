import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { Radio, Key } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, resetPassword, users } = useHub();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Recovery modal states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  useEffect(() => {
    const isSuccess = sessionStorage.getItem('passwordResetSuccess');
    if (isSuccess === 'true') {
      setSuccessMessage('Contraseña actualizada correctamente. Inicia sesión con tus nuevas credenciales.');
      sessionStorage.removeItem('passwordResetSuccess');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const success = await login(email, password);
      if (!success) {
        setError('No se pudo iniciar sesión.');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await login(quickEmail, quickPass);
    } catch (err: any) {
      setError(err.message || 'Error en el acceso rápido.');
    } finally {
      setLoading(false);
    }
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

          {successMessage && (
            <div style={{
              backgroundColor: 'var(--success-light)',
              color: 'var(--success-text)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 500,
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              {successMessage}
            </div>
          )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryError('');
                    setRecoveryMessage('');
                    setRecoveryEmail('');
                    setShowRecoveryModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

             <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar al Hub'}
            </button>
          </form>

          <div className="login-role-selector">
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Accesos Rápidos
            </h3>
            {(() => {
              const isRealDbUser = (u: any) => u.id.includes('-') || !u.id.startsWith('u');
              const activeDbUsers = users
                .filter(u => isRealDbUser(u) && (u.activo !== false))
                .sort((a, b) => a.name.localeCompare(b.name));

              if (activeDbUsers.length === 0) {
                return (
                  <div style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                  }}>
                    No hay usuarios activos disponibles para acceso rápido.
                  </div>
                );
              }

              return (
                <div className="role-shortcut-grid">
                  {activeDbUsers.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      className="role-shortcut-btn"
                      onClick={() => handleQuickLogin(u.email, 'password123')}
                      disabled={loading}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {u.role === 'admin' ? 'Administrador' : 'Editor'}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
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

      {showRecoveryModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="recovery-modal-content">
            <button 
              type="button" 
              className="recovery-modal-close" 
              onClick={() => setShowRecoveryModal(false)}
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <div className="recovery-modal-header">
              <div className="recovery-icon-container">
                <Key size={24} />
              </div>
              <h3 className="recovery-modal-title">Recuperar Contraseña</h3>
            </div>

            <div className="recovery-modal-body">
              <p className="recovery-description">
                Ingresá tu correo electrónico y te enviaremos un enlace seguro para crear una nueva contraseña.
              </p>

              {recoveryError && (
                <div className="recovery-message error">
                  {recoveryError}
                </div>
              )}

              {recoveryMessage && (
                <div className="recovery-message success">
                  {recoveryMessage}
                </div>
              )}

              <form 
                className="recovery-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRecoveryError('');
                  setRecoveryMessage('');
                  if (!recoveryEmail.trim()) {
                    setRecoveryError('Por favor ingresa tu correo electrónico.');
                    return;
                  }
                  setRecoveryLoading(true);
                  try {
                    await resetPassword(recoveryEmail.trim());
                    setRecoveryMessage('Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.');
                  } catch (err: any) {
                    setRecoveryError(err.message || 'Error al enviar el email de recuperación.');
                  } finally {
                    setRecoveryLoading(false);
                  }
                }}
              >
                <div className="recovery-input-group">
                  <label className="recovery-input-label" htmlFor="recovery-email">Email</label>
                  <input
                    id="recovery-email"
                    type="email"
                    className="recovery-input"
                    placeholder="correo@rafaelanoticias.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    disabled={recoveryLoading}
                  />
                </div>

                <div className="recovery-actions">
                  <button 
                    type="submit" 
                    className="btn-recovery-primary"
                    disabled={recoveryLoading}
                  >
                    {recoveryLoading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-recovery-secondary" 
                    onClick={() => setShowRecoveryModal(false)}
                    disabled={recoveryLoading}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
