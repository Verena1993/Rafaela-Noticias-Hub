import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  ArrowLeft, Calendar, MapPin, Send, Plus, ExternalLink, 
  Image, FileText, Check, Bot, History, Sparkles, MessageSquare, Clipboard,
  MessageCircle
} from 'lucide-react';
import type { Coverage, PublicationChecklist, ProgramType, FormatType } from '../data/mockData';

interface CoverageDetailProps {
  coverageId: string;
  onBack: () => void;
}

export const CoverageDetail: React.FC<CoverageDetailProps> = ({ coverageId, onBack }) => {
  const { 
    coverages, users, updateCoverageStatus, 
    addCommentToCoverage, addMultimediaToCoverage, addSharedLinkToCoverage, 
    updatePublicationStatus, currentUser, updateCoverageDetails,
    events, updateEvent, recreateCoverageForEvent
  } = useHub();

  const [activeTab, setActiveTab] = useState<'general' | 'multimedia' | 'chat' | 'publications' | 'copilot' | 'history'>('general');
  const [chatMessage, setChatMessage] = useState('');
  
  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkComment, setLinkComment] = useState('');

  const [showFileModal, setShowFileModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');

  const [publishingPlatform, setPublishingPlatform] = useState<keyof PublicationChecklist | null>(null);
  const [publishLink, setPublishLink] = useState('');

  // AI states
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const coverage = coverages.find(c => c.id === coverageId);

  // Edit coverage state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(coverage?.title || '');
  const [editDescription, setEditDescription] = useState(coverage?.description || '');
  const [editDateTime, setEditDateTime] = useState(coverage?.dateTime || '');
  const [editLocation, setEditLocation] = useState(coverage?.location || '');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>(coverage?.priority || 'medium');
  const [editAssignees, setEditAssignees] = useState<string[]>(coverage?.assignees || []);
  const [editPrograms, setEditPrograms] = useState<ProgramType[]>(coverage?.programs || []);
  const [editFormats, setEditFormats] = useState<FormatType[]>(coverage?.formats || []);
  const [editStatus, setEditStatus] = useState<Coverage['status']>(coverage?.status || 'pending');
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; type: 'photo' | 'video' | 'audio' | 'document'; size: string } | null>(null);

  // Diagnostic states
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventEditTitle, setEventEditTitle] = useState('');
  const [eventEditStart, setEventEditStart] = useState('');
  const [eventEditEnd, setEventEditEnd] = useState('');
  const [eventEditLocation, setEventEditLocation] = useState('');
  const [eventEditAssigneeId, setEventEditAssigneeId] = useState('');

  const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital'];
  const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

  const toggleEditProgram = (prog: ProgramType) => {
    setEditPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };
  const toggleEditFormat = (form: FormatType) => {
    setEditFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };
  const handleEditAssigneeToggle = (userId: string) => {
    setEditAssignees(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSaveCoverageDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverage) return;
    updateCoverageDetails(
      coverage.id,
      editTitle,
      editDescription,
      editDateTime,
      editLocation,
      editPriority,
      editAssignees,
      editPrograms,
      editFormats,
      editStatus
    );
    setShowEditModal(false);
  };

  // New V2 states
  const [portalUrl, setPortalUrl] = useState(coverage?.publications.portal.link || '');
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

  if (!coverage) {
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
              ⚠️ Cobertura No Encontrada
            </h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No se pudo localizar el registro de la cobertura con ID <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{coverageId}</code>.
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
                      Recrear Ficha de Cobertura
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
              No se detectaron actividades de agenda vinculadas a este ID de cobertura.
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
    updateCoverageStatus(coverage.id, e.target.value as any);
  };

  const handleShareWhatsApp = () => {
    const text = `*RN Hub - Cobertura Periodística*\n\n` +
      `*Título:* ${coverage.title}\n` +
      `*Detalles:* ${coverage.description}\n` +
      `*Ubicación:* ${coverage.location}\n` +
      `*Fecha/Hora:* ${new Date(coverage.dateTime).toLocaleString()}\n` +
      `*Enlaces:* ${coverage.sharedLinks.map(l => `${l.title}: ${l.url}`).join(', ')}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileUrl = event.target?.result as string || URL.createObjectURL(file);
      let type: 'photo' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'photo';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      addMultimediaToCoverage(coverage.id, file.name, type, fileUrl, sizeInMb);
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePlatform = (plat: keyof PublicationChecklist) => {
    const check = coverage.publications[plat];
    const isPub = check.status === 'published';
    if (isPub) {
      updatePublicationStatus(coverage.id, plat, 'pending');
    } else {
      if (plat === 'portal') {
        setPublishingPlatform('portal');
        setPublishLink('');
      } else {
        updatePublicationStatus(coverage.id, plat, 'published');
      }
    }
  };

  const handleSendComment = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || chatMessage;
    if (!text.trim()) return;

    addCommentToCoverage(coverage.id, text);
    if (!textOverride) setChatMessage('');
  };

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkLabel.trim() || !linkUrl.trim()) return;

    addSharedLinkToCoverage(coverage.id, linkLabel, linkUrl, linkComment);
    setLinkLabel('');
    setLinkUrl('');
    setLinkComment('');
    setShowLinkModal(false);
  };

  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    let mockUrl = '#';
    let size = '1.2 MB';
    if (fileType === 'photo') {
      mockUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
      size = '2.5 MB';
    } else if (fileType === 'video') {
      size = '18.4 MB';
    } else if (fileType === 'audio') {
      size = '3.6 MB';
    }

    addMultimediaToCoverage(coverage.id, fileName, fileType, mockUrl, size);
    setFileName('');
    setShowFileModal(false);
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingPlatform) return;

    updatePublicationStatus(coverage.id, publishingPlatform, 'published', publishLink);
    setPublishLink('');
    setPublishingPlatform(null);
  };

  // AI Simulations
  const handleExtract = () => {
    if (!portalUrl) {
      alert('Por favor introduce la URL del Portal Web primero.');
      return;
    }
    setExtractedLoading(true);
    setTimeout(() => {
      setExtractedText(
        `NOTICIA EXTRAÍDA DEL PORTAL WEB (${portalUrl}):\n` +
        `En las últimas horas, se ha desarrollado un suceso de gran relevancia en ${coverage.location}.\n` +
        `Detalles de la cobertura: ${coverage.description}.\n` +
        `El equipo de Rafaela Noticias constató los hechos en el lugar de cobertura y continuará ampliando la información en próximas emisiones.`
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
        output = `🔴 [ÚLTIMO MOMENTO] • ${coverage.title}\n\n` +
          `📍 Ocurriendo ahora en: ${coverage.location}.\n\n` +
          `👉 ${coverage.description.substring(0, 160)}...\n\n` +
          `Seguí la cobertura completa minuto a minuto por Rafaela Noticias 👇\n` +
          `📲 Enlace de la nota: ${portalUrl}\n\n` +
          `#Rafaela #RafaelaNoticias #Ahora #CoberturaPeriodistica`;
      } else if (type === 'instagram') {
        output = `📸 COBERTURA RN HUB • ${coverage.title}\n\n` +
          `Te contamos los detalles clave de lo que está sucediendo en Rafaela. ${coverage.description.substring(0, 150)}.\n\n` +
          `Leé la crónica completa y mirá las imágenes exclusivas ingresando al enlace de nuestra biografía 🔗\n\n` +
          `#rafaela #noticias #periodismo #noticiaslocales`;
      } else if (type === 'reel') {
        output = `🎬 [GUION PARA INSTAGRAM REEL / TIKTOK]\n` +
          `Duración estimada: 30 segundos.\n\n` +
          `[00:00 - 00:05] HOOK VISUAL: Grabación en primer plano de la locación (${coverage.location}).\n` +
          `🎙️ LOCUTOR: "¡Atención Rafaela! Miren lo que está pasando ahora mismo en la ciudad..."\n\n` +
          `[00:05 - 00:15] DETALLE: Tomas cerradas del hecho, entrevistas rápidas en la calle.\n` +
          `🎙️ LOCUTOR: "Estamos en vivo informando sobre ${coverage.title}. Según los reportes periodísticos..."\n\n` +
          `[00:15 - 00:30] LLAMADO A LA ACCIÓN: Grabar al periodista con micrófono de Rafaela Noticias.\n` +
          `🎙️ LOCUTOR: "Toda la información y los videos exclusivos los encontrás ya en la web. Entrá al enlace de nuestra biografía."`;
      } else if (type === 'youtube') {
        output = `🎥 Cobertura especial: ${coverage.title}\n\n` +
          `Transmisión en vivo y reportaje exclusivo de Rafaela Noticias desde ${coverage.location}.\n\n` +
          `Leé la nota completa en: ${portalUrl}\n\n` +
          `Suscribite a nuestro canal y activá la campanita 🔔`;
      } else if (type === 'titles') {
        output = `💡 Variantes de Títulos Sugeridos para la Nota:\n\n` +
          `1. Choque múltiple y caos de tránsito en Ruta 34: lo que se sabe hasta ahora\n` +
          `2. Cobertura RN: Fuertes testimonios tras el grave accidente en ${coverage.location}\n` +
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

  const platformNames: Record<keyof PublicationChecklist, string> = {
    portal: 'Portal Web',
    facebook: 'Facebook',
    ig_reel: 'Instagram Reel',
    ig_carousel: 'Instagram Carrusel',
    ig_story: 'Instagram Historia',
    youtube: 'YouTube',
    tiktok: 'TikTok'
  };

  // Preset responses for rapid logging in mobile chat
  const presetMessages = [
    '⚠️ ¡Estoy en camino al lugar!',
    '📍 Llegué a la locación. Iniciando cobertura.',
    '📸 Fotos cargadas al Drive del Hub.',
    '📝 Entrevista completada. Volviendo a la redacción.',
    '✅ Nota subida y lista para publicar.'
  ];

  return (
    <div>
      {/* Back Header */}
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Volver a Coberturas
      </button>

      {/* Coverage Header */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '5px solid var(--primary)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem' }}>{coverage.title}</h2>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)', background: 'rgba(37, 211, 102, 0.05)' }}
              onClick={handleShareWhatsApp}
            >
              <MessageCircle size={14} /> Compartir
            </button>
            
            

            
            <div className="form-group" style={{ margin: 0 }}>
              <select 
                className="form-select" 
                style={{ padding: '0.35rem 0.5rem', fontWeight: 600 }}
                value={coverage.status}
                onChange={handleStatusChange}
              >
                <option value="pending">Pendiente</option>
                <option value="in_coverage">En Cobertura</option>
                <option value="in_redaction">En Redacción</option>
                <option value="ready_to_publish">Lista para Publicar</option>
                <option value="published">Publicada</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} /> 
            {new Date(coverage.dateTime).toLocaleDateString()} - {new Date(coverage.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} /> {coverage.location}
          </span>
        </div>
      </div>

      {/* Module Tabs (Notion-inspired sticky navigation bar) */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        gap: '0.5rem'
      }}>
        {[
          { id: 'general', name: 'General', icon: FileText },
          { id: 'multimedia', name: 'Multimedia & Enlaces', icon: Image },
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

      {/* Tab Contents */}
      <div className="coverage-detail-grid">
        {/* Left main pane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 className="detail-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>Pauta / Información General</h3>
                {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => {
                      if (coverage) {
                        setEditTitle(coverage.title);
                        setEditDescription(coverage.description);
                        setEditDateTime(coverage.dateTime);
                        setEditLocation(coverage.location);
                        setEditPriority(coverage.priority);
                        setEditAssignees(coverage.assignees);
                        setEditPrograms(coverage.programs || []);
                        setEditFormats(coverage.formats || []);
                        setEditStatus(coverage.status);
                        setShowEditModal(true);
                      }
                    }}
                  >
                    Editar Planificación
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {coverage.description}
              </p>
              
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Equipo Asignado
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {coverage.assignees.map(uid => {
                    const u = users.find(usr => usr.id === uid);
                    return (
                      <div 
                        key={uid} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          padding: '0.35rem 0.75rem', 
                          borderRadius: 'var(--radius-full)', 
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            backgroundColor: u?.avatarColor,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700
                          }}
                        >
                          {u?.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Program and Format metadata displays */}
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Programas Destino
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {coverage.programs && coverage.programs.length > 0 ? (
                      coverage.programs.map((prog, idx) => (
                        <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          📻 {prog}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Ninguno</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Formatos Logísticos
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {coverage.formats && coverage.formats.length > 0 ? (
                      coverage.formats.map((form, idx) => (
                        <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          ⚙️ {form}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Ninguno</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MULTIMEDIA & SHARED MATERIALS */}
          {activeTab === 'multimedia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Central Shared Material "Material Compartido" */}
              <div className="card" style={{ border: '1.5px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="detail-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                    🔗 Material Compartido (Enlaces Externos)
                  </h3>
                  <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} onClick={() => setShowLinkModal(true)}>
                    <Plus size={14} /> Agregar Link
                  </button>
                </div>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Espacio exclusivo para carpetas en Drive, descargas de TransferNow/WeTransfer u otros recursos compartidos por móviles en la calle.
                </p>

                {coverage.sharedLinks.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    No hay enlaces compartidos todavía.
                  </div>
                ) : (
                  <div className="shared-material-grid">
                    {coverage.sharedLinks.map(link => {
                      const u = users.find(usr => usr.id === link.userId);
                      return (
                        <div key={link.id} className="link-card">
                          <div className="link-card-header">
                            <ExternalLink size={16} color="var(--primary)" style={{ marginTop: '0.15rem' }} />
                            <div>
                              <h4 className="link-title">{link.title}</h4>
                              <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', overflowWrap: 'anywhere' }}>
                                {link.url}
                              </a>
                            </div>
                          </div>
                          {link.comments && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-primary)', padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}>
                              "{link.comments}"
                            </p>
                          )}
                          <div className="link-meta" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Por: {u?.name.split(' ')[0]}</span>
                            <span>{new Date(link.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Uploaded Files section */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="detail-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                    📁 Archivos Cargados
                  </h3>
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} 
                    onClick={() => document.getElementById('real-file-upload-detail')?.click()}
                  >
                    <Plus size={14} /> Cargar Archivo
                  </button>
                  <input 
                    type="file" 
                    id="real-file-upload-detail" 
                    style={{ display: 'none' }} 
                    onChange={handleRealFileUpload} 
                  />
                </div>

                {coverage.multimedia.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Ningún archivo directo cargado en el hub.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                    {coverage.multimedia.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => setPreviewItem(item)}
                        className="hover-card-bg"
                        style={{
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          backgroundColor: 'var(--bg-secondary)',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        {item.type === 'photo' && (
                          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '120px', border: '1px solid var(--border-color)' }}>
                            <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        {item.type === 'video' && (
                          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '120px', border: '1px solid var(--border-color)', backgroundColor: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🎬</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reproducir Video</span>
                          </div>
                        )}
                        {item.type === 'audio' && (
                          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '120px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🎵</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reproducir Audio</span>
                          </div>
                        )}
                        {item.type === 'document' && (
                          <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', gap: '0.25rem' }}>
                            <FileText size={32} color="var(--primary)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Ver Documento (PDF)</span>
                          </div>
                        )}
                        
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                            <span>{item.size}</span>
                            <span>Por: {users.find(usr => usr.id === item.userId)?.name.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: COLLABORATIVE CHAT (Slack-like) */}
          {activeTab === 'chat' && (
            <div className="card">
              <h3 className="detail-section-title">💬 Canales de Comunicación Interna</h3>
              
              <div className="chat-container">
                <div className="chat-messages">
                  {coverage.comments.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Comienza la conversación. Todo el equipo de esta cobertura verá los mensajes.
                    </div>
                  ) : (
                    coverage.comments.map((comment) => {
                      const user = users.find(u => u.id === comment.userId);
                      return (
                        <div key={comment.id} className="message-bubble">
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
                          <div>
                            <div className="message-header">
                              <span className="message-sender">{comment.userName}</span>
                              <span className="message-time">
                                {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                              </span>
                            </div>
                            <div className="message-text">{comment.text}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pre-recorded quick responses for phones */}
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
                      className="hover-card-bg"
                    >
                      {msg}
                    </button>
                  ))}
                </div>

                {/* Chat input box */}
                <form onSubmit={handleSendComment} className="chat-input-wrapper">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Escribe un comentario... Usa @ para mencionar."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: PUBLICATIONS CHECKLIST */}
          {activeTab === 'publications' && (
            <div className="card">
              <h3 className="detail-section-title">📢 Control de Publicación en Redes y Web</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Marca las plataformas donde se ha difundido la noticia. Solo el Portal Web admite ingresar una URL (opcional).
              </p>

              <div className="platform-checklist">
                {(Object.keys(coverage.publications) as Array<keyof PublicationChecklist>).map(plat => {
                  const check = coverage.publications[plat];
                  const isPub = check.status === 'published';
                  const pubUser = users.find(u => u.id === check.userId);
                  
                  return (
                    <div key={plat} className="platform-row">
                      <div className="platform-info">
                        <span className={`badge ${isPub ? 'status-published' : 'status-pending'}`} style={{ fontSize: '0.65rem' }}>
                          {isPub ? 'Publicada' : 'Pendiente'}
                        </span>
                        <span>{platformNames[plat]}</span>
                      </div>

                      <div className="platform-actions">
                        {isPub ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>Por: {pubUser?.name.split(' ')[0]}</span>
                            <span>{new Date(check.date || '').toLocaleDateString()}</span>
                            {plat === 'portal' && check.link && (
                              <a href={check.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontWeight: 600 }}>
                                Enlace <ExternalLink size={12} />
                              </a>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }}
                              onClick={() => handleTogglePlatform(plat)}
                            >
                              Revertir
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleTogglePlatform(plat)}
                          >
                            Marcar Publicada
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: AI COPILOT */}
          {activeTab === 'copilot' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={20} color="var(--primary)" />
                <h3 className="detail-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                  Copiloto IA - Generador de Contenido
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Ingresa la URL de la nota publicada en el portal para simular su lectura y redactar borradores optimizados.
              </p>

              <div className="form-group" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>
                    URL de la Nota (Portal Web) *
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://rafaelanoticias.com/policiales/choque-ruta-34..."
                    style={{ width: '100%' }}
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleExtract}
                  disabled={extractedLoading}
                >
                  {extractedLoading ? 'Extrayendo...' : 'Extraer e Iniciar'}
                </button>
              </div>

              {extractedText && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>
                    Contenido Extraído de la Nota (Simulado)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    style={{ fontSize: '0.8rem', width: '100%', padding: '0.5rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => runAiSimulation('facebook')} disabled={!extractedText}>
                  Copy Facebook
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => runAiSimulation('instagram')} disabled={!extractedText}>
                  Texto Instagram
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => runAiSimulation('reel')} disabled={!extractedText}>
                  Guion Reel/TikTok
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => runAiSimulation('youtube')} disabled={!extractedText}>
                  Descripción YouTube
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => runAiSimulation('titles')} disabled={!extractedText}>
                  5 Variantes Títulos
                </button>
              </div>

              {aiLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <Bot size={28} className="spin" style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>Generando copys con Copiloto IA...</p>
                </div>
              ) : aiOutput ? (
                <div style={{ position: 'relative' }}>
                  <pre style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    maxHeight: '280px',
                    overflowY: 'auto'
                  }}>
                    {aiOutput}
                  </pre>
                  <button 
                    onClick={copyToClipboard}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    <Clipboard size={12} /> Copiar
                  </button>
                </div>
              ) : (
                <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {!extractedText 
                    ? '1. Ingresa la URL y presiona "Extraer e Iniciar" para simular la lectura de la nota.' 
                    : '2. Selecciona una plataforma arriba para redactar los copies promocionales.'
                  }
                </div>
              )}
            </div>
          )}

          {/* TAB: AUDIT LOG HISTORY */}
          {activeTab === 'history' && (
            <div className="card">
              <h3 className="detail-section-title">📋 Registro de Auditoría y Actividad</h3>
              
              <div className="activity-list" style={{ padding: '0.5rem' }}>
                {coverage.activities.map((act) => {
                  return (
                    <div key={act.id} className="activity-item">
                      <div className="activity-circle">✓</div>
                      <div>
                        <span style={{ fontWeight: 700 }}>{act.userName} </span>
                        <span>{act.action}</span>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {new Date(act.timestamp).toLocaleDateString()} a las {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right side pane (Quick Stats Widget) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Resumen de Cobertura
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{coverage.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                <span className={`badge status-${coverage.status}`} style={{ textTransform: 'capitalize' }}>
                  {coverage.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Archivos:</span>
                <span style={{ fontWeight: 600 }}>{coverage.multimedia.length} cargados</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Enlaces:</span>
                <span style={{ fontWeight: 600 }}>{coverage.sharedLinks.length} compartidos</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Auditoría de Redes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              {Object.keys(coverage.publications).map(plat => {
                const isPub = coverage.publications[plat as keyof PublicationChecklist].status === 'published';
                return (
                  <div key={plat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{platformNames[plat as keyof PublicationChecklist]}</span>
                    <span 
                      style={{ 
                        fontWeight: 700, 
                        color: isPub ? 'var(--success)' : 'var(--text-muted)' 
                      }}
                    >
                      {isPub ? '✓ PUBLICADO' : '⚪ Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Link Creation Modal */}
      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Enlace Compartido</h3>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddLinkSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título del Enlace</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Fotos en alta - Google Drive"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL (Enlace Web)</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    placeholder="https://drive.google.com/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Comentarios (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contraseña del WeTransfer, indicaciones..."
                    value={linkComment}
                    onChange={(e) => setLinkComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct File Creation Modal */}
      {showFileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Simular Carga de Archivo</h3>
              <button className="modal-close" onClick={() => setShowFileModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddFileSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Archivo</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. entrevista_intendente.mp3"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Archivo</label>
                  <select 
                    className="form-select"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                  >
                    <option value="photo">Imagen (JPEG/PNG)</option>
                    <option value="video">Video (MP4/MOV)</option>
                    <option value="audio">Audio (MP3/WAV)</option>
                    <option value="document">Documento (PDF/Word)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFileModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cargar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publication URL Input Modal */}
      {publishingPlatform && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Publicación en {platformNames[publishingPlatform]}</h3>
              <button className="modal-close" onClick={() => setPublishingPlatform(null)}>✕</button>
            </div>
            <form onSubmit={handlePublishSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Por favor introduce el enlace de la publicación en vivo para auditar los resultados.
                </p>
                <div className="form-group">
                  <label className="form-label">URL de la Publicación</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    placeholder="https://facebook.com/posts/..."
                    value={publishLink}
                    onChange={(e) => setPublishLink(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPublishingPlatform(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Publicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coverage Details Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Planificación de Cobertura</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCoverageDetails}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción / Pauta *</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows={3}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-input"
                      value={editDateTime}
                      onChange={e => setEditDateTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ubicación</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editLocation}
                      onChange={e => setEditLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado de la Cobertura</label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_coverage">En Cobertura</option>
                    <option value="in_redaction">En Redacción</option>
                    <option value="ready_to_publish">Lista para Publicar</option>
                    <option value="published">Publicada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Programas Destino</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {PROGRAM_OPTIONS.map(prog => {
                      const selected = editPrograms.includes(prog);
                      return (
                        <button
                          key={prog}
                          type="button"
                          className="btn"
                          onClick={() => toggleEditProgram(prog)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-color)',
                            background: selected ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: selected ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {prog}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Formatos Logísticos</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {FORMAT_OPTIONS.map(form => {
                      const selected = editFormats.includes(form);
                      return (
                        <button
                          key={form}
                          type="button"
                          className="btn"
                          onClick={() => toggleEditFormat(form)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-color)',
                            background: selected ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: selected ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {form}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Equipo Asignado</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                    {users.map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editAssignees.includes(u.id)}
                          onChange={() => handleEditAssigneeToggle(u.id)}
                        />
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: u.avatarColor }}></span>
                        {u.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Planificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Media Preview Modal */}
      {previewItem && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 120 }} onClick={() => setPreviewItem(null)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Previsualización: {previewItem.name}
              </h3>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              {previewItem.type === 'photo' && (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.name} 
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
                />
              )}
              {previewItem.type === 'video' && (
                <video 
                  src={previewItem.url} 
                  controls 
                  autoPlay 
                  style={{ width: '100%', maxHeight: '70vh', backgroundColor: '#000' }} 
                />
              )}
              {previewItem.type === 'audio' && (
                <div style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: '#1f2937', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '2.5rem' }}>🎵</span>
                  <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{previewItem.name}</span>
                  <audio src={previewItem.url} controls autoPlay style={{ width: '90%' }} />
                </div>
              )}
              {previewItem.type === 'document' && (
                <div style={{ width: '100%', height: '500px', backgroundColor: '#fff', color: '#333', padding: '2rem', overflowY: 'auto', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Rafaela Noticias - Gacetilla de Prensa</h4>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Tamaño: {previewItem.size}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>
                    [Vista previa del documento en pantalla completa]
                  </p>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {coverage.description || "Contenido de la gacetilla o reporte adjunto."}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tamaño del archivo: {previewItem.size}</span>
              <button className="btn btn-secondary" onClick={() => setPreviewItem(null)}>
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
