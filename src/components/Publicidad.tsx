import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { Plus, Edit3, Trash2, FileText, Paperclip } from 'lucide-react';
import { formatFriendlyDate, formatDateDMY } from '../utils/dateUtils';

// TypeScript Types
export type PublicityFormat = 'Banner' | 'Flyer' | 'Carrusel' | 'Historia' | 'Reel' | 'Video TV' | 'Nota Web';
export type PublicityMedium = 'Portal Web' | 'Facebook Feed' | 'Facebook Historia' | 'Instagram Feed' | 'Instagram Historia' | 'Video TV';
export type PublicityStatus = 'Pendiente' | 'Programada' | 'Publicada' | 'Cancelada';

export interface PublicityAttachment {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'audio' | 'document' | 'link';
  url: string; // File URL or base64 Data URL
}

export interface PublicityPublication {
  id: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm (optional)
  medium: PublicityMedium;
  pieces: (PublicityFormat | PublicityMedium)[]; // ¿Qué publicar? (sub-selection of production formats / media)
  attachments: PublicityAttachment[]; // Materiales propios para esta publicación
  observations?: string;
  status: PublicityStatus;
}

export interface PublicityCampaign {
  id: string;
  // BLOQUE 1: PRODUCCIÓN
  client: string;
  responsibleId: string;
  productionDate: string; // Fecha de producción
  productionTime?: string; // Hora de producción (opcional)
  pieces: PublicityFormat[]; // ¿Qué hay que producir? (Banner, Flyer, etc.)
  description: string; // Descripción / Observaciones de producción
  productionAttachments: PublicityAttachment[]; // Archivos adjuntos de producción

  // BLOQUE 2: PROGRAMACIÓN DE PUBLICACIONES
  frequency: 'single' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | '2w' | '3w' | 'interval' | 'count';
  publications: PublicityPublication[];
  generalObservations?: string; // Observaciones generales contractuales
  createdAt: string;
}

// Media color helpers
export const getMediumColorDot = (medium: PublicityMedium): string => {
  switch (medium) {
    case 'Portal Web':
      return '🟢';
    case 'Facebook Feed':
    case 'Facebook Historia':
      return '🔵';
    case 'Instagram Feed':
    case 'Instagram Historia':
      return '🟣';
    case 'Video TV':
      return '🔴';
    default:
      return '⚪️';
  }
};

export const getMediumColorHex = (medium: PublicityMedium): string => {
  switch (medium) {
    case 'Portal Web':
      return '#10b981'; // green
    case 'Facebook Feed':
    case 'Facebook Historia':
      return '#3b82f6'; // blue
    case 'Instagram Feed':
    case 'Instagram Historia':
      return '#8b5cf6'; // purple
    case 'Video TV':
      return '#ef4444'; // red
    default:
      return '#94a3b8'; // gray
  }
};

export const getMediumBgColor = (medium: PublicityMedium): string => {
  switch (medium) {
    case 'Portal Web':
      return '#ecfdf5';
    case 'Facebook Feed':
    case 'Facebook Historia':
      return '#eff6ff';
    case 'Instagram Feed':
    case 'Instagram Historia':
      return '#f5f3ff';
    case 'Video TV':
      return '#fef2f2';
    default:
      return '#f8fafc';
  }
};

export const getMediumTextColor = (medium: PublicityMedium): string => {
  switch (medium) {
    case 'Portal Web':
      return '#047857';
    case 'Facebook Feed':
    case 'Facebook Historia':
      return '#1e40af';
    case 'Instagram Feed':
    case 'Instagram Historia':
      return '#5b21b6';
    case 'Video TV':
      return '#991b1b';
    default:
      return '#475569';
  }
};

