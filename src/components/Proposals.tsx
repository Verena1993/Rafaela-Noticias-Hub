import React, { useState, useRef } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  MapPin, 
  X, 
  Paperclip, 
  Send, 
  AlertCircle,
  Trash2,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  FolderOpen
} from 'lucide-react';
import type { Proposal, ProgramType, FormatType, Coverage } from '../data/mockData';
import { formatFriendlyDate } from '../utils/dateUtils';

export const Proposals: React.FC = () => {
  const { 
    currentUser, 
    users, 
    proposals, 
    addProposal, 
    updateProposalStatus, 
    addCommentToProposal, 
    convertProposalToCoverage,
    searchQuery,
    updateProposalDetails
  } = useHub();

  const [activeTab, setActiveTab] = useState<'proposals' | 'whatsapp'>('proposals');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [proposalFilter, setProposalFilter] = useState<'all' | 'new' | 'in_evaluation' | 'approved' | 'rejected' | 'covered'>('all');

  // Media Preview State
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; type: 'photo' | 'video' | 'audio' | 'document'; size: string } | null>(null);

  // Edit Proposal states
  const [showEditProposalModal, setShowEditProposalModal] = useState(false);
  const [editProposalTitle, setEditProposalTitle] = useState('');
  const [editProposalDescription, setEditProposalDescription] = useState('');
  const [editProposalDateTime, setEditProposalDateTime] = useState('');
  const [editProposalLocation, setEditProposalLocation] = useState('');
  const [editProposalAssignees, setEditProposalAssignees] = useState<string[]>([]);
  const [editProposalPrograms, setEditProposalPrograms] = useState<ProgramType[]>([]);
  const [editProposalFormats, setEditProposalFormats] = useState<FormatType[]>([]);

  // Convert Proposal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDateTime, setConvertDateTime] = useState('');
  const [convertLocation, setConvertLocation] = useState('');
  const [convertAssigneeId, setConvertAssigneeId] = useState('');
  const [convertStatus, setConvertStatus] = useState<Coverage['status']>('pending_confirmation');
  const [convertPrograms, setConvertPrograms] = useState<ProgramType[]>([]);
  const [convertFormats, setConvertFormats] = useState<FormatType[]>([]);

  const startConversion = () => {
    if (selectedProposal) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fallback = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setConvertDateTime(selectedProposal.dateTime || fallback);
      setConvertLocation(selectedProposal.location || '');
      setConvertAssigneeId(selectedProposal.assignees.length > 0 ? selectedProposal.assignees[0] : '');
      setConvertStatus('pending_confirmation');
      setConvertPrograms(selectedProposal.programs || []);
      setConvertFormats(selectedProposal.formats || []);
      setShowConvertModal(true);
    }
  };

  const handleEditProposalAssigneeToggle = (userId: string) => {
    setEditProposalAssignees(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };
  const toggleEditProposalProgram = (prog: ProgramType) => {
    setEditProposalPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };
  const toggleEditProposalFormat = (form: FormatType) => {
    setEditProposalFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };

  const handleSaveProposalDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    updateProposalDetails(
      selectedProposal.id,
      editProposalTitle,
      editProposalDescription,
      editProposalDateTime || undefined,
      editProposalLocation || undefined,
      editProposalAssignees,
      editProposalPrograms,
      editProposalFormats
    );
    // Update local modal data
    setSelectedProposal(prev => prev ? {
      ...prev,
      title: editProposalTitle,
      description: editProposalDescription,
      dateTime: editProposalDateTime || undefined,
      location: editProposalLocation || undefined,
      assignees: editProposalAssignees,
      programs: editProposalPrograms,
      formats: editProposalFormats
    } : null);
    setShowEditProposalModal(false);
  };

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');

  const [assignees, setAssignees] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [proposalPrograms, setProposalPrograms] = useState<ProgramType[]>([]);
  const [proposalFormats, setProposalFormats] = useState<FormatType[]>([]);

  const PROGRAM_OPTIONS: ProgramType[] = ['Bien Despiertos', 'Noticiero Mañana', 'Noticiero Tarde', 'Digital'];
  const FORMAT_OPTIONS: FormatType[] = ['Telefónica', 'Videollamada', 'Presencial', 'Móvil', 'Grabada', 'Vivo en redes'];

  const toggleProposalProgram = (prog: ProgramType) => {
    setProposalPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
  };
  const toggleProposalFormat = (form: FormatType) => {
    setProposalFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
  };
  
  // Dynamic links & files in form
  const [formLinks, setFormLinks] = useState<{ title: string; url: string; comments?: string }[]>([]);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  const [formFiles, setFormFiles] = useState<{ name: string; type: 'photo' | 'video' | 'audio' | 'document'; url: string; size: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp simulation states
  const [mockWhatsAppMessages, setMockWhatsAppMessages] = useState([
    {
      id: 'wa1',
      sender: '+54 3492 65-4321 (Vecino Bº Italia)',
      text: 'Hola Rafaela Noticias, quería denunciar que en calle Joaquín V. González al 1200 hay un basural a cielo abierto gigante que junta ratas de noche. Les mando fotos.',
      timestamp: new Date().toISOString(),
      used: false,
      media: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'wa2',
      sender: 'Prensa Municipalidad de Rafaela',
      text: 'Gacetilla de Prensa: Se viene la Maratón Solidaria ALPI 2026 este domingo desde Plaza 25 de Mayo. Adjuntamos bases del evento y flyer.',
      timestamp: '2026-06-03T15:45:00',
      used: true,
      media: 'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'wa3',
      sender: '+54 3492 98-7654 (Laura Vecina)',
      text: 'Hola gente! Hay un bache gigante en Bv. Lehmann y Oroño, casi se mata una moto recién. Ojalá lo puedan publicar para que lo arreglen.',
      timestamp: new Date().toISOString(),
      used: false,
      media: ''
    }
  ]);

  // Handle file uploads in creation form
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        const fileUrl = event.target?.result as string || URL.createObjectURL(file);
        
        let type: 'photo' | 'video' | 'audio' | 'document' = 'document';
        if (file.type.startsWith('image/')) type = 'photo';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        setFormFiles(prev => [...prev, {
          name: file.name,
          type,
          url: fileUrl,
          size: sizeInMb
        }]);
      };

      reader.readAsDataURL(file);
    }
  };

  const addLinkToForm = () => {
    if (!linkTitle || !linkUrl) return;
    setFormLinks(prev => [...prev, { title: linkTitle, url: linkUrl, comments: linkNotes }]);
    setLinkTitle('');
    setLinkUrl('');
    setLinkNotes('');
  };

  const removeLinkForm = (index: number) => {
    setFormLinks(prev => prev.filter((_, i) => i !== index));
  };

  const removeFileForm = (index: number) => {
    setFormFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addProposal(
      title,
      description,
      dateTime || undefined,
      location || undefined,
      assignees,
      formFiles,
      formLinks,
      proposalPrograms,
      proposalFormats
    );

    // Reset Form
    setTitle('');
    setDescription('');
    setDateTime('');
    setLocation('');
    setAssignees([]);
    setFormLinks([]);
    setFormFiles([]);
    setProposalPrograms([]);
    setProposalFormats([]);
    setShowAddModal(false);
  };

  const handleCreateFromWhatsApp = (msg: typeof mockWhatsAppMessages[0]) => {
    setTitle(`[Reporte WA] Basural o denuncia de vecina`);
    if (msg.text.toLowerCase().includes('maratón')) {
      setTitle('Maratón Solidaria ALPI 2026');
    } else if (msg.text.toLowerCase().includes('bache')) {
      setTitle('Bache peligroso en Bv. Lehmann y Oroño');
    } else if (msg.text.toLowerCase().includes('basural')) {
      setTitle('Denuncia: Basural clandestino crónico en Barrio Italia');
    }

    setDescription(msg.text);
    setLocation(msg.text.includes('Lehmann') ? 'Bv. Lehmann y Oroño, Rafaela' : msg.text.includes('Joaquín') ? 'Joaquín V. González al 1200, Barrio Italia' : 'Rafaela');
    
    if (msg.media) {
      setFormFiles([{
        name: 'flyer_adjunto_whatsapp.jpg',
        type: 'photo',
        url: msg.media,
        size: '1.2 MB'
      }]);
    }

    // Mark as used
    setMockWhatsAppMessages(prev => prev.map(m => m.id === msg.id ? { ...m, used: true } : m));
    setShowAddModal(true);
    setActiveTab('proposals');
  };

  const handleAssigneeToggle = (userId: string) => {
    setAssignees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedProposal) return;
    addCommentToProposal(selectedProposal.id, newComment);
    
    // Update local modal instance comments
    const updatedProposal = proposals.find(p => p.id === selectedProposal.id);
    if (updatedProposal) {
      setSelectedProposal({
        ...selectedProposal,
        comments: [
          ...selectedProposal.comments, 
          {
            id: `com_${Date.now()}`,
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Sistema',
            text: newComment,
            timestamp: new Date().toISOString()
          }
        ]
      });
    }
    setNewComment('');
  };

  const getStatusBadge = (status: Proposal['status']) => {
    const config: Record<Proposal['status'], { label: string; className: string }> = {
      new: { label: 'Nueva', className: 'status-pending' },
      in_evaluation: { label: 'En Evaluación', className: 'status-in_coverage' },
      approved: { label: 'Aprobada', className: 'status-ready_to_publish' },
      rejected: { label: 'Rechazada', className: 'priority-high' },
      assigned: { label: 'Asignada', className: 'status-in_redaction' },
      covered: { label: 'En Cobertura', className: 'status-published' }
    };
    const c = config[status];
    return <span className={`badge ${c.className}`}>{c.label}</span>;
  };

  // Filtered proposals list
  const filteredProposals = proposals.filter(p => {
    const matchesSearch = searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesStatus = proposalFilter === 'all' || p.status === proposalFilter;

    return matchesSearch && matchesStatus;
  });

  // Check if editor/admin (visual roles are hidden, but functional checks persist)
  const isEditorOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  return (
    <div className="proposals-module">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Módulo de Propuestas</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Ideas de notas, gacetillas de prensa, denuncias de vecinos y material en evaluación.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Section Selector */}
          <div style={{
            display: 'flex', 
            backgroundColor: 'var(--bg-tertiary)', 
            padding: '0.2rem', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <button 
              onClick={() => setActiveTab('proposals')} 
              className={`btn`}
              style={{
                background: activeTab === 'proposals' ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: activeTab === 'proposals' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Bandeja de Entrada
            </button>
            <button 
              onClick={() => setActiveTab('whatsapp')} 
              className={`btn`}
              style={{
                background: activeTab === 'whatsapp' ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: activeTab === 'whatsapp' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <MessageCircle size={14} style={{ color: '#25D366' }} /> WhatsApp API
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Nueva Propuesta
          </button>
        </div>
      </div>

      {activeTab === 'proposals' ? (
        <>
          {/* Filter Toolbar */}
          <div className="card" style={{ padding: '0.5rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Estado:</span>
            {(['all', 'new', 'in_evaluation', 'approved', 'rejected', 'covered'] as const).map(f => {
              const labelMap: Record<typeof f, string> = {
                all: 'Todas',
                new: 'Nuevas',
                in_evaluation: 'En Evaluación',
                approved: 'Aprobadas',
                rejected: 'Rechazadas',
                covered: 'Cubiertas (Cobertura)'
              };
              const isSelected = proposalFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setProposalFilter(f)}
                  className="btn"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-primary)',
                    color: isSelected ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {labelMap[f]}
                </button>
              );
            })}
          </div>

          {/* Proposals List Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredProposals.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 0.75rem' }} />
                <p>No se encontraron propuestas con los filtros aplicados.</p>
              </div>
            ) : (
              filteredProposals.map(prop => (
                <div 
                  key={prop.id} 
                  className="card clickable-card" 
                  onClick={() => setSelectedProposal(prop)}
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    borderLeft: '4px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      {getStatusBadge(prop.status)}
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{prop.title}</h3>
                    
                    {/* Program/Format tags */}
                    {((prop.programs && prop.programs.length > 0) || (prop.formats && prop.formats.length > 0)) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                        {prop.programs?.map((prog, idx) => (
                          <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                            📻 {prog}
                          </span>
                        ))}
                        {prop.formats?.map((form, idx) => (
                          <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                            ⚙️ {form}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.75rem' }}>
                      {prop.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {prop.dateTime && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CalendarIcon size={12} /> {prop.dateTime ? formatFriendlyDate(prop.dateTime) : 'Sin fecha'}
                        </span>
                      )}
                      {prop.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin size={12} /> {prop.location.split(',')[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {prop.multimedia.length > 0 && <span title="Archivos adjuntos">📎 {prop.multimedia.length}</span>}
                      {prop.comments.length > 0 && <span title="Comentarios">💬 {prop.comments.length}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* WhatsApp Business API Sim Page */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          <div>
            <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#e5ddd5', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', padding: '1.5rem', borderRadius: 'var(--radius-lg)', height: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', alignSelf: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                🔒 Integración WhatsApp Business API - Entrada de Gacetillas y Alertas
              </div>

              {mockWhatsAppMessages.map(msg => (
                <div 
                  key={msg.id} 
                  style={{ 
                    alignSelf: 'flex-start',
                    backgroundColor: 'white', 
                    maxWidth: '85%', 
                    padding: '0.75rem', 
                    borderRadius: '0 8px 8px 8px', 
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#075E54', marginBottom: '0.25rem' }}>
                    {msg.sender}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>
                  {msg.media && (
                    <div style={{ marginBottom: '0.5rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img src={msg.media} alt="Multimedia adjunto" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</span>
                    {msg.used ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Propuesta creada ✓</span>
                    ) : (
                      <button 
                        onClick={() => handleCreateFromWhatsApp(msg)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: '#075E54', borderColor: '#075E54', background: '#e1ffc7' }}
                      >
                        Crear Propuesta de Nota
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card" style={{ height: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#25D366' }}>
                  <MessageCircle size={20} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>WhatsApp Webhook</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  Este panel simula la bandeja de entrada de WhatsApp conectada al sistema del Rafaela Noticias Hub. 
                </p>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>¿Cómo funciona?</div>
                  <div>1. Los vecinos y entes de prensa envían gacetillas o denuncias al número oficial de la redacción.</div>
                  <div>2. El bot pre-procesa el texto y lo muestra aquí en tiempo real.</div>
                  <div>3. Al presionar <b>"Crear Propuesta de Nota"</b> el sistema extrae automáticamente la información y los archivos y abre la ventana para crear la propuesta en el Hub.</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Conexión segura establecida con WhatsApp Business API Cloud.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedProposal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setSelectedProposal(null)}>
          <div className="modal-content proposal-detail-pane" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="proposal-detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="proposal-tag">Propuesta de Nota</span>
                {getStatusBadge(selectedProposal.status)}
              </div>
              <button className="proposal-detail-close" onClick={() => setSelectedProposal(null)}><X size={20} /></button>
            </div>

            <div className="proposal-detail-body-grid">
              {/* Main Column */}
              <div className="proposal-detail-main">
                <h1 className="proposal-detail-title">{selectedProposal.title}</h1>
                
                <div className="proposal-detail-metadata-bar">
                  {selectedProposal.dateTime && (
                    <div className="meta-item">
                      <CalendarIcon size={14} />
                      <span>{new Date(selectedProposal.dateTime).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} hs</span>
                    </div>
                  )}
                  {selectedProposal.location && (
                    <div className="meta-item">
                      <MapPin size={14} />
                      <span>{selectedProposal.location}</span>
                    </div>
                  )}
                </div>

                <div className="proposal-section-spacer" />

                <div className="proposal-detail-content-section">
                  <h4 className="section-label">Borrador / Descripción de la Propuesta</h4>
                  <div className="proposal-description-box">
                    {selectedProposal.description}
                  </div>
                </div>

                <div className="proposal-section-spacer" />

                {/* Programs & Formats tags */}
                {((selectedProposal.programs && selectedProposal.programs.length > 0) || (selectedProposal.formats && selectedProposal.formats.length > 0)) && (
                  <div className="proposal-detail-tags-section">
                    <h4 className="section-label">Planificación Inicial</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedProposal.programs?.map((prog, idx) => (
                        <span key={idx} className="tag-program">
                          📻 {prog}
                        </span>
                      ))}
                      {selectedProposal.formats?.map((form, idx) => (
                        <span key={idx} className="tag-format">
                          ⚙️ {form}
                        </span>
                      ))}
                    </div>
                    <div className="proposal-section-spacer" />
                  </div>
                )}

                {/* Multimedia Attachments */}
                <div className="proposal-attachments-section">
                  <h4 className="section-label">📎 Material Adjunto ({selectedProposal.multimedia.length})</h4>
                  {selectedProposal.multimedia.length === 0 ? (
                    <p className="no-attachments">Sin archivos adjuntos.</p>
                  ) : (
                    <div className="proposal-attachments-grid">
                      {selectedProposal.multimedia.map(item => (
                        <div 
                          key={item.id} 
                          className="proposal-attachment-card"
                          onClick={() => setPreviewItem(item)}
                        >
                          <div className="card-preview-area">
                            {item.type === 'photo' && (
                              <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            {item.type === 'video' && (
                              <div className="media-placeholder type-video">🎬 Video</div>
                            )}
                            {item.type === 'audio' && (
                              <div className="media-placeholder type-audio">🎵 Audio</div>
                            )}
                            {item.type === 'document' && (
                              <div className="media-placeholder type-doc">📄 PDF</div>
                            )}
                          </div>
                          <div className="card-info-area">
                            <span className="attachment-name" title={item.name}>{item.name}</span>
                            <span className="attachment-size">{item.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="proposal-section-spacer" />

                {/* Shared Links */}
                <div className="proposal-links-section">
                  <h4 className="section-label">🔗 Enlaces Externos Compartidos ({selectedProposal.sharedLinks.length})</h4>
                  {selectedProposal.sharedLinks.length === 0 ? (
                    <p className="no-attachments">Sin enlaces externos.</p>
                  ) : (
                    <div className="proposal-links-list">
                      {selectedProposal.sharedLinks.map(link => (
                        <a 
                          key={link.id} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="proposal-link-item"
                        >
                          <FolderOpen size={16} />
                          <span className="link-title-text">{link.title}</span>
                          <ExternalLink size={12} className="link-arrow" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="proposal-section-spacer" />

                {/* Comments / Discussion Chat */}
                <div className="proposal-comments-section">
                  <h4 className="section-label">💬 Discusión Editorial ({selectedProposal.comments.length})</h4>
                  <div className="proposal-comments-box">
                    {selectedProposal.comments.length === 0 ? (
                      <p className="no-comments">No hay comentarios aún. Deja una opinión para definir la nota.</p>
                    ) : (
                      selectedProposal.comments.map(c => (
                        <div key={c.id} className="proposal-comment-bubble">
                          <div className="comment-meta">
                            <span className="comment-author">{c.userName}</span>
                            <span className="comment-time">
                              {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                            </span>
                          </div>
                          <div className="comment-body">{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="proposal-comment-form">
                    <input 
                      type="text" 
                      placeholder="Escribe un comentario..." 
                      className="form-control" 
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary"><Send size={14} /></button>
                  </form>
                </div>
              </div>

              {/* Sidebar Action Panel */}
              <div className="proposal-detail-sidebar">
                <div className="sidebar-group">
                  <h4 className="sidebar-group-title">Asignados</h4>
                  <div className="sidebar-assignees-list">
                    {selectedProposal.assignees.length === 0 ? (
                      <span className="no-assignees">Ninguno asignado</span>
                    ) : (
                      selectedProposal.assignees.map(uid => {
                        const u = users.find(user => user.id === uid);
                        if (!u) return null;
                        return (
                          <div key={uid} className="sidebar-assignee-item">
                            <div className="avatar-mini" style={{ backgroundColor: u.avatarColor }}>
                              {u.name.charAt(0)}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {isEditorOrAdmin && (
                  <div className="sidebar-group actions-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 className="sidebar-group-title">Acciones Editoriales</h4>
                    
                    <button 
                      onClick={() => {
                        setEditProposalTitle(selectedProposal.title);
                        setEditProposalDescription(selectedProposal.description);
                        setEditProposalDateTime(selectedProposal.dateTime || '');
                        setEditProposalLocation(selectedProposal.location || '');
                        setEditProposalAssignees(selectedProposal.assignees);
                        setEditProposalPrograms(selectedProposal.programs || []);
                        setEditProposalFormats(selectedProposal.formats || []);
                        setShowEditProposalModal(true);
                      }}
                      className="btn btn-secondary" 
                      style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', marginBottom: '0.25rem' }}
                    >
                      Editar Detalles
                    </button>

                    {selectedProposal.status !== 'approved' && selectedProposal.status !== 'covered' && (
                      <button 
                        onClick={() => {
                          updateProposalStatus(selectedProposal.id, 'approved');
                          setSelectedProposal(prev => prev ? { ...prev, status: 'approved' } : null);
                        }}
                        className="btn btn-success" 
                        style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', backgroundColor: 'var(--success)', color: 'white', border: 'none' }}
                      >
                        Aprobar Propuesta
                      </button>
                    )}

                    {selectedProposal.status !== 'rejected' && selectedProposal.status !== 'covered' && (
                      <button 
                        onClick={() => {
                          if (confirm('¿Seguro que deseas rechazar esta propuesta?')) {
                            updateProposalStatus(selectedProposal.id, 'rejected');
                            setSelectedProposal(prev => prev ? { ...prev, status: 'rejected' } : null);
                          }
                        }}
                        className="btn btn-danger" 
                        style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}
                      >
                        Rechazar Nota
                      </button>
                    )}

                    {(selectedProposal.status === 'approved' || selectedProposal.status === 'in_evaluation') && (
                      <button 
                        onClick={startConversion}
                        className="btn btn-primary" 
                        style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <CheckCircle2 size={14} /> Convertir en Cobertura
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 110 }} onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nueva Propuesta de Nota</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Título de la Propuesta *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Reclamo por ruidos molestos en Bº Pizzurno" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Descripción / Idea de Cobertura</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: '100px' }}
                  placeholder="Detalla de qué trata la noticia, posibles entrevistados, contexto..." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha/Hora Tentativa</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={dateTime}
                    onChange={e => setDateTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ubicación</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Plaza 25 de Mayo"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Prioridad oculta para limpieza de interfaz */}

              {/* Programs and Formats */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Programas Destino</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {PROGRAM_OPTIONS.map(prog => {
                    const selected = proposalPrograms.includes(prog);
                    return (
                      <button
                        key={prog}
                        type="button"
                        className="btn"
                        onClick={() => toggleProposalProgram(prog)}
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
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Formatos de Cobertura</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {FORMAT_OPTIONS.map(form => {
                    const selected = proposalFormats.includes(form);
                    return (
                      <button
                        key={form}
                        type="button"
                        className="btn"
                        onClick={() => toggleProposalFormat(form)}
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

              {/* Assignees (Visual roles hidden) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Integrantes de Redacción Sugeridos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  {users.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={assignees.includes(u.id)}
                        onChange={() => handleAssigneeToggle(u.id)}
                      />
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: u.avatarColor }}></span>
                      {u.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Multimedia real file selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cargar Flyers / Gacetillas / Fotos</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  >
                    <Paperclip size={14} /> Seleccionar Archivos
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carga imágenes, audios o documentos reales.</span>
                </div>
                {formFiles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {formFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button type="button" onClick={() => removeFileForm(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* External Links Section */}
              <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Agregar Enlaces Externos (Drive, WeTransfer, etc.)</label>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Título (Ej: Carpeta Google Drive)" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem' }}
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                  />
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="URL (https://...)" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem' }}
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                  <button type="button" onClick={addLinkToForm} className="btn btn-secondary" style={{ padding: '0.35rem' }}><Plus size={14} /></button>
                </div>
                {formLinks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {formLinks.map((link, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <span>🔗 <b>{link.title}:</b> {link.url}</span>
                        <button type="button" onClick={() => removeLinkForm(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Propuesta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERSION MODAL */}
      {showConvertModal && selectedProposal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 120 }} onClick={() => setShowConvertModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Convertir a Cobertura Activa</h3>
              <button className="modal-close" onClick={() => setShowConvertModal(false)}>✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const createdId = convertProposalToCoverage(selectedProposal.id, {
                dateTime: convertDateTime,
                location: convertLocation,
                assigneeId: convertAssigneeId || undefined,
                status: convertStatus,
                programs: convertPrograms,
                formats: convertFormats
              });
              if (createdId) {
                setShowConvertModal(false);
                setSelectedProposal(null);
                alert('¡Propuesta convertida en Cobertura Activa exitosamente!');
              }
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Propuesta:</strong> {selectedProposal.title}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Fecha y Hora Programada *</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-control"
                    value={convertDateTime}
                    onChange={e => setConvertDateTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Ubicación real de cobertura *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ej. Bv. Santa Fe 1200, Rafaela"
                    value={convertLocation}
                    onChange={e => setConvertLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Responsable Principal (Periodista)</label>
                  <select
                    className="form-select"
                    value={convertAssigneeId}
                    onChange={e => setConvertAssigneeId(e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Estado Operativo Inicial</label>
                  <select
                    className="form-select"
                    value={convertStatus}
                    onChange={e => setConvertStatus(e.target.value as any)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_coverage">En Cobertura</option>
                    <option value="in_redaction">En Redacción</option>
                    <option value="ready_to_publish">Lista para Publicar</option>
                  </select>
                </div>

                {/* Programs and Formats */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Programas Destino</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {PROGRAM_OPTIONS.map(prog => {
                      const selected = convertPrograms.includes(prog);
                      return (
                        <button
                          key={prog}
                          type="button"
                          className="btn"
                          onClick={() => {
                            setConvertPrograms(prev => prev.includes(prog) ? prev.filter(p => p !== prog) : [...prev, prog]);
                          }}
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
                  <label className="form-label" style={{ fontWeight: 600 }}>Formatos Logísticos</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {FORMAT_OPTIONS.map(form => {
                      const selected = convertFormats.includes(form);
                      return (
                        <button
                          key={form}
                          type="button"
                          className="btn"
                          onClick={() => {
                            setConvertFormats(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]);
                          }}
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConvertModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Convertir a Cobertura</button>
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
                    {selectedProposal?.description || "Contenido de la gacetilla o reporte adjunto."}
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

      {/* Edit Proposal Modal */}
      {showEditProposalModal && selectedProposal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 120 }} onClick={() => setShowEditProposalModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Detalles de la Propuesta</h3>
              <button className="modal-close" onClick={() => setShowEditProposalModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProposalDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Título de la Propuesta *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={editProposalTitle}
                  onChange={e => setEditProposalTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Descripción / Idea de Cobertura</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: '100px' }}
                  value={editProposalDescription}
                  onChange={e => setEditProposalDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha/Hora Tentativa</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={editProposalDateTime}
                    onChange={e => setEditProposalDateTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ubicación</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editProposalLocation}
                    onChange={e => setEditProposalLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Programs and Formats */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Programas Destino</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {PROGRAM_OPTIONS.map(prog => {
                    const selected = editProposalPrograms.includes(prog);
                    return (
                      <button
                        key={prog}
                        type="button"
                        className="btn"
                        onClick={() => toggleEditProposalProgram(prog)}
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
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Formatos de Cobertura</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {FORMAT_OPTIONS.map(form => {
                    const selected = editProposalFormats.includes(form);
                    return (
                      <button
                        key={form}
                        type="button"
                        className="btn"
                        onClick={() => toggleEditProposalFormat(form)}
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

              {/* Assignees (Visual roles hidden) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Integrantes de Redacción Sugeridos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  {users.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editProposalAssignees.includes(u.id)}
                        onChange={() => handleEditProposalAssigneeToggle(u.id)}
                      />
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: u.avatarColor }}></span>
                      {u.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProposalModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
