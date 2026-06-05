import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Radio, Globe, MapPin, TrendingUp, Newspaper, Sparkles, Send, 
  ChevronRight, Clock, Tag, ExternalLink, FileText, CheckCircle2,
  RefreshCw
} from 'lucide-react';
import type { RadarCategory, NewsRadarItem } from '../data/mockData';
import { formatFriendlyDate } from '../utils/dateUtils';

const CATEGORY_CONFIG: Record<RadarCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  national: { label: 'Nacional', icon: Globe, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  provincial: { label: 'Provincial', icon: MapPin, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  regional: { label: 'Regional', icon: Newspaper, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  trending: { label: 'Tendencias', icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

const FILTERS: { id: RadarCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'national', label: 'Nacional' },
  { id: 'provincial', label: 'Provincial' },
  { id: 'regional', label: 'Regional' },
  { id: 'trending', label: 'Tendencias' },
];

const DRAFT_TEMPLATES = (item: NewsRadarItem) => ({
  title: `Título SEO: ${item.title}\n\nVariante 1: El impacto de este tema en Rafaela y la región\nVariante 2: Lo que debes saber sobre ${item.title.split(':')[0]}\nVariante 3: Rafaela frente a ${item.title.substring(0, 40)}...`,
  intro: `COPETE:\n${item.summary}\n\nLa noticia generada por ${item.source} impacta directamente en el área de cobertura de Rafaela Noticias y merece seguimiento local.`,
  body: `DESARROLLO:\n\n${item.summary}\n\nSegún información de ${item.source}, publicada el ${formatFriendlyDate(item.date)}, la situación evoluciona de manera que podría tener consecuencias directas para la comunidad de Rafaela y la región central de Santa Fe.\n\nPara profundizar en esta oportunidad editorial, se recomienda:\n• Consultar fuentes locales relacionadas\n• Buscar el ángulo regional de la noticia\n• Entrevistar a referentes locales del sector involucrado\n• Verificar impacto específico en Rafaela\n\nEste borrador fue generado automáticamente por el sistema de Radar de Noticias de Rafaela Noticias Hub y debe ser revisado, contextualizado y aprobado por un editor antes de su publicación.`,
});

export const NewsRadar: React.FC = () => {
  const { newsRadarItems, updateNewsRadarItem, addCoverage, updateCoverageStatus } = useHub();
  const [activeFilter, setActiveFilter] = useState<RadarCategory | 'all'>('all');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const filtered = newsRadarItems.filter(item => 
    activeFilter === 'all' || item.category === activeFilter
  );

  const handleGenerateDraft = (item: NewsRadarItem) => {
    setGeneratingId(item.id);
    setExpandedId(item.id);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const templates = DRAFT_TEMPLATES(item);
      const draft = `${templates.title}\n\n${templates.intro}\n\n${templates.body}`;
      updateNewsRadarItem(item.id, { draft });
      setGeneratingId(null);
    }, 1800);
  };

  const handleSendToEditor = (item: NewsRadarItem) => {
    setSendingId(item.id);
    setTimeout(() => {
      // Auto-generate draft if not previously generated
      let finalDraft = item.draft;
      if (!finalDraft) {
        const templates = DRAFT_TEMPLATES(item);
        finalDraft = `${templates.title}\n\n${templates.intro}\n\n${templates.body}`;
      }

      // Create a Coverage in 'in_redaction' state with the AI draft
      const coverageId = addCoverage(
        `[Borrador IA] ${item.title}`,
        finalDraft,
        new Date().toISOString(),
        'Redacción (Asignación automática)',
        []
      );
      updateCoverageStatus(coverageId, 'in_redaction');

      updateNewsRadarItem(item.id, { sentToEditor: true, draft: finalDraft });
      setSentIds(prev => new Set(prev).add(item.id));
      setSendingId(null);
    }, 1500); // simulate slightly longer AI delay
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'hace unos minutos';
    if (diffHours < 24) return `hace ${diffHours}h`;
    return formatFriendlyDate(dateStr);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={22} style={{ color: 'var(--primary)' }} />
            Radar de Noticias
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Detección de oportunidades editoriales nacionales, provinciales y regionales.
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              (Arquitectura preparada para integración con APIs externas e IA)
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} />
            Actualizar feed
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f.id;
          const catConfig = f.id !== 'all' ? CATEGORY_CONFIG[f.id as RadarCategory] : null;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as RadarCategory | 'all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: isActive 
                  ? `2px solid ${catConfig?.color || 'var(--primary)'}` 
                  : '1px solid var(--border-color)',
                background: isActive 
                  ? (catConfig?.bg || 'rgba(var(--primary-rgb, 99,102,241),0.1)') 
                  : 'var(--bg-primary)',
                color: isActive ? (catConfig?.color || 'var(--primary)') : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {catConfig && <catConfig.icon size={13} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* News grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(item => {
          const catConfig = CATEGORY_CONFIG[item.category];
          const CatIcon = catConfig.icon;
          const isExpanded = expandedId === item.id;
          const isGenerating = generatingId === item.id;
          const isSending = sendingId === item.id;
          const isSent = item.sentToEditor || sentIds.has(item.id);
          
          return (
            <div 
              key={item.id} 
              className="card"
              style={{
                borderLeft: `4px solid ${catConfig.color}`,
                transition: 'all 0.2s'
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: catConfig.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CatIcon size={18} style={{ color: catConfig.color }} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: catConfig.color,
                      backgroundColor: catConfig.bg,
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {catConfig.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={11} />{formatDate(item.date)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• {item.source}</span>
                    {isSent && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--success-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={11} /> Enviado al editor
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 700, 
                    margin: '0 0 0.4rem 0',
                    lineHeight: 1.4,
                    color: 'var(--text-primary)'
                  }}>
                    {item.title}
                  </h3>
                  
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    {item.summary}
                  </p>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {item.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.15rem'
                        }}>
                          <Tag size={9} />#{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                  {!item.draft ? (
                    <button
                      className="btn btn-primary"
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.4rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => handleGenerateDraft(item)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</>
                      ) : (
                        <><Sparkles size={12} /> Generar borrador</>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.4rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: 'var(--primary)'
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <FileText size={12} />
                      {isExpanded ? 'Ocultar' : 'Ver borrador'}
                      <ChevronRight size={11} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  )}
                  
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        textDecoration: 'none',
                        padding: '0.3rem 0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        justifyContent: 'center'
                      }}
                    >
                      <ExternalLink size={10} /> Fuente
                    </a>
                  )}
                </div>
              </div>
              
              {/* Draft expanded section */}
              {isExpanded && item.draft && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                      Borrador generado por IA
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => navigator.clipboard.writeText(item.draft || '')}
                      >
                        Copiar
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.3rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          opacity: isSent ? 0.6 : 1
                        }}
                        onClick={() => !isSent && handleSendToEditor(item)}
                        disabled={isSent || isSending}
                      >
                        {isSending ? (
                          <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                        ) : isSent ? (
                          <><CheckCircle2 size={11} /> Enviado</>
                        ) : (
                          <><Send size={11} /> Enviar al Editor</>
                        )}
                      </button>
                    </div>
                  </div>
                  <pre style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    margin: 0,
                    fontFamily: 'inherit'
                  }}>
                    {item.draft}
                  </pre>
                  <p style={{ 
                    fontSize: '0.68rem', 
                    color: 'var(--text-muted)', 
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    margin: '0.75rem 0 0'
                  }}>
                    ⚠️ Este borrador fue generado automáticamente con IA simulada. Debe ser revisado, contextualizado y aprobado por un editor antes de su publicación. En el futuro, esta IA utilizará las reglas editoriales específicas de Rafaela Noticias.
                  </p>
                </div>
              )}
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Radio size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p>No hay noticias en esta categoría</p>
          </div>
        )}
      </div>

      {/* Future roadmap note */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        <Radio size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Arquitectura preparada para expansión</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Este módulo está diseñado para conectarse con APIs de noticias (NewsAPI, GNews, Infobae, La Capital), fuentes provinciales de Santa Fe, 
            y modelos de IA locales para generar borradores periodísticos completos con estilo editorial de Rafaela Noticias. 
            El flujo futuro contempla: Radar → Borrador → Editor → Portal (borrador, nunca publicación automática).
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
