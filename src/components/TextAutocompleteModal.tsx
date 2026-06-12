import React, { useState } from 'react';
import { aiService } from '../services/aiService';

interface TextAutocompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    interviewees: string[];
    contactInfo: string;
  }, destinationType?: 'proposal' | 'coverage') => void;
  showDestinationSelect?: boolean;
  defaultDestination?: 'proposal' | 'coverage';
}

export const TextAutocompleteModal: React.FC<TextAutocompleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  showDestinationSelect = false,
  defaultDestination = 'proposal'
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState<'proposal' | 'coverage'>(defaultDestination);

  // Form states for Step 2
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [intervieweesRaw, setIntervieweesRaw] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const result = await aiService.analyzeTextForCoverage(rawText);
      setTitle(result.title);
      setDate(result.date);
      setTime(result.time);
      setLocation(result.location);
      setDescription(result.description);
      setIntervieweesRaw(result.interviewees.join(', '));
      setContactInfo(result.contactInfo);
      setStep(2);
    } catch (error) {
      console.error("Error analyzing text", error);
      alert("No se pudo analizar el texto. Por favor intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const interviewees = intervieweesRaw
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    onConfirm({
      title,
      date,
      time,
      location,
      description,
      interviewees,
      contactInfo
    }, showDestinationSelect ? destination : undefined);
    
    // Reset state
    setStep(1);
    setRawText('');
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 120 }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '750px', 
          width: '90%', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> Autocompletar desde Texto
          </h3>
          <button className="modal-close" onClick={onClose} style={{ fontSize: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
        </div>

        {step === 1 ? (
          <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Pegue gacetillas, correos oficiales, invitaciones o mensajes de WhatsApp. 
              La IA analizará el texto para extraer el título, fecha, hora, ubicación y detalles automáticamente.
            </p>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Texto de Origen</label>
              <textarea
                className="form-textarea"
                rows={10}
                placeholder="Pegue el texto aquí (ej: 'Estimados, el próximo viernes a las 10:00 hs los invitamos a la inauguración de la plaza en Bv. Lehmann... Contacto: Juan Pérez 3492-123456')"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                disabled={loading}
              />
            </div>

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--border-color)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analizando contenido con IA...</span>
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleAnalyze} 
                disabled={loading || !rawText.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>✨</span> Analizar Texto
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.08)', border: '1px solid rgba(var(--primary-rgb), 0.2)', padding: '0.85rem', borderRadius: '6px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                  <strong>¡Análisis completo!</strong> Revise y edite la información extraída por la IA antes de importarla. 
                  Los campos de asignación del equipo se mantendrán limpios para que usted los decida manualmente.
                </p>
              </div>

              {showDestinationSelect && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Destino de la Información</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="destinationType"
                        checked={destination === 'proposal'}
                        onChange={() => setDestination('proposal')}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      Propuesta Editorial (Idea a evaluar)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="destinationType"
                        checked={destination === 'coverage'}
                        onChange={() => setDestination('coverage')}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      Cobertura Activa (Planificar en agenda)
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Título Sugerido *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Fecha del Evento</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Hora del Evento</label>
                  <input
                    type="time"
                    className="form-input"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Ubicación / Lugar</label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Descripción / Resumen</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Entrevistados (separados por coma)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Daniel Silva, María Gómez"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                    value={intervieweesRaw}
                    onChange={e => setIntervieweesRaw(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 550, fontSize: '0.85rem' }}>Datos de Contacto</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: juan@mail.com, 3492-445566"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                    value={contactInfo}
                    onChange={e => setContactInfo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button type="submit" className="btn btn-primary">
                Importar e Instanciar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