export const Publicidad: React.FC = () => {
  const { users } = useHub();

  // Primary states
  const [campaigns, setCampaigns] = useState<PublicityCampaign[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form states (Bloque 1: Producción)
  const [client, setClient] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [productionTime, setProductionTime] = useState('10:00');
  const [selectedPieces, setSelectedPieces] = useState<PublicityFormat[]>([]);
  const [description, setDescription] = useState('');
  const [productionAttachments, setProductionAttachments] = useState<PublicityAttachment[]>([]);

  // Form states (Bloque 2: Programación)
  const [frequency, setFrequency] = useState<PublicityCampaign['frequency']>('single');
  const [generalObservations, setGeneralObservations] = useState('');
  const [publications, setPublications] = useState<PublicityPublication[]>([]);

  // Generator configuration states
  const [intervalDays, setIntervalDays] = useState<number>(3);
  const [pubCount, setPubCount] = useState<number>(10);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Search campaigns filter
  const [searchQuery, setSearchQuery] = useState('');

  // Flag to avoid auto-generation during modal initialization or user load
  const [isInitializing, setIsInitializing] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<any>(null);
  
  // Custom confirmation modal state for deletions
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    title: string;
    onConfirm: () => void;
  }>({ show: false, title: '', onConfirm: () => {} });

  // Attachment states (for inline addition inside Bloque 1 / Bloque 2 cards)
  const [addingAttachmentToPubId, setAddingAttachmentToPubId] = useState<string | null>(null); // if null, adding to Bloque 1 (Producción)
  const [showAddProdAttachment, setShowAddProdAttachment] = useState(false);
  
  const [newAttachType, setNewAttachType] = useState<'photo' | 'video' | 'audio' | 'document' | 'link'>('photo');
  const [newAttachName, setNewAttachName] = useState('');
  const [newAttachUrl, setNewAttachUrl] = useState('');

  // Load from localStorage with robust sanitization
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rn_publicity_campaigns');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((c: any) => ({
            id: c.id || crypto.randomUUID(),
            client: c.client || '',
            responsibleId: c.responsibleId || '',
            productionDate: c.productionDate || c.startDate || new Date().toISOString().split('T')[0],
            productionTime: c.productionTime || '10:00',
            pieces: Array.isArray(c.pieces) ? c.pieces : [],
            description: c.description || '',
            productionAttachments: Array.isArray(c.productionAttachments) ? c.productionAttachments : [],
            frequency: c.frequency || 'single',
            publications: Array.isArray(c.publications)
              ? c.publications.map((p: any) => ({
                  id: p.id || crypto.randomUUID(),
                  date: p.date || new Date().toISOString().split('T')[0],
                  time: p.time || '10:00',
                  medium: p.medium || 'Portal Web',
                  pieces: Array.isArray(p.pieces) ? p.pieces : (p.pieceUsed ? [p.pieceUsed] : []),
                  attachments: Array.isArray(p.attachments) ? p.attachments : [],
                  observations: p.observations || '',
                  status: p.status || 'Pendiente'
                }))
              : [],
            generalObservations: c.generalObservations || '',
            createdAt: c.createdAt || new Date().toISOString()
          }));
          setCampaigns(sanitized);
        }
      }
    } catch (e) {
      console.error('Error loading publicity campaigns', e);
    }
  }, []);

  // Save to localStorage
  const saveCampaigns = (data: PublicityCampaign[]) => {
    setCampaigns(data);
    localStorage.setItem('rn_publicity_campaigns', JSON.stringify(data));
  };

  // Open modal for creation
  const handleOpenCreate = () => {
    setIsInitializing(true);
    setOriginalConfig(null);
    setEditingCampaignId(null);
    
    // Bloque 1 defaults
    setClient('');
    setResponsibleId(users[0]?.id || '');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    setProductionDate(todayStr);
    setProductionTime('10:00');
    setSelectedPieces([]);
    setDescription('');
    setProductionAttachments([]);

    // Bloque 2 defaults
    setFrequency('single');
    setGeneralObservations('');
    
    // Generator defaults
    setIntervalDays(3);
    setPubCount(10);
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    
    // Set initial single publication
    const initialPub: PublicityPublication = {
      id: crypto.randomUUID(),
      date: todayStr,
      time: '10:00',
      medium: 'Portal Web',
      pieces: [],
      attachments: [],
      observations: '',
      status: 'Pendiente'
    };
    setPublications([initialPub]);

    setTimeout(() => {
      setIsInitializing(false);
    }, 50);
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (campaign: PublicityCampaign) => {
    setIsInitializing(true);
    setEditingCampaignId(campaign.id);
    
    // Load Bloque 1
    setClient(campaign.client);
    setResponsibleId(campaign.responsibleId);
    setProductionDate(campaign.productionDate || new Date().toISOString().split('T')[0]);
    setProductionTime(campaign.productionTime || '10:00');
    setSelectedPieces(campaign.pieces || []);
    setDescription(campaign.description || '');
    setProductionAttachments(campaign.productionAttachments || []);

    // Load Bloque 2
    setFrequency(campaign.frequency || 'single');
    setGeneralObservations(campaign.generalObservations || '');
    setPublications((campaign.publications || []).map(p => ({
      ...p,
      attachments: p.attachments || [],
      pieces: p.pieces || []
    })));

    // Load generator default states
    setIntervalDays(3);
    setPubCount(10);
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());

    // Record original config to prevent automatic override of user edits
    const config = {
      frequency: campaign.frequency || 'single',
      intervalDays: 3,
      pubCount: 10,
      selectedMonth: now.getMonth(),
      selectedYear: now.getFullYear()
    };
    setOriginalConfig(config);

    setTimeout(() => {
      setIsInitializing(false);
    }, 50);
    setShowModal(true);
  };

  // Auto-generation Reactivity
  useEffect(() => {
    if (!showModal) return;
    if (isInitializing) return;

    // In edit mode, do not auto-generate unless config fields are modified from original values
    if (editingCampaignId && originalConfig) {
      const current = { frequency, intervalDays, pubCount, selectedMonth, selectedYear };
      const changed = Object.keys(current).some(
        key => (current as any)[key] !== (originalConfig as any)[key]
      );
      if (!changed) return;
    }

    if (frequency === 'single') {
      // For single publication, we keep one publication (or merge with existing if any)
      if (publications.length === 0) {
        setPublications([{
          id: crypto.randomUUID(),
          date: productionDate || new Date().toISOString().split('T')[0],
          time: productionTime || '10:00',
          medium: 'Portal Web',
          pieces: [],
          attachments: [],
          observations: '',
          status: 'Pendiente'
        }]);
      } else {
        // Keep only the first publication but update its date/time
        setPublications(prev => [
          {
            ...prev[0],
            date: productionDate || prev[0].date,
            time: productionTime || prev[0].time
          }
        ]);
      }
    } else {
      // Regenerate the list automatically
      const newPubs = calculateGeneratedPublications();
      setPublications(newPubs);
      
      // Update original config so it doesn't trigger endless loops
      if (editingCampaignId) {
        setOriginalConfig({ frequency, intervalDays, pubCount, selectedMonth, selectedYear });
      }
    }
  }, [frequency, intervalDays, pubCount, selectedMonth, selectedYear, productionDate, productionTime]);

  // Sync content checkboxes inside cards when selection of pieces to produce changes
  // useEffect(() => {
  //   if (!showModal || isInitializing) return;
  //   setPublications(prev =>
  //     prev.map(pub => ({
  //       ...pub,
  //       pieces: pub.pieces.filter(p => selectedPieces.includes(p))
  //     }))
  //   );
  // }, [selectedPieces]);

  // Generation Logic
  const calculateGeneratedPublications = (): PublicityPublication[] => {
    let dates: Date[] = [];

    const isWeekdayModality = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(frequency);

    if (frequency === 'interval') {
      const date = new Date(selectedYear, selectedMonth, 1);
      while (date.getMonth() === selectedMonth) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + intervalDays);
      }
    } else if (frequency === 'count') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      if (pubCount > 0) {
        if (pubCount === 1) {
          dates.push(new Date(selectedYear, selectedMonth, 1));
        } else {
          for (let i = 0; i < pubCount; i++) {
            const day = Math.round(1 + (i * (daysInMonth - 1)) / (pubCount - 1));
            dates.push(new Date(selectedYear, selectedMonth, day));
          }
        }
      }
    } else if (frequency === '2w') {
      const targetDays = [1, 4]; // Lunes y Jueves
      const date = new Date(selectedYear, selectedMonth, 1);
      while (date.getMonth() === selectedMonth) {
        if (targetDays.includes(date.getDay())) {
          dates.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
      }
    } else if (frequency === '3w') {
      const targetDays = [1, 3, 5]; // Lunes, Miércoles y Viernes
      const date = new Date(selectedYear, selectedMonth, 1);
      while (date.getMonth() === selectedMonth) {
        if (targetDays.includes(date.getDay())) {
          dates.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
      }
    } else if (isWeekdayModality) {
      // Weekdays
      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0
      };
      const targetDay = dayMap[frequency] !== undefined ? dayMap[frequency] : 1;
      const date = new Date(selectedYear, selectedMonth, 1);
      while (date.getMonth() === selectedMonth) {
        if (date.getDay() === targetDay) {
          dates.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
      }
    }

    return dates.map(d => {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        id: crypto.randomUUID(),
        date: dateStr,
        time: '10:00',
        medium: 'Portal Web' as PublicityMedium,
        pieces: selectedPieces, // Pre-select all matching pieces
        attachments: [],
        observations: '',
        status: 'Pendiente' as PublicityStatus
      };
    });
  };

  // Add a publication card manually
  const handleAddPublicationCard = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newPub: PublicityPublication = {
      id: crypto.randomUUID(),
      date: todayStr,
      time: '10:00',
      medium: 'Portal Web',
      pieces: selectedPieces,
      attachments: [],
      observations: '',
      status: 'Pendiente'
    };
    setPublications(prev => [...prev, newPub]);
  };

  // Delete a publication card
  const handleRemovePublicationCard = (id: string) => {
    setConfirmDelete({
      show: true,
      title: '¿Deseás eliminar este registro?',
      onConfirm: () => {
        setPublications(prev => prev.filter(p => p.id !== id));
        setConfirmDelete(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Update field of a specific publication card
  const handleUpdatePublicationField = (id: string, field: keyof PublicityPublication, value: any) => {
    setPublications(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Toggle piece inside card "Contenido a publicar"
  const handleTogglePieceInCard = (pubId: string, item: any) => {
    setPublications(prev =>
      prev.map(p => {
        if (p.id !== pubId) return p;
        const pieces = p.pieces || [];
        const newPieces = pieces.includes(item)
          ? pieces.filter(f => f !== item)
          : [...pieces, item];
        // Keep medium in sync with the first selected option (or default to 'Portal Web')
        const firstMedium = (newPieces.find(x => ALL_MEDIA.includes(x as any)) as PublicityMedium) || 'Portal Web';
        return { 
          ...p, 
          pieces: newPieces,
          medium: firstMedium
        };
      })
    );
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, pubId: string, campaignId: string) => {
    e.dataTransfer.setData('pubId', pubId);
    e.dataTransfer.setData('campaignId', campaignId);
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const pubId = e.dataTransfer.getData('pubId');
    const campaignId = e.dataTransfer.getData('campaignId');
    if (!pubId || !campaignId) return;

    const updated = campaigns.map(camp => {
      if (camp.id !== campaignId) return camp;
      const updatedPublications = (camp.publications || []).map(pub => {
        if (pub.id !== pubId) return pub;
        return { ...pub, date: targetDateStr };
      });
      return { ...camp, publications: updatedPublications };
    });
    saveCampaigns(updated);
  };

  // Handle local file uploads (supports Bloque 1 or Bloque 2 cards depending on pubId)
  const handleAttachmentUpload = (pubId: string | null, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      let type: 'photo' | 'video' | 'audio' | 'document' | 'link' = 'document';
      if (file.type.startsWith('image/')) type = 'photo';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const attach: PublicityAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        url: dataUrl
      };

      if (pubId === null) {
        setProductionAttachments(prev => [...prev, attach]);
      } else {
        setPublications(prev =>
          prev.map(p => (p.id === pubId ? { ...p, attachments: [...(p.attachments || []), attach] } : p))
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Add external link attachment
  const handleAddLinkAttachment = (pubId: string | null) => {
    if (!newAttachUrl.trim()) return;
    const attach: PublicityAttachment = {
      id: crypto.randomUUID(),
      name: newAttachName.trim() || 'Enlace externo',
      type: 'link',
      url: newAttachUrl.trim()
    };
    
    if (pubId === null) {
      setProductionAttachments(prev => [...prev, attach]);
      setShowAddProdAttachment(false);
    } else {
      setPublications(prev =>
        prev.map(p => (p.id === pubId ? { ...p, attachments: [...(p.attachments || []), attach] } : p))
      );
      setAddingAttachmentToPubId(null);
    }
    setNewAttachName('');
    setNewAttachUrl('');
  };

  // Delete attachment
  const handleRemoveAttachment = (pubId: string | null, attachId: string) => {
    if (pubId === null) {
      setProductionAttachments(prev => prev.filter(a => a.id !== attachId));
    } else {
      setPublications(prev =>
        prev.map(p => {
          if (p.id !== pubId) return p;
          return { ...p, attachments: (p.attachments || []).filter(a => a.id !== attachId) };
        })
      );
    }
  };

  // Delete campaign
  const handleDeleteCampaign = (id: string) => {
    setConfirmDelete({
      show: true,
      title: '¿Deseás eliminar este registro?',
      onConfirm: () => {
        const updated = campaigns.filter(c => c.id !== id);
        saveCampaigns(updated);
        setConfirmDelete(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Toggle pieces to produce
  const handleTogglePieceToProduce = (format: PublicityFormat) => {
    setSelectedPieces(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !responsibleId) {
      alert('Por favor complete los campos obligatorios (*).');
      return;
    }
    if (publications.length === 0) {
      alert('Debe tener al menos una publicación planificada.');
      return;
    }

    const campaignId = editingCampaignId || crypto.randomUUID();
    const campaignData: PublicityCampaign = {
      id: campaignId,
      client: client.trim(),
      responsibleId,
      productionDate,
      productionTime: productionTime || undefined,
      pieces: selectedPieces,
      description: description.trim(),
      productionAttachments,
      frequency,
      publications,
      generalObservations: generalObservations.trim(),
      createdAt: new Date().toISOString()
    };

    if (editingCampaignId) {
      saveCampaigns(campaigns.map(c => c.id === editingCampaignId ? campaignData : c));
    } else {
      saveCampaigns([...campaigns, campaignData]);
    }

    setShowModal(false);
  };

  // Compile all publications for easy rendering
  const allPublicationsCompiled = campaigns.flatMap(camp => {
    const pubs = Array.isArray(camp.publications) ? camp.publications : [];
    return pubs.map(pub => ({
      ...pub,
      campaignId: camp.id,
      clientName: camp.client,
      responsibleId: camp.responsibleId,
      description: camp.description
    }));
  });

  // Month navigation calculations
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const blankDays = Array.from({ length: firstDayIndex }, () => null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Week navigation calculations
  const getMondayOfDate = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const weekStart = getMondayOfDate(viewDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Calculate earliest pending date
  const getNextPublicationDate = (pubs: PublicityPublication[]): string => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pending = (pubs || [])
      .filter(p => p && p.status !== 'Publicada' && p.status !== 'Cancelada' && p.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    
    if (pending.length > 0) {
      return formatDateDMY(pending[0].date) + (pending[0].time ? ` ${pending[0].time} hs` : '');
    }
    return '—';
  };

  // Filter list
  const filteredCampaigns = campaigns.filter(c => 
    c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Available pieces listing
  const ALL_PIECES: PublicityFormat[] = ['Banner', 'Flyer', 'Carrusel', 'Historia', 'Reel', 'Video TV', 'Nota Web'];
  const ALL_MEDIA: PublicityMedium[] = ['Portal Web', 'Facebook Feed', 'Facebook Historia', 'Instagram Feed', 'Instagram Historia', 'Video TV'];

  return (
    <div className="publicity-module" style={{ padding: '0 0 2rem 0' }}>
      {/* Scope specific styling for premium look & layout consistency */}
      <style>{`
        .publicity-module .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background-color: var(--border-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .publicity-module .calendar-header-day {
          background-color: var(--bg-secondary);
          padding: 0.75rem;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-align: center;
        }
        .publicity-module .calendar-day-cell {
          background-color: var(--bg-primary);
          padding: 0.5rem;
          min-height: 110px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: relative;
        }
        .publicity-module .calendar-day-cell.today {
          background-color: var(--primary-light);
        }
        .publicity-module .calendar-day-cell.today .calendar-day-num {
          background-color: var(--primary);
          color: white;
          border-radius: var(--radius-full);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .publicity-module .calendar-day-num {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .publicity-module .pub-pill {
          font-size: 0.68rem;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: grab;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          user-select: none;
        }
        .publicity-module .pub-pill:active {
          cursor: grabbing;
        }
        .publicity-module .pub-pill:hover {
          filter: brightness(0.92);
          transform: translateY(-1px);
        }
        .publicity-module .pub-pill.status-cancelada {
          text-decoration: line-through;
          opacity: 0.5;
        }
        .publicity-module .pieces-checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .publicity-module .piece-item-card {
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.75rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          user-select: none;
          background-color: var(--bg-primary);
          transition: var(--transition);
        }
        .publicity-module .piece-item-card.selected {
          background-color: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary);
          font-weight: 600;
        }
        .publicity-module .form-chip-btn {
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          cursor: pointer;
          background-color: var(--bg-primary);
          color: var(--text-secondary);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
        }
        .publicity-module .form-chip-btn.selected {
          background-color: var(--primary);
          border-color: var(--primary);
          color: white;
          font-weight: 600;
        }
        .publicity-module .pub-editor-card {
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          position: relative;
        }
        .publicity-module .pub-editor-card:hover {
          box-shadow: var(--shadow-md);
        }
        .publicity-module .form-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--primary);
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 0.4rem;
          margin-bottom: 1rem;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Publicidad (Agenda Comercial)</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Planifica pautas comerciales y visualiza el cronograma de publicaciones del medio.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* View Toggles */}
          <div style={{
            display: 'flex', 
            backgroundColor: 'var(--bg-tertiary)', 
            padding: '0.2rem', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            {['month', 'week', 'day'].map((mode) => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode as any)} 
                className="btn"
                style={{
                  background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                  color: viewMode === mode ? 'var(--primary)' : 'var(--text-secondary)'
                }}
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Nueva Publicidad
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.2rem 0.5rem', fontWeight: 'bold' }} 
              onClick={handlePrevMonth}
            >
              ◀
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              {viewMode === 'month' 
                ? `${monthNames[currentMonth]} ${currentYear}`
                : viewMode === 'week'
                  ? `Semana del ${formatDateDMY(weekDays[0].toISOString().split('T')[0])}`
                  : `${formatFriendlyDate(viewDate)}`
              }
            </h3>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.2rem 0.5rem', fontWeight: 'bold' }} 
              onClick={handleNextMonth}
            >
              ▶
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 Calendario Comercial (Soporta Drag & Drop)</span>
        </div>

        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="calendar-grid">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
              <div key={d} className="calendar-header-day">{d}</div>
            ))}
            {blankDays.map((_, idx) => (
              <div key={`blank-${idx}`} className="calendar-day-cell empty" style={{ opacity: 0.35, backgroundColor: 'var(--bg-secondary)' }}></div>
            ))}
            {daysArray.map(day => {
              const formattedDay = day < 10 ? `0${day}` : day;
              const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : (currentMonth + 1);
              const dayStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
              const todayObj = new Date();
              const isToday = todayObj.getDate() === day && todayObj.getMonth() === currentMonth && todayObj.getFullYear() === currentYear;

              const dayPubs = allPublicationsCompiled
                .filter(p => p.date === dayStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

              return (
                <div 
                  key={day} 
                  className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, dayStr)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span 
                      className="calendar-day-num" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setViewDate(new Date(currentYear, currentMonth, day)); setViewMode('day'); }}
                      title="Ver este día"
                    >
                      {day}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, overflowY: 'auto' }}>
                    {dayPubs.map(pub => {
                      const campaign = campaigns.find(c => c.id === pub.campaignId);
                      return (
                        <div 
                          key={pub.id}
                          draggable
                          onDragStart={(e) => campaign && handleDragStart(e, pub.id, campaign.id)}
                          className={`pub-pill status-${pub.status.toLowerCase()}`}
                          style={{
                            backgroundColor: getMediumBgColor(pub.medium),
                            color: getMediumTextColor(pub.medium),
                            borderLeft: `3px solid ${getMediumColorHex(pub.medium)}`
                          }}
                          onClick={() => campaign && handleOpenEdit(campaign)}
                          title={`${pub.clientName} (${(pub.pieces || []).join(', ')}) ${pub.time ? `a las ${pub.time}` : ''} - Arrástrame para mover la fecha`}
                        >
                          <span className="medium-dot">{getMediumColorDot(pub.medium)}</span>
                          <span>{pub.time || ''} {pub.clientName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {weekDays.map((dayDate, idx) => {
              const year = dayDate.getFullYear();
              const month = String(dayDate.getMonth() + 1).padStart(2, '0');
              const dateVal = String(dayDate.getDate()).padStart(2, '0');
              const dayStr = `${year}-${month}-${dateVal}`;
              
              const dayPubs = allPublicationsCompiled
                .filter(p => p.date === dayStr)
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

              const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
              const todayObj = new Date();
              const isToday = todayObj.getDate() === dayDate.getDate() && todayObj.getMonth() === dayDate.getMonth() && todayObj.getFullYear() === dayDate.getFullYear();
              const dayLabel = `${dayNames[idx]} ${dayDate.getDate()}${isToday ? ' (Hoy)' : ''}`;

              return (
                <div 
                  key={idx} 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, dayStr)}
                  style={{ 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: isToday ? '2.5px solid var(--primary)' : '1px solid var(--border-color)', 
                    backgroundColor: isToday ? 'var(--primary-light)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '260px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setViewDate(dayDate)}
                >
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{dayLabel}</h4>
                  </div>

                  {dayPubs.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin publicaciones</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', flex: 1 }}>
                      {dayPubs.map(pub => {
                        const campaign = campaigns.find(c => c.id === pub.campaignId);
                        return (
                          <div 
                            key={pub.id}
                            draggable
                            onDragStart={(e) => campaign && handleDragStart(e, pub.id, campaign.id)}
                            style={{ 
                              padding: '0.35rem', 
                              borderRadius: 'var(--radius-sm)', 
                              border: `1px solid ${getMediumColorHex(pub.medium)}`,
                              backgroundColor: getMediumBgColor(pub.medium),
                              color: getMediumTextColor(pub.medium),
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.15rem',
                              cursor: 'grab'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (campaign) handleOpenEdit(campaign);
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{getMediumColorDot(pub.medium)}</span>
                              <span style={{ textDecoration: pub.status === 'Cancelada' ? 'line-through' : 'none' }}>
                                {pub.clientName}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                              🕒 {pub.time ? `${pub.time} hs` : 'Sin hora'} — {(pub.pieces || []).join(', ')}
                            </div>
                            <span style={{ fontSize: '0.6rem', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.7)', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 700 }}>
                              {pub.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* DAY VIEW */}
        {viewMode === 'day' && (() => {
          const dayStr = viewDate.toISOString().split('T')[0];
          const dayPubs = allPublicationsCompiled
            .filter(p => p.date === dayStr)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Publicaciones comerciales para el {formatFriendlyDate(viewDate)}
                </h4>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - 1))}
                  >
                    ◀ Anterior
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 1))}
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
              
              {dayPubs.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                  No hay publicaciones comerciales programadas para este día.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dayPubs.map(pub => {
                    const campaign = campaigns.find(c => c.id === pub.campaignId);
                    const respUser = users.find(u => u.id === pub.responsibleId);
                    return (
                      <div 
                        key={pub.id} 
                        style={{ 
                          padding: '0.85rem', 
                          borderRadius: 'var(--radius-md)', 
                          border: `1px solid ${getMediumColorHex(pub.medium)}`,
                          backgroundColor: getMediumBgColor(pub.medium),
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => campaign && handleOpenEdit(campaign)}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1rem' }}>{getMediumColorDot(pub.medium)}</span>
                            <h5 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: getMediumTextColor(pub.medium) }}>
                              {pub.clientName}
                            </h5>
                          </div>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {pub.time && <span>🕒 {pub.time} hs</span>}
                            <span>📍 Medio: {pub.medium}</span>
                            <span>⚙️ Contenido: {(pub.pieces || []).join(', ') || 'Sin piezas asignadas'}</span>
                            {respUser && <span>👤 Responsable: {respUser.name}</span>}
                          </div>

                          {pub.observations && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                              Nota: {pub.observations}
                            </p>
                          )}
                          
                          {pub.attachments && pub.attachments.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                              {pub.attachments.map(att => (
                                <span key={att.id} style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.6)', padding: '0.1rem 0.35rem', borderRadius: '3px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                                  <Paperclip size={10} /> {att.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: pub.status === 'Publicada' ? '#d1fae5' : pub.status === 'Programada' ? '#e0f2fe' : pub.status === 'Cancelada' ? '#fee2e2' : '#f1f5f9',
                            color: pub.status === 'Publicada' ? '#065f46' : pub.status === 'Programada' ? '#0369a1' : pub.status === 'Cancelada' ? '#b91c1c' : '#475569'
                          }}>
                            {pub.status}
                          </span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (campaign) handleOpenEdit(campaign);
                            }}
                          >
                            <Edit3 size={12} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} /> Editar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* LOWER LIST — PLAN COMERCIAL */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Plan Comercial</h3>
          <div className="search-container" style={{ width: '280px', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
            <input
              type="text"
              placeholder="Buscar por cliente..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '100%' }}
            />
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
            No hay publicidades registradas en el Plan Comercial.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Descripción de Producción</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Próxima Publicación</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, textAlign: 'center' }}>Publicadas / Total</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600 }}>Responsable</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map(camp => {
                  const respUser = users.find(u => u.id === camp.responsibleId);
                  const totalPubs = (camp.publications || []).length;
                  const publishedCount = (camp.publications || []).filter(p => p.status === 'Publicada').length;
                  const nextPub = getNextPublicationDate(camp.publications || []);

                  return (
                    <tr key={camp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{camp.client}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {camp.description || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>{nextPub}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '10px',
                          backgroundColor: publishedCount === totalPubs ? '#d1fae5' : 'var(--bg-tertiary)',
                          color: publishedCount === totalPubs ? '#047857' : 'var(--text-secondary)'
                        }}>
                          {publishedCount} / {totalPubs}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {respUser ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', backgroundColor: respUser.avatarColor, borderRadius: '50%' }}></span>
                            <span>{respUser.name}</span>
                          </div>
                        ) : 'Sin asignar'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} 
                            onClick={() => handleOpenEdit(camp)}
                            title="Editar publicidad"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger-text)', border: 'none' }} 
                            onClick={() => handleDeleteCampaign(camp.id)}
                            title="Eliminar publicidad"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL (Nueva Publicidad / Editar Publicidad) */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 120, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ width: '92%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'hidden', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingCampaignId ? '📝 Editar Publicidad' : '➕ Nueva Publicidad'}
              </h3>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
                
                {/* ====================================================== */}
                {/* BLOQUE 1: PRODUCCIÓN */}
                {/* ====================================================== */}
                <div>
                  <h4 className="form-section-title">⚙️ BLOQUE 1: ORDEN DE PRODUCCIÓN</h4>
                  
                  {/* Basic rows */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Cliente *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="Ej. Instituto Martino"
                        value={client}
                        onChange={e => setClient(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Responsable *</label>
                      <select
                        className="form-select"
                        required
                        value={responsibleId}
                        onChange={e => setResponsibleId(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <option value="">Seleccionar responsable...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Fecha Prod. *</label>
                        <input
                          type="date"
                          required
                          value={productionDate}
                          onChange={e => setProductionDate(e.target.value)}
                          style={{ width: '100%', padding: '0.42rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Hora (opc)</label>
                        <input
                          type="time"
                          value={productionTime}
                          onChange={e => setProductionTime(e.target.value)}
                          style={{ width: '100%', padding: '0.42rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Format list to produce */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>¿Qué hay que producir?</label>
                    <div className="pieces-checkbox-grid">
                      {ALL_PIECES.map(format => {
                        const selected = selectedPieces.includes(format);
                        return (
                          <div 
                            key={format}
                            className={`piece-item-card ${selected ? 'selected' : ''}`}
                            onClick={() => handleTogglePieceToProduce(format)}
                          >
                            <span>{selected ? '☑' : '☐'}</span>
                            <span>{format}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description / Instructions */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Descripción / Instrucciones de Producción</label>
                    <textarea
                      className="form-input"
                      placeholder="Instrucciones específicas para el diseñador o realizador..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      style={{ width: '100%', minHeight: '60px', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  {/* Attachments for internal production */}
                  <div className="form-group" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block' }}>Archivos adjuntos de Producción</label>
                    
                    {/* Render existing attachments */}
                    {productionAttachments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                        {productionAttachments.map(att => (
                          <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-primary)', padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                              <Paperclip size={12} />
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '350px' }}>{att.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(null, att.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddProdAttachment ? (
                      <div style={{ border: '1px dashed var(--border-color)', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <select
                            className="form-select"
                            value={newAttachType}
                            onChange={e => setNewAttachType(e.target.value as any)}
                            style={{ padding: '0.2rem', fontSize: '0.75rem' }}
                          >
                            <option value="photo">Imagen</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="document">Documento PDF</option>
                            <option value="link">Enlace externo (Link)</option>
                          </select>
                          {newAttachType === 'link' ? (
                            <input
                              type="text"
                              placeholder="Nombre del enlace..."
                              value={newAttachName}
                              onChange={e => setNewAttachName(e.target.value)}
                              style={{ padding: '0.2rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '3px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Suba archivo local ➜</span>
                          )}
                        </div>

                        {newAttachType === 'link' ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={newAttachUrl}
                              onChange={e => setNewAttachUrl(e.target.value)}
                              style={{ flex: 1, padding: '0.2rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '3px' }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleAddLinkAttachment(null)}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Añadir
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowAddProdAttachment(false)}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input
                              type="file"
                              onChange={e => handleAttachmentUpload(null, e)}
                              style={{ fontSize: '0.75rem' }}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowAddProdAttachment(false)}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddProdAttachment(true);
                          setNewAttachType('photo');
                          setNewAttachName('');
                          setNewAttachUrl('');
                        }}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        ➕ Agregar archivo
                      </button>
                    )}
                  </div>
                </div>

                {/* ====================================================== */}
                {/* BLOQUE 2: PROGRAMACIÓN DE PUBLICACIONES */}
                {/* ====================================================== */}
                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h4 className="form-section-title">📅 BLOQUE 2: PROGRAMACIÓN DE PUBLICACIONES</h4>
                  
                  {/* Frecuencia de Publicacion selector */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Frecuencia de publicación</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                      {[
                        { value: 'single', label: 'Publicación única' },
                        { value: 'monday', label: 'Todos los lunes' },
                        { value: 'tuesday', label: 'Todos los martes' },
                        { value: 'wednesday', label: 'Todos los miércoles' },
                        { value: 'thursday', label: 'Todos los jueves' },
                        { value: 'friday', label: 'Todos los viernes' },
                        { value: 'saturday', label: 'Todos los sábados' },
                        { value: 'sunday', label: 'Todos los domingos' },
                        { value: '2w', label: '2 veces por semana' },
                        { value: '3w', label: '3 veces por semana' },
                        { value: 'interval', label: 'Cada X días' },
                        { value: 'count', label: 'X publicaciones por mes' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`form-chip-btn ${frequency === opt.value ? 'selected' : ''}`}
                          onClick={() => setFrequency(opt.value as any)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {frequency !== 'single' && (
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                        
                        {frequency === 'interval' && (
                          <div className="form-group">
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Intervalo (días) *</label>
                            <input
                              type="number"
                              min={1}
                              className="form-input"
                              value={intervalDays}
                              onChange={e => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                            />
                          </div>
                        )}
                        
                        {frequency === 'count' && (
                          <div className="form-group">
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Cantidad al mes *</label>
                            <input
                              type="number"
                              min={1}
                              className="form-input"
                              value={pubCount}
                              onChange={e => setPubCount(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Mes de planificación</label>
                          <select
                            className="form-select"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(parseInt(e.target.value))}
                            style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)' }}
                          >
                            {monthNames.map((m, idx) => (
                              <option key={idx} value={idx}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Año</label>
                          <input
                            type="number"
                            className="form-input"
                            value={selectedYear}
                            onChange={e => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                            style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publications Scheduler List */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>Publicaciones programadas</label>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddPublicationCard}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        <Plus size={14} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} /> Agregar publicación
                      </button>
                    </div>

                    {/* Card grid list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {publications.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                          No hay publicaciones programadas. Configura la frecuencia o agrega una manualmente.
                        </p>
                      ) : (
                        publications.map((pub, idx) => {
                          return (
                            <div key={pub.id} className="pub-editor-card">
                              {/* Header Card */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                                  Publicación #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePublicationCard(pub.id)}
                                  style={{ 
                                    background: 'var(--danger-light)', 
                                    border: 'none', 
                                    color: 'var(--danger-text)', 
                                    cursor: 'pointer', 
                                    padding: '0.35rem', 
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Eliminar publicación"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Card Fields */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                <div className="form-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Fecha *</label>
                                  <input
                                    type="date"
                                    required
                                    value={pub.date}
                                    onChange={e => handleUpdatePublicationField(pub.id, 'date', e.target.value)}
                                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.78rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                  />
                                </div>
                                <div className="form-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2' }}>Hora (opc)</label>
                                  <input
                                    type="time"
                                    value={pub.time || ''}
                                    onChange={e => handleUpdatePublicationField(pub.id, 'time', e.target.value || undefined)}
                                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.78rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                  />
                                </div>
                              </div>

                              {/* ¿Qué publicar? (Content Selection of Media) */}
                              <div className="form-group">
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>¿Qué publicar?</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {ALL_MEDIA.map(mediaOpt => {
                                    const isChecked = (pub.pieces || []).includes(mediaOpt as any);
                                    return (
                                      <label
                                        key={mediaOpt}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          fontSize: '0.72rem',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                                          backgroundColor: isChecked ? 'var(--primary-light)' : 'transparent',
                                          cursor: 'pointer',
                                          userSelect: 'none'
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleTogglePieceInCard(pub.id, mediaOpt as any)}
                                          style={{ display: 'none' }}
                                        />
                                        <span>{isChecked ? '☑' : '☐'}</span>
                                        <span>{mediaOpt}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Publication Attachments */}
                              <div className="form-group" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Archivos adjuntos de Publicidad (propios/cliente)</label>
                                
                                {pub.attachments && pub.attachments.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                    {pub.attachments.map(att => (
                                      <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: '3px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                                          <FileText size={12} />
                                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '250px' }}>{att.name}</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAttachment(pub.id, att.id)}
                                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {addingAttachmentToPubId === pub.id ? (
                                  <div style={{ border: '1px dashed var(--border-color)', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                      <select
                                        className="form-select"
                                        value={newAttachType}
                                        onChange={e => setNewAttachType(e.target.value as any)}
                                        style={{ padding: '0.2rem', fontSize: '0.75rem' }}
                                      >
                                        <option value="photo">Imagen</option>
                                        <option value="video">Video</option>
                                        <option value="audio">Audio</option>
                                        <option value="document">Documento PDF</option>
                                        <option value="link">Enlace externo (Link)</option>
                                      </select>
                                      {newAttachType === 'link' ? (
                                        <input
                                          type="text"
                                          placeholder="Nombre del enlace..."
                                          value={newAttachName}
                                          onChange={e => setNewAttachName(e.target.value)}
                                          style={{ padding: '0.2rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '3px' }}
                                        />
                                      ) : (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Suba archivo ➜</span>
                                      )}
                                    </div>

                                    {newAttachType === 'link' ? (
                                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                                        <input
                                          type="text"
                                          placeholder="https://..."
                                          value={newAttachUrl}
                                          onChange={e => setNewAttachUrl(e.target.value)}
                                          style={{ flex: 1, padding: '0.2rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '3px' }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          onClick={() => handleAddLinkAttachment(pub.id)}
                                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                          Añadir
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          onClick={() => setAddingAttachmentToPubId(null)}
                                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                          X
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <input
                                          type="file"
                                          onChange={e => handleAttachmentUpload(pub.id, e)}
                                          style={{ fontSize: '0.75rem' }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          onClick={() => setAddingAttachmentToPubId(null)}
                                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      setAddingAttachmentToPubId(pub.id);
                                      setNewAttachType('photo');
                                      setNewAttachName('');
                                      setNewAttachUrl('');
                                    }}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    ➕ Agregar archivo
                                  </button>
                                )}
                              </div>

                              {/* Observations and Status chips */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                <div className="form-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Observaciones</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: Publicar en la franja del mediodía..."
                                    value={pub.observations || ''}
                                    onChange={e => handleUpdatePublicationField(pub.id, 'observations', e.target.value)}
                                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.78rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                  />
                                </div>

                                <div className="form-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Estado</label>
                                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                                    {(['Pendiente', 'Programada', 'Publicada', 'Cancelada'] as PublicityStatus[]).map(st => {
                                      const active = pub.status === st;
                                      let activeBg = '#f1f5f9';
                                      let activeColor = '#475569';
                                      let activeBorder = '#cbd5e1';
                                      if (st === 'Programada') { activeBg = '#e0f2fe'; activeColor = '#0369a1'; activeBorder = '#93c5fd'; }
                                      else if (st === 'Publicada') { activeBg = '#d1fae5'; activeColor = '#065f46'; activeBorder = '#6ee7b7'; }
                                      else if (st === 'Cancelada') { activeBg = '#fee2e2'; activeColor = '#b91c1c'; activeBorder = '#fca5a5'; }

                                      return (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => handleUpdatePublicationField(pub.id, 'status', st)}
                                          style={{
                                            padding: '0.2rem 0.45rem',
                                            fontSize: '0.7rem',
                                            borderRadius: 'var(--radius-full)',
                                            border: active ? `1.5px solid ${activeBorder}` : '1px solid var(--border-color)',
                                            background: active ? activeBg : 'transparent',
                                            color: active ? activeColor : 'var(--text-secondary)',
                                            fontWeight: active ? 700 : 500,
                                            cursor: 'pointer',
                                            transition: 'var(--transition)'
                                          }}
                                        >
                                          {st}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Observaciones Generales contract */}
                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Observaciones generales</label>
                  <textarea
                    className="form-input"
                    placeholder="Escriba aquí condiciones del contrato comercial, observaciones de cobros, etc..."
                    value={generalObservations}
                    onChange={e => setGeneralObservations(e.target.value)}
                    style={{ width: '100%', minHeight: '80px', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}
                  />
                </div>

              </div>
              
              {/* Footer */}
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {editingCampaignId ? 'Guardar Cambios' : 'Crear Publicidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CONFIRM DELETE MODAL */}
      {confirmDelete.show && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 130, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onClick={() => setConfirmDelete(prev => ({ ...prev, show: false }))}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-text)' }}>
                <Trash2 size={24} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Confirmar Eliminación</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                {confirmDelete.title}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setConfirmDelete(prev => ({ ...prev, show: false }))}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  onClick={confirmDelete.onConfirm}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
