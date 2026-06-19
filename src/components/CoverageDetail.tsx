import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  ArrowLeft, Calendar, MapPin, Send, ExternalLink, 
  Image, FileText, Check, Bot, History, Sparkles, MessageSquare, Clipboard,
  MessageCircle, Edit3
} from 'lucide-react';
import type { Coverage, FormatType, PublicationChecklist } from '../types';

import { formatFriendlyDate } from '../utils/dateUtils';
import { MultimediaManager } from './MultimediaManager';

interface CoverageDetailProps {
  coverageId: string;
  onBack: () => void;
}

export const CoverageDetail: React.FC<CoverageDetailProps> = ({ coverageId, onBack }) => {
  const { 
    coverages, users, updateCoverageStatus, 
    addCommentToCoverage, addMultimediaToCoverage, 
    updatePublicationStatus, currentUser, updateCoverageDetails,
    events, updateEvent, recreateCoverageForEvent
  } = useHub();

  const [activeTab, setActiveTab] = useState<'general' | 'multimedia' | 'chat' | 'publications' | 'copilot' | 'history'>('general');
  const [chatMessage, setChatMessage] = useState('');
  
  // Modals state
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');

  // AI states
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const coverage = coverages.find(c => c.id === coverageId);

  // Edit coverage state
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; type: 'photo' | 'video' | 'audio' | 'document'; size: string } | null>(null);

  // Redesigned Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<Coverage['status']>('pending_confirmation');
  const [editMainResponsable, setEditMainResponsable] = useState('');
  const [editAssigneesList, setEditAssigneesList] = useState<string[]>([]);
  const [editFormats, setEditFormats] = useState<FormatType[]>([]);
  const [editLogisticsInfo, setEditLogisticsInfo] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [editAttachmentInput, setEditAttachmentInput] = useState('');

  const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo redes'];

  const startEditingCoverage = () => {
    if (coverage) {
      setEditTitle(coverage.title);
      const [datePart, timePart] = (coverage.dateTime || '').split('T');
      setEditDate(datePart || '');
      setEditTime(timePart?.substring(0, 5) || '');
      setEditLocation(coverage.location);
      setEditStatus(coverage.status);
      setEditMainResponsable(coverage.assignees.length > 0 ? coverage.assignees[0] : '');
      setEditAssigneesList(coverage.assignees.slice(1));
      setEditFormats(coverage.formats || []);
      setEditLogisticsInfo(coverage.logisticsInfo || '');
      setEditObservations(coverage.observations || '');
      setEditAttachments(coverage.attachments || []);
      setEditAttachmentInput('');
      setShowEditModal(true);
    }
  };

  const addEditAttachment = () => {
    if (editAttachmentInput.trim()) {
      setEditAttachments(prev => [...prev, editAttachmentInput.trim()]);
      setEditAttachmentInput('');
    }
  };

  const handleSaveCoverageDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverage) return;

    const finalAssignees: string[] = [];
    if (editMainResponsable) {
      finalAssignees.push(editMainResponsable);
    }
    editAssigneesList.forEach(uid => {
      if (!finalAssignees.includes(uid)) {
        finalAssignees.push(uid);
      }
    });
    // If no assignees were specified, keep the current ones
    const resolvedAssignees = finalAssignees.length > 0 ? finalAssignees : coverage.assignees;

    // Use existing coverage datetime as fallback if fields were left untouched/empty
    const existingDate = (coverage.dateTime || '').split('T')[0] || '';
    const existingTime = (coverage.dateTime || '').split('T')[1]?.substring(0, 5) || '';
    const resolvedDate = editDate || existingDate;
    const resolvedTime = editTime || existingTime;
    const combinedDateTime = resolvedDate && resolvedTime
      ? `${resolvedDate}T${resolvedTime}`
      : coverage.dateTime || '';

    updateCoverageDetails(
      coverage.id,
      editTitle || coverage.title,
      editObservations || coverage.description || editTitle || coverage.title,
      combinedDateTime,
      editLocation || coverage.location,
      resolvedAssignees,
      coverage.programs || [],
      editFormats,
      editStatus,
      editLogisticsInfo,
      editObservations,
      editAttachments
    );
    setShowEditModal(false);
  };

  // Diagnostic states
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventEditTitle, setEventEditTitle] = useState('');
  const [eventEditStart, setEventEditStart] = useState('');
  const [eventEditEnd, setEventEditEnd] = useState('');
  const [eventEditLocation, setEventEditLocation] = useState('');
  const [eventEditAssigneeId, setEventEditAssigneeId] = useState('');

  // New V2 states
  const [portalUrl, setPortalUrl] = useState(coverage?.publications.portal.link || '');
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

  const handleTogglePlatform = (plat: keyof PublicationChecklist) => {
    const check = coverage.publications[plat];
    const isPub = check.status === 'published';
    if (isPub) {
      updatePublicationStatus(coverage.id, plat, 'pending');
    } else {
      updatePublicationStatus(coverage.id, plat, 'published');
    }
  };

  const handlePortalPublish = (e: React.FormEvent) => {
    e.preventDefault();
    updatePublicationStatus(coverage.id, 'portal', 'published', portalInputUrl);
    setPortalInputUrl('');
  };

  const handleSendComment = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || chatMessage;
    if (!text.trim()) return;

    addCommentToCoverage(coverage.id, text);
    if (!textOverride) setChatMessage('');
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
    instagram: 'Instagram',
    youtube: 'YouTube'
  };

  const PUBLICATION_PLATFORMS: (keyof PublicationChecklist)[] = ['portal', 'facebook', 'instagram', 'youtube'];

  const presetMessages = [
    '⚠️ ¡Estoy en camino al lugar!',
    '📍 Llegué a la locación. Iniciando cobertura.',
    '📸 Fotos cargadas al Drive del Hub.',
    '📝 Entrevista completada. Volviendo a la redacción.',
    '✅ Nota subida y lista para publicar.'
  ];

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
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0', color: 'var(--text-primary)', lineHeight: 1.2 }}>{coverage.title}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)', background: 'rgba(37, 211, 102, 0.05)', padding: '0.5rem 1rem' }}
              onClick={handleShareWhatsApp}
            >
              <MessageCircle size={14} /> Compartir
            </button>
            {(currentUser?.role === 'admin') && (
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
            {formatFriendlyDate(coverage.dateTime)} - {new Date(coverage.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} /> {coverage.location}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <select 
            className="form-select" 
            style={{ padding: '0.35rem 0.5rem', fontWeight: 600, width: 'auto' }}
            value={coverage.status}
            onChange={handleStatusChange}
          >
            <option value="pending_confirmation">Pendiente de confirmación</option>
            <option value="confirmed">Confirmada</option>
            <option value="in_redaction">En Redacción</option>
            <option value="published">Publicada</option>
          </select>
        </div>

        {coverage.assignees.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {coverage.assignees.map(uid => {
              const u = users.find(usr => usr.id === uid);
              return (
                <div 
                  key={uid} 
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
                      backgroundColor: u?.avatarColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
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
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {coverage.programs && coverage.programs.map((prog, idx) => (
            <span key={idx} style={{ fontSize: '0.73rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
              📻 {prog}
            </span>
          ))}
          {coverage.formats && coverage.formats.map((form, idx) => (
            <span key={idx} style={{ fontSize: '0.73rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
              ⚙️ {form}
            </span>
          ))}
        </div>
      </div>

      <div className="coverage-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeTab === 'general' && (
            <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 className="detail-section-title" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', border: 'none', margin: 0, paddingBottom: '0.5rem' }}>Pauta / Información General</h3>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {coverage.description}
                </div>
              </div>

              {coverage.logisticsInfo && (
                <div>
                  <h3 className="detail-section-title" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', border: 'none', margin: 0, paddingBottom: '0.5rem' }}>Información Logística</h3>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {coverage.logisticsInfo}
                  </div>
                </div>
              )}

              {coverage.observations && (
                <div>
                  <h3 className="detail-section-title" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', border: 'none', margin: 0, paddingBottom: '0.5rem' }}>Observaciones</h3>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {coverage.observations}
                  </div>
                </div>
              )}

              {coverage.attachments && coverage.attachments.length > 0 && (
                <div>
                  <h3 className="detail-section-title" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', border: 'none', margin: 0, paddingBottom: '0.5rem' }}>Adjuntos</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {coverage.attachments.map((att, idx) => {
                      const isUrl = att.startsWith('http://') || att.startsWith('https://');
                      return (
                        <div key={idx} style={{ fontSize: '0.9rem' }}>
                          {isUrl ? (
                            <a href={att} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                              📎 {att} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>📎 {att}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'multimedia' && (
            <div className="card">
              <h3 className="detail-section-title">📦 Gestor Multimedia y Archivos</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Sube fotos, videos, audios o documentos a esta actividad, o vincula enlaces externos y carpetas de Google Drive.
              </p>
              <MultimediaManager coverage={coverage} />
            </div>
          )}

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

          {activeTab === 'publications' && (
            <div className="card">
              <h3 className="detail-section-title">📢 Control de Publicación en Redes y Web</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Marca las plataformas donde se ha difundido la noticia. El Portal Web permite registrar una URL de la nota publicada.
              </p>

              <div className="platform-checklist">
                {PUBLICATION_PLATFORMS.map(plat => {
                  const check = coverage.publications[plat];
                  if (!check) return null;
                  const isPub = check.status === 'published';
                  const pubUser = users.find(u => u.id === check.userId);
                  
                  return (
                    <div key={plat} className="platform-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
                              <span>{formatFriendlyDate(check.date || '')}</span>
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
                            plat === 'portal' ? null : (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleTogglePlatform(plat)}
                              >
                                Marcar Publicada
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {plat === 'portal' && !isPub && (
                        <form onSubmit={handlePortalPublish} style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://rafaelanoticias.com/nota/..."
                            value={portalInputUrl}
                            onChange={e => setPortalInputUrl(e.target.value)}
                            style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          />
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            Publicar en Portal
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                          {formatFriendlyDate(act.timestamp)} a las {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

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

      {/* Edit Coverage Details Modal */}
      {showEditModal && coverage && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '950px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Planificación de Cobertura</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCoverageDetails}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="coverage-create-grid">
                  
                  {/* Left Column - Core Data */}
                  <div className="coverage-create-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Título de la Cobertura</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. Sesión en el Concejo Deliberante por el presupuesto."
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fecha</label>
                        <input
                          type="date"
                          className="form-input"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hora</label>
                        <input
                          type="time"
                          className="form-input"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ubicación</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. Bv. Santa Fe 300, Rafaela"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estado</label>
                      <select
                        className="form-select"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        style={{ padding: '0.5rem', fontWeight: 600 }}
                      >
                        <option value="pending_confirmation">Pendiente de confirmación</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="in_redaction">En Redacción</option>
                        <option value="published">Publicada</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Formato</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                        {FORMAT_OPTIONS.map(form => {
                          const isSelected = editFormats.includes(form);
                          return (
                            <button
                              key={form}
                              type="button"
                              className="btn"
                              onClick={() => {
                                setEditFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
                              }}
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                background: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                              }}
                            >
                              {form}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Team & Logistics */}
                  <div className="coverage-create-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Responsable Principal</label>
                      <select
                        className="form-select"
                        value={editMainResponsable}
                        onChange={e => setEditMainResponsable(e.target.value)}
                      >
                        <option value="">Sin responsable principal</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Equipo Asignado</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        {editAssigneesList.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Ningún integrante asignado al equipo</span>
                        ) : (
                          editAssigneesList.map(uid => {
                            const u = users.find(usr => usr.id === uid);
                            if (!u) return null;
                            return (
                              <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: u.avatarColor }} />
                                <span>{u.name.split(' ')[0]}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setEditAssigneesList(prev => prev.filter(id => id !== uid))} 
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0 0.1rem' }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <select
                        className="form-select"
                        value=""
                        onChange={e => {
                          const uid = e.target.value;
                          if (uid && !editAssigneesList.includes(uid)) {
                            setEditAssigneesList(prev => [...prev, uid]);
                          }
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                      >
                        <option value="">+ Agregar integrante...</option>
                        {users
                          .filter(u => u.id !== editMainResponsable && !editAssigneesList.includes(u.id))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Información Logística</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Direcciones secundarias, accesos, teléfonos de contacto, transporte..."
                        value={editLogisticsInfo}
                        onChange={(e) => setEditLogisticsInfo(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Observaciones</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Comentarios adicionales, enfoques sugeridos..."
                        value={editObservations}
                        onChange={(e) => setEditObservations(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Adjuntos (Enlaces / Archivos)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.4rem' }}>
                        {editAttachments.map((att, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', color: 'var(--text-secondary)' }}>📎 {att}</span>
                            <button 
                              type="button" 
                              onClick={() => setEditAttachments(prev => prev.filter((_, i) => i !== idx))} 
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.8rem' }}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej: https://drive.google.com/... o gacetilla.pdf" 
                          style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          value={editAttachmentInput}
                          onChange={e => setEditAttachmentInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addEditAttachment();
                            }
                          }}
                        />
                        <button type="button" onClick={addEditAttachment} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
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
