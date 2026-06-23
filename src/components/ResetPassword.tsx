import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Key, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordProps {
  navigate: (path: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ navigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if Supabase has successfully parsed the recovery token and established a session
    const checkRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session);
      } catch (err) {
        console.error('Error checking recovery session:', err);
      } finally {
        setChecking(false);
      }
    };
    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Verifica los campos.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      // Automatically sign out after password update to force login with new password
      await supabase.auth.signOut();
      
      // Store a success message in sessionStorage so Login.tsx can display it
      sessionStorage.setItem('passwordResetSuccess', 'true');
      
      // Redirect back to login screen
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al actualizar tu contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Validando sesión de recuperación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form-side" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '100%' }}>
        <div className="login-form-wrapper" style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
          <div className="login-brand">
            <div className="logo-icon">R</div>
            <div>
              <h1 className="logo-text" style={{ color: 'var(--text-primary)' }}>Rafaela Noticias</h1>
              <span className="login-subtitle">Recuperación de Acceso</span>
            </div>
          </div>

          {!hasSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-text)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 500,
                lineHeight: 1.4
              }}>
                <strong>Enlace inválido o expirado.</strong> El token de recuperación de Supabase no es válido o ha expirado. Por favor, solicita un nuevo enlace desde la pantalla de login.
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }}
                onClick={() => navigate('/')}
              >
                Volver al Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Establecer Nueva Contraseña</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Ingresa tu nueva contraseña de acceso. Asegúrate de que tenga al menos 8 caracteres.
                </p>
              </div>

              {error && (
                <div style={{
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger-text)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">Nueva Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirmar Contraseña</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={loading}
                >
                  <Key size={16} />
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.75rem', width: '100%', marginTop: '0.25rem' }}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/');
                  }}
                  disabled={loading}
                >
                  Cancelar y Volver
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
