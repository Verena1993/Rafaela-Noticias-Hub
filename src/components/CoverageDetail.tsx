import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  ArrowLeft, Calendar, MapPin, 
  Image, FileText, Check, Bot, History, MessageSquare, 
  MessageCircle, Edit3
} from 'lucide-react';
import type { ProductionStatus, Comment, SharedLink } from '../types';
import { MultimediaManager } from './MultimediaManager';

interface CoverageDetailProps {
  coverageId: string;
  onBack: () => void;
}

export const CoverageDetail: React.FC<CoverageDetailProps> = ({ coverageId, onBack }) => {
  const { 
    productions, users, updateProduction,
    currentUser, events, updateEvent, recreateCoverageForEvent
  } = useHub();

  const [activeTab, setActiveTab] = useState<'general' | 'multimedia' | 'chat' | 'publications' | 'copilot' | 'history'>('general');
  const [chatMessage, setChatMessage] = useState('');

  // AI states
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const production = productions.find(p => p.id === coverageId);

  // Edit production state
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<ProductionStatus>('pendiente_planificacion');
  const [editJournalistId, setEditJournalistId] = useState('');
  const [editJournalistId2, setEditJournalistId2] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Local state for comments/chat linked to this production
  const [localComments, setLocalComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(`prod_comments_${coverageId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const startEditingCoverage = () => {
    if (production) {
      setEditTitle(production.title);
      setEditDate(production.productionDate || '');
      setEditTime(production.productionTime || '');
      setEditLocation(production.location || '');
      setEditStatus(production.status);
      setEditJournalistId(production.journalistId || '');
      setEditJournalistId2(production.photographerId || '');
      setEditDescription(production.description || '');
      setShowEditModal(true);
    }
  };

  const handleSaveCoverageDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!production) return;

    try {
      await updateProduction(production.id, {
        title: editTitle || production.title,
        description: editDescription || editTitle || production.title,
        productionDate: editDate || undefined,
        productionTime: editTime || undefined,
        location: editLocation || production.location,
        status: editStatus,
        journalistId: editJournalistId || undefined,
        photographerId: editJournalistId2 || undefined,
        cameramanId: undefined,
        observations: ''
      });

      // Update corresponding calendar event if exists
      const linkedEvent = events.find(evt => evt.coverageId === production.id);
      if (linkedEvent) {
        let eventStatus = linkedEvent.status;
        if (editStatus === 'programada') eventStatus = 'confirmed';
        else if (editStatus === 'finalizada') eventStatus = 'published';
        else if (editStatus === 'pendiente_planificacion') eventStatus = 'pending_confirmation';

        updateEvent(
          linkedEvent.id,
          `[Producción] ${editTitle || production.title}`,
          editDescription || '',
          linkedEvent.type,
          editDate && editTime ? `${editDate}T${editTime}` : linkedEvent.start,
          editDate && editTime ? `${editDate}T${editTime}` : linkedEvent.end,
          editLocation || production.location,
          eventStatus,
          editJournalistId || undefined,
          linkedEvent.programs,
          linkedEvent.formats,
          '',
          linkedEvent.multimedia,
          editJournalistId2 || undefined
        );
      }

      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to save production details', err);
    }
  };

  // Diagnostic states
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventEditTitle, setEventEditTitle] = useState('');
  const [eventEditStart, setEventEditStart] = useState('');
  const [eventEditEnd, setEventEditEnd] = useState('');
  const [eventEditLocation, setEventEditLocation] = useState('');
  const [eventEditAssigneeId, setEventEditAssigneeId] = useState('');

  // Publications states
  const [portalUrl, setPortalUrl] = useState('');
  const [portalInputUrl, setPortalInputUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [extractedLoading, setExtractedLoading] = useState(false);

  const linkedEvent = events.find(e => e.coverageId === coverageId);

  const startEditingEvent = () => {
    if (linkedEvent) {
      setEventEditTitle(linkedEvent.title);
      setEventEditStart(linkedEvent.start);
      setEventEditEnd(linkedEvent.end);
      setEventEditLocation(linkedEvent.location || '');
      setEventEditAssigneeId(linkedEvent.assigneeId || '');
      setIsEditingEvent(true);
    }
  };

  if (!production) {
    const handleSaveEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (linkedEvent) {
        updateEvent(
          linkedEvent.id,
          eventEditTitle,
          linkedEvent.description || '',
          linkedEvent.type,
          eventEditStart,
          eventEditEnd,
          eventEditLocation,
          linkedEvent.status,
          eventEditAssigneeId || undefined,
          linkedEvent.programs,
          linkedEvent.formats
        );
        setIsEditingEvent(false);
      }
    };

    return (
      <div className="card" style={{ padding: '2.5rem', maxWidth: '800px', margin: '2rem auto', borderLeft: '5px solid var(--danger)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.5rem' }}>
              ⚠️ Producción No Encontrada
            </h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No se pudo localizar el registro de la producción con ID <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{coverageId}</code>.
            </p>
          </div>

          {linkedEvent ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                📅 Actividad de agenda huérfana detectada
              </h4>
              
              {!isEditingEvent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Título del compromiso:</strong> {linkedEvent.title}</div>
                  <div><strong>Horario programado:</strong> {new Date(linkedEvent.start).toLocaleString()} - {new Date(linkedEvent.end).toLocaleString()}</div>
                  <div><strong>Ubicación:</strong> {linkedEvent.location || 'Sin especificar'}</div>
                  <div><strong>Responsable:</strong> {users.find(u => u.id === linkedEvent.assigneeId)?.name || 'Ninguno asignado'}</div>
                  <div><strong>Programas:</strong> {linkedEvent.programs?.join(', ') || 'Ninguno'}</div>
                  <div><strong>Formatos:</strong> {linkedEvent.formats?.join(', ') || 'Ninguno'}</div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} 
                      onClick={startEditingEvent}
                    >
                      Editar Actividad
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} 
                      onClick={() => recreateCoverageForEvent(linkedEvent.id, coverageId)}
                    >
                      Recrear Ficha de Producción
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Título</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                      value={eventEditTitle} 
                      onChange={(e) => setEventEditTitle(e.target.value)} 
                    />
                  </div>
                  <div className="form-row-grid" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Inicio</label>
                      <input 
                        type="datetime-local" 
                        required 
                        className="form-input" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                        value={eventEditStart} 
                        onChange={(e) => setEventEditStart(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Fin</label>
                      <input 
                        type="datetime-local" 
                        required 
                        className="form-input" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                        value={eventEditEnd} 
                        onChange={(e) => setEventEditEnd(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Ubicación</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                      value={eventEditLocation} 
                      onChange={(e) => setEventEditLocation(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Responsable</label>
                    <select 
                      className="form-select" 
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                      value={eventEditAssigneeId} 
                      onChange={(e) => setEventEditAssigneeId(e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                      Guardar Cambios
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setIsEditingEvent(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No se detectaron actividades de agenda vinculadas a este ID de producción.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button className="btn btn-secondary" onClick={onBack}>
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProduction(production.id, { status: e.target.value as any });
  };

  const handleShareWhatsApp = () => {
    const text = `*RN Hub - Producción Periodística*\n\n` +
      `*Título:* ${production.title}\n` +
      `*Detalles:* ${production.description || ''}\n` +
      `*Ubicación:* ${production.location || ''}\n` +
      `*Fecha/Hora:* ${production.productionDate || 'Sin fecha'} ${production.productionTime || ''}\n` +
      `*Enlaces:* ${(production.sharedLinks || []).map(l => `${l.title}: ${l.url}`).join(', ')}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isPublishedOn = (plat: string) => {
    return (production.mediaOutlets || []).includes(plat);
  };

  const handleTogglePlatform = async (plat: string) => {
    let updatedOutlets = [...(production.mediaOutlets || [])];
    if (updatedOutlets.includes(plat)) {
      updatedOutlets = updatedOutlets.filter(x => x !== plat);
    } else {
      updatedOutlets.push(plat);
    }
    await updateProduction(production.id, { mediaOutlets: updatedOutlets });
  };

  const handlePortalPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalInputUrl) return;

    let updatedOutlets = [...(production.mediaOutlets || [])];
    if (!updatedOutlets.includes('portal')) {
      updatedOutlets.push('portal');
    }

    const newLink: SharedLink = {
      id: `sl_portal_${Date.now()}`,
      title: 'Nota publicada en Portal',
      url: portalInputUrl,
      uploadDate: new Date().toISOString(),
      userId: currentUser?.id || ''
    };

    await updateProduction(production.id, { 
      mediaOutlets: updatedOutlets,
      sharedLinks: [...(production.sharedLinks || []), newLink]
    });
    setPortalInputUrl('');
  };

  const handleSendComment = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || chatMessage;
    if (!text.trim() || !currentUser) return;

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...localComments, newComment];
    setLocalComments(updatedComments);
    localStorage.setItem(`prod_comments_${coverageId}`, JSON.stringify(updatedComments));
    
    if (!textOverride) setChatMessage('');
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = localComments.filter(c => c.id !== commentId);
    setLocalComments(updated);
    localStorage.setItem(`prod_comments_${coverageId}`, JSON.stringify(updated));
  };

  const handleExtract = () => {
    if (!portalUrl) {
      alert('Por favor introduce la URL del Portal Web primero.');
      return;
    }
    setExtractedLoading(true);
    setTimeout(() => {
      setExtractedText(
        `NOTICIA EXTRAÍDA DEL PORTAL WEB (${portalUrl}):\n` +
        `En las últimas horas, se ha desarrollado un suceso de gran relevancia en ${production.location || 'Rafaela'}.\n` +
        `Detalles de la producción: ${production.description || ''}.\n` +
        `El equipo de Rafaela Noticias constató los hechos en el lugar y continuará ampliando la información en próximas emisiones.`
      );
      setExtractedLoading(false);
    }, 1200);
  };

  const runAiSimulation = (type: string) => {
    if (!extractedText) {
      alert('Por favor, extrae el texto de la URL primero usando el botón "Extraer e Iniciar".');
      return;
    }
    setAiLoading(true);
    setAiOutput('');

    setTimeout(() => {
      let output = '';
      if (type === 'facebook') {
        output = `🔴 [ÚLTIMO MOMENTO] • ${production.title}\n\n` +
          `📍 Ocurriendo ahora en: ${production.location || 'Rafaela'}.\n\n` +
          `👉 ${(production.description || '').substring(0, 160)}...\n\n` +
          `Seguí la cobertura completa minuto a minuto por Rafaela Noticias 👇\n` +
          `📲 Enlace de la nota: ${portalUrl}\n\n` +
          `#Rafaela #RafaelaNoticias #Ahora #CoberturaPeriodistica`;
      } else if (type === 'instagram') {
        output = `📸 COBERTURA RN HUB • ${production.title}\n\n` +
          `Te contamos los detalles clave de lo que está sucediendo en Rafaela. ${(production.description || '').substring(0, 150)}.\n\n` +
          `Leé la crónica completa y mirá las imágenes exclusivas ingresando al enlace de nuestra biografía 🔗\n\n` +
          `#rafaela #noticias #periodismo #noticiaslocales`;
      } else if (type === 'reel') {
        output = `🎬 [GUION PARA INSTAGRAM REEL / TIKTOK]\n` +
          `Duración estimada: 30 segundos.\n\n` +
          `[00:00 - 00:05] HOOK VISUAL: Grabación en primer plano de la locación (${production.location || 'Rafaela'}).\n` +
          `🎙️ LOCUTOR: "¡Atención Rafaela! Miren lo que está pasando ahora mismo en la ciudad..."\n\n` +
          `[00:05 - 00:15] DETALLE: Tomas cerradas del hecho, entrevistas rápidas en la calle.\n` +
          `🎙️ LOCUTOR: "Estamos en vivo informando sobre ${production.title}. Según los reportes periodísticos..."\n\n` +
          `[00:15 - 00:30] LLAMADO A LA ACCIÓN: Grabar al periodista con micrófono de Rafaela Noticias.\n` +
          `🎙️ LOCUTOR: "Toda la información y los videos exclusivos los encontrás ya en la web. Entrá al enlace de nuestra biografía."`;
      } else if (type === 'youtube') {
        output = `🎥 Cobertura especial: ${production.title}\n\n` +
          `Transmisión en vivo y reportaje exclusivo de Rafaela Noticias desde ${production.location || 'Rafaela'}.\n\n` +
          `Leé la nota completa en: ${portalUrl}\n\n` +
          `Suscribite a nuestro canal y activá la campanita 🔔`;
      } else if (type === 'titles') {
        output = `💡 Variantes de Títulos Sugeridos para la Nota:\n\n` +
          `1. Choque múltiple y caos de tránsito en Ruta 34: lo que se sabe hasta ahora\n` +
          `2. Cobertura RN: Fuertes testimonios tras el grave accidente en ${production.location || 'Rafaela'}\n` +
          `3. Caos vehicular en Ruta 34 por un triple choque: hay heridos leves\n` +
          `4. Operativo de urgencia en Ruta 34: bomberos y policía trabajan en el lugar\n` +
          `5. CRÓNICA: Los detalles del accidente vial que movilizó a bomberos en Rafaela`;
      }

      setAiOutput(output);
      setAiLoading(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiOutput);
    alert('¡Copiado al portapapeles!');
  };

  const platformNames: Record<string, string> = {
    portal: 'Portal Web',
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube'
  };

  const PUBLICATION_PLATFORMS = ['portal', 'facebook', 'instagram', 'youtube'];

  const presetMessages = [
    '⚠️ ¡Estoy en camino al lugar!',
    '📍 Llegué a la locación. Iniciando cobertura.',
    '📸 Fotos cargadas al Drive del Hub.',
    '📝 Entrevista completada. Volviendo a la redacción.',
    '✅ Nota subida y lista para publicar.'
  ];

  const activeAssignees = [
    { id: production.journalistId, role: 'Periodista' },
    { id: production.photographerId, role: 'Fotógrafo' },
    { id: production.cameramanId, role: 'Camarógrafo' }
  ].filter(x => x.id);

  return (
    <div>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        gap: '0.5rem'
      }}>
        {[
          { id: 'general', name: 'General', icon: FileText },
          { id: 'multimedia', name: 'Archivos', icon: Image },
          { id: 'chat', name: 'Chat Interno', icon: MessageSquare },
          { id: 'publications', name: 'Publicaciones', icon: Check },
          { id: 'copilot', name: 'Copiloto IA', icon: Bot },
          { id: 'history', name: 'Historial', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div 
        className="card" 
        style={{ 
          marginBottom: '2rem', 
          borderLeft: '5px solid var(--primary)', 
          padding: '2rem', 
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0', color: 'var(--text-primary)', lineHeight: 1.2 }}>{production.title}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)', background: 'rgba(37, 211, 102, 0.05)', padding: '0.5rem 1rem' }}
              onClick={handleShareWhatsApp}
            >
              <MessageCircle size={14} /> Compartir
            </button>
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}
                onClick={startEditingCoverage}
              >
                <Edit3 size={14} /> Editar
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} /> 
            {production.productionDate ? `${production.productionDate} ${production.productionTime || '00:00'} hs` : 'Sin fecha asignada'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} /> {production.location || 'Sin ubicación'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <select 
            className="form-select" 
            style={{ padding: '0.35rem 0.5rem', fontWeight: 600, width: 'auto' }}
            value={production.status}
            onChange={handleStatusChange}
          >
            <option value="pendiente_planificacion">Pendiente de Planificación</option>
            <option value="programada">Programada</option>
            <option value="finalizada">Finalizada</option>
            <option value="suspendida">Suspendida</option>
          </select>
        </div>

        {activeAssignees.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {activeAssignees.map(item => {
              const u = users.find(usr => usr.id === item.id);
              if (!u) return null;
              return (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: 'var(--radius-full)', 
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div 
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      backgroundColor: u.avatarColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700
                    }}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600 }}>{u.name} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({item.role})</span></span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {production.mediaOutlets && production.mediaOutlets.map((prog, idx) => (
            <span key={idx} style={{ fontSize: '0.73rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 600, textTransform: 'capitalize' }}>
              📺 {prog}
            </span>
          ))}
        </div>
      </div>

      <div className="coverage-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeTab === 'general' && (
            <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 className="detail-section-title" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', border: 'none', margin: 0, paddingBottom: '0.5rem' }}>Detalles de la Producción</h3>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {production.description || 'Sin descripción redactada.'}
                </div>
              </div>

              {production.observations && (
                <div>
                  <h3 className="detail-section-title" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', border: 'none', margin: 0, paddingBottom: '0.5rem' }}>Observaciones</h3>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {production.observations}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'multimedia' && (
            <div className="card">
              <h3 className="detail-section-title">📦 Gestor Multimedia y Archivos</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Sube fotos, videos, audios o documentos a esta producción, o vincula enlaces externos y carpetas de Google Drive.
              </p>
              <MultimediaManager production={production} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="card">
              <h3 className="detail-section-title">💬 Canales de Comunicación Interna</h3>
              
              <div className="chat-container">
                <div className="chat-messages">
                  {localComments.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Comienza la conversación. Todo el equipo de esta producción verá los mensajes.
                    </div>
                  ) : (
                    localComments.map((comment) => {
                      const user = users.find(u => u.id === comment.userId);
                      return (
                        <div key={comment.id} className="message-bubble" style={{ position: 'relative' }}>
                          <div 
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              backgroundColor: user?.avatarColor || 'gray',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {comment.userName.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="message-header">
                              <span className="message-sender">{comment.userName}</span>
                              <span className="message-time">
                                {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                              </span>
                            </div>
                            <div className="message-text">{comment.text}</div>
                          </div>
                          {currentUser?.id === comment.userId && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)} 
                              style={{ border: 'none', background: 'transparent', color: 'var(--danger-text)', cursor: 'pointer', opacity: 0.6, fontSize: '0.8rem', padding: '0.2rem' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.35rem', 
                  padding: '0.35rem 0.75rem', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderTop: '1px solid var(--border-color)',
                  overflowX: 'auto'
                }}>
                  {presetMessages.map((msg, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => handleSendComment(undefined, msg)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'var(--transition)'
                      }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendComment} className="chat-input-area" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Escribe un mensaje interno..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'publications' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 className="detail-section-title">📢 Control de Publicación en Redes y Medios</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Marca el estado de publicación en las diferentes plataformas y asocia los enlaces correspondientes.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {PUBLICATION_PLATFORMS.map((platform) => {
                  const isPub = isPublishedOn(platform);
                  return (
                    <div 
                      key={platform} 
                      className="card" 
                      style={{ 
                        padding: '1.25rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem',
                        borderLeft: `4px solid ${isPub ? '#10b981' : 'var(--border-color)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.95rem', textTransform: 'capitalize' }}>
                          {platformNames[platform] || platform}
                        </strong>
                        <span className={`badge ${isPub ? 'status-published' : 'status-pending'}`} style={{ fontSize: '0.7rem' }}>
                          {isPub ? 'Publicado' : 'Pendiente'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button 
                          className={`btn ${isPub ? 'btn-secondary' : 'btn-primary'}`} 
                          style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
                          onClick={() => handleTogglePlatform(platform)}
                        >
                          {isPub ? 'Desmarcar' : 'Marcar Publicado'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Portal link insertion */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>🔗 Asociar Enlace del Portal</h4>
                <form onSubmit={handlePortalPublish} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    required
                    className="form-input"
                    placeholder="Ej. https://www.rafaelanoticias.com/noticia/choque-ruta-34..."
                    value={portalInputUrl}
                    onChange={(e) => setPortalInputUrl(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Asociar Nota
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'copilot' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 className="detail-section-title">🤖 Copiloto Editorial IA</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Extrae el texto de la nota del Portal Web o asocia la gacetilla para que la IA genere copys adaptados para redes sociales.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Enlace de Origen del Portal Web</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Pegar enlace del Portal para analizar..."
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleExtract}
                    disabled={extractedLoading}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {extractedLoading ? 'Extrayendo...' : 'Extraer e Iniciar'}
                  </button>
                </div>
              </div>

              {extractedText && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Texto Base Extraído</label>
                  <textarea
                    readOnly
                    className="form-textarea"
                    rows={4}
                    value={extractedText}
                    style={{ backgroundColor: 'var(--bg-tertiary)', fontSize: '0.82rem', fontFamily: 'monospace' }}
                  />
                </div>
              )}

              {extractedText && (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>Generar Contenido Redes:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => runAiSimulation('titles')}>💡 Sugerir Títulos</button>
                    <button className="btn btn-secondary" onClick={() => runAiSimulation('facebook')}>📘 Post Facebook</button>
                    <button className="btn btn-secondary" onClick={() => runAiSimulation('instagram')}>📸 Post Instagram</button>
                    <button className="btn btn-secondary" onClick={() => runAiSimulation('reel')}>🎬 Guión Reel/TikTok</button>
                    <button className="btn btn-secondary" onClick={() => runAiSimulation('youtube')}>🎥 Post YouTube</button>
                  </div>
                </div>
              )}

              {aiLoading && (
                <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                  🪄 Redactando contenido con IA...
                </div>
              )}

              {aiOutput && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Borrador IA Generado</label>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={copyToClipboard}>
                      Copiar al Portapapeles
                    </button>
                  </div>
                  <textarea
                    readOnly
                    className="form-textarea"
                    rows={6}
                    value={aiOutput}
                    style={{ fontSize: '0.85rem', fontFamily: 'var(--font-primary)' }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card">
              <h3 className="detail-section-title">⏳ Historial de Auditoría y Cambios</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Registro completo de auditoría y operaciones sobre esta actividad de producción.
              </p>
              
              <div className="audit-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '1.25rem', position: 'relative' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', position: 'absolute', left: '-5px', top: '5px' }}></div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block' }}>
                    {production.createdAt ? new Date(production.createdAt).toLocaleString() : 'Recientemente'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Producción registrada en el sistema</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar right details panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem' }}>
              ⚙️ Detalles Técnicos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>ID Único:</span>
                <code style={{ display: 'block', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '4px', fontSize: '0.72rem', wordBreak: 'break-all', marginTop: '0.1rem' }}>
                  {production.id}
                </code>
              </div>
              {production.proposalId && (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Propuesta Origen:</span>
                  <code style={{ display: 'block', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '4px', fontSize: '0.72rem', wordBreak: 'break-all', marginTop: '0.1rem' }}>
                    {production.proposalId}
                  </code>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Última Actualización:</span>
                <span style={{ display: 'block', fontWeight: 600 }}>
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Coverage Details Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowEditModal(false)}>
          <div className="modal-content event-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Planificación de Producción</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCoverageDetails}>
              <div className="modal-body event-form-grid" style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Título de la Producción *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Sesión en el Concejo Deliberante..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ubicación</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Bv. Santa Fe 300, Rafaela"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hora</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quién lo cubre</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <select
                      className="form-select"
                      value={editJournalistId}
                      onChange={e => setEditJournalistId(e.target.value)}
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <option value="">Sin asignar 1...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={editJournalistId2}
                      onChange={e => setEditJournalistId2(e.target.value)}
                      style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <option value="">Sin asignar 2...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Descripción</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Detalles de la cobertura..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estado</label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    style={{ padding: '0.5rem', fontWeight: 600 }}
                  >
                    <option value="pendiente_planificacion">Pendiente de confirmación</option>
                    <option value="programada">Confirmada</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
