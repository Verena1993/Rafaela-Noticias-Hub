import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Radio, Globe, MapPin, Newspaper, Sparkles, Send, 
  ChevronRight, ExternalLink, FileText,
  RefreshCw, AlertTriangle, TrendingUp
} from 'lucide-react';
import type { RadarCategory, NewsRadarItem } from '../types';

import { formatFriendlyDate } from '../utils/dateUtils';
import { aiService } from '../services/aiService';
import { isSimilarTitle } from '../services/rssService';


type RadarMainTab = 'all' | 'local' | 'provincial' | 'national' | 'international' | 'trends';

const CATEGORY_CONFIG: Record<RadarCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  national: { label: 'Nacional', icon: Globe, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  provincial: { label: 'Provincial', icon: MapPin, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  local: { label: 'Local', icon: Newspaper, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  international: { label: 'Internacional', icon: Globe, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' }
};

const ALERT_KEYWORDS = ['accidente', 'choque', 'incendio', 'robo', 'allanamiento', 'homicidio', 'tormenta', 'evacuacion', 'evacuación', 'corte'];

export const NewsRadar: React.FC = () => {
  const { 
    newsRadarItems, 
    updateNewsRadarItem, 
    addProposal, 
    fetchLiveRadarNews, 
    loadingRadar, 
    radarError, 
    coverages, 
    proposals,
    alerts,
    closedAlertIds
  } = useHub();
  
  const [mainTab, setMainTab] = useState<RadarMainTab>('all');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const checkAlreadyCovered = (item: NewsRadarItem) => {
    if (item.sentToEditor || sentIds.has(item.id)) return true;
    const inProposals = proposals.some(p => {
      const hasLink = p.sharedLinks?.some(l => l.url === item.url);
      return hasLink || isSimilarTitle(p.title.replace('[Borrador IA]', ''), item.title);
    });
    const inCoverages = coverages.some(c => {
      const hasLink = c.sharedLinks?.some(l => l.url === item.url);
      return hasLink || isSimilarTitle(c.title.replace('[Borrador IA]', ''), item.title);
    });
    return inProposals || inCoverages;
  };

  const isAlert = (title: string) => {
    const lower = title.toLowerCase();
    return ALERT_KEYWORDS.some(kw => lower.includes(kw));
  };

  // Pure filtering: ONLY work with items that are NOT covered.
  const newItems = newsRadarItems.filter(i => !checkAlreadyCovered(i));

  // Compute counters for each category based on all uncovered items
  const countLocal = newItems.filter(i => i.category === 'local').length;
  const countProvincial = newItems.filter(i => i.category === 'provincial').length;
  const countNational = newItems.filter(i => i.category === 'national').length;
  const countInternational = newItems.filter(i => i.category === 'international').length;
  const countTotal = countLocal + countProvincial + countNational + countInternational;

  // Filter items based on active tab
  const tabItems = React.useMemo(() => {
    if (mainTab === 'trends') return [];
    if (mainTab === 'all') return newItems;
    return newItems.filter(item => item.category === mainTab);
  }, [newItems, mainTab]);

  // Geographical Priority helper
  const getGeoPriority = (item: NewsRadarItem) => {
    const source = item.source.toLowerCase();
    const title = item.title.toLowerCase();
    const summary = item.summary.toLowerCase();
    
    // Prioridad 1: Rafaela, Castellanos
    if (source.includes('rafaela') || source.includes('castellanos') ||
        title.includes('rafaela') || title.includes('castellanos') ||
        summary.includes('rafaela') || summary.includes('castellanos')) {
      return 1;
    }
    
    // Prioridad 2: Sunchales, Frontera, San Vicente, Esperanza
    const p2 = ['sunchales', 'frontera', 'san vicente', 'esperanza'];
    if (p2.some(kw => source.includes(kw) || title.includes(kw) || summary.includes(kw))) {
      return 2;
    }
    
    // Prioridad 3: Provincia de Santa Fe
    const p3 = ['santa fe', 'rosario', 'santafe', 'lt10', 'rosario3', 'el litoral', 'uno santa fe', 'sin mordaza', 'radio eme', 'rosario plus', 'notife', 'telefe santa fe', 'gobierno de santa fe'];
    if (item.category === 'provincial' || p3.some(kw => source.includes(kw) || title.includes(kw) || summary.includes(kw))) {
      return 3;
    }
    
    // Prioridad 4: Nacionales
    const p4 = ['clarín', 'clarin', 'la nación', 'la nacion', 'infobae', 'perfil', 'ámbito', 'ambito', 'tn', 'c5n', 'página 12', 'pagina 12', 'noticias argentinas', 'telam', 'cronista', 'casa rosada'];
    if (item.category === 'national' || p4.some(kw => source.includes(kw) || title.includes(kw) || summary.includes(kw))) {
      return 4;
    }
    
    // Prioridad 5: Internacionales
    return 5;
  };

  const getGeoLocationText = (item: NewsRadarItem) => {
    const prio = getGeoPriority(item);
    if (prio === 1) return 'Rafaela / Castellanos';
    if (prio === 2) return 'Región (Sunchales/Esperanza/etc.)';
    if (prio === 3) return 'Provincia de Santa Fe';
    if (prio === 4) return 'Nacional';
    return 'Internacional';
  };

  // Sort and Interleave feed
  const processedFeed = React.useMemo(() => {
    // 1. Sort geographically and chronologically
    const sorted = [...tabItems].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      
      // If difference is 10 minutes or less, prioritize geographically
      if (Math.abs(timeA - timeB) <= 10 * 60 * 1000) {
        const prioA = getGeoPriority(a);
        const prioB = getGeoPriority(b);
        if (prioA !== prioB) {
          return prioA - prioB; // Lower priority number first
        }
      }
      
      return timeB - timeA; // Most recent first
    });

    // 2. Interleave to enforce the "maximum 3 consecutive news from the same media source" rule
    const result: NewsRadarItem[] = [];
    const remaining = [...sorted];
    
    let consecutiveCount = 0;
    let lastSource = '';
    
    while (remaining.length > 0) {
      let indexToPull = 0;
      
      if (lastSource && consecutiveCount >= 3) {
        // Find the next item from a different source
        const diffIndex = remaining.findIndex(item => item.source !== lastSource);
        if (diffIndex !== -1) {
          indexToPull = diffIndex;
        } else {
          // Fallback if no other sources left
          indexToPull = 0;
        }
      }
      
      const item = remaining.splice(indexToPull, 1)[0];
      result.push(item);
      
      if (item.source === lastSource) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
        lastSource = item.source;
      }
    }

    return result;
  }, [tabItems]);

  // Split feed into temporal blocks
  const temporalBlocks = React.useMemo(() => {
    const now = Date.now();
    
    const blocks = {
      '30min': { label: '⏱️ Últimos 30 minutos', items: [] as NewsRadarItem[] },
      '1hour': { label: '⏱️ Última hora', items: [] as NewsRadarItem[] },
      '3hours': { label: '⏱️ Últimas 3 horas', items: [] as NewsRadarItem[] },
      '6hours': { label: '⏱️ Últimas 6 horas', items: [] as NewsRadarItem[] },
      'day': { label: '📅 Del día', items: [] as NewsRadarItem[] }
    };

    processedFeed.forEach(item => {
      const itemTime = new Date(item.date).getTime();
      const diffMs = now - itemTime;
      
      if (diffMs <= 30 * 60 * 1000) {
        blocks['30min'].items.push(item);
      } else if (diffMs <= 60 * 60 * 1000) {
        blocks['1hour'].items.push(item);
      } else if (diffMs <= 3 * 60 * 60 * 1000) {
        blocks['3hours'].items.push(item);
      } else if (diffMs <= 6 * 60 * 60 * 1000) {
        blocks['6hours'].items.push(item);
      } else {
        blocks['day'].items.push(item);
      }
    });

    return Object.entries(blocks).filter(([_, b]) => b.items.length > 0);
  }, [processedFeed]);

  const handleGenerateDraft = async (item: NewsRadarItem) => {
    setGeneratingId(item.id);
    setExpandedId(item.id);
    try {
      const seoTitle = await aiService.generateSeoTitle(item.title, item.summary);
      const copete = await aiService.generateCopete(item.title, item.summary);
      const draftBody = await aiService.generateDraft(item.title, item.summary, item.source);
      const draft = `${seoTitle}\n\nCOPETE:\n${copete}\n\n${draftBody}`;
      updateNewsRadarItem(item.id, { draft });
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendToEditor = async (item: NewsRadarItem) => {
    setSendingId(item.id);
    try {
      let finalDraft = item.draft;
      let title = item.title;
      if (!finalDraft) {
        title = await aiService.generateSeoTitle(item.title, item.summary);
        const copete = await aiService.generateCopete(item.title, item.summary);
        const draftBody = await aiService.generateDraft(item.title, item.summary, item.source);
        finalDraft = `${title}\n\nCOPETE:\n${copete}\n\n${draftBody}`;
      }

      addProposal(
        `[Borrador IA] ${title}`,
        finalDraft,
        undefined, undefined, [], [], 
        item.url ? [{ title: `Fuente original: ${item.source}`, url: item.url, comments: 'Enlace detectado desde el Radar' }] : [], 
        [], []
      );
      updateNewsRadarItem(item.id, { sentToEditor: true, draft: finalDraft });
      setSentIds(prev => new Set(prev).add(item.id));
    } catch (e) {
      console.error(e);
    } finally {
      setSendingId(null);
    }
  };

  const formatFriendlyTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateLabel = (dateStr: string) => {
    return formatFriendlyDate(dateStr);
  };

  // Render a single Radar Card (Linear, chronologically sorted)
  const renderItemCard = (item: NewsRadarItem) => {
    const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['local'];
    const CatIcon = catConfig.icon;
    const isExpanded = expandedId === item.id;
    const isGenerating = generatingId === item.id;
    const isSending = sendingId === item.id;
    const alertFlag = isAlert(item.title);
    const timeFormatted = formatFriendlyTime(item.date);
    const geoText = getGeoLocationText(item);
    
    return (
      <div 
        key={item.id} 
        className="card"
        style={{
          borderLeft: alertFlag ? '4px solid #ef4444' : `4px solid ${catConfig.color}`,
          transition: 'all 0.2s',
          position: 'relative',
          marginBottom: '0.75rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
            backgroundColor: alertFlag ? 'rgba(239,68,68,0.1)' : catConfig.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {alertFlag ? <AlertTriangle size={18} style={{ color: '#ef4444' }} /> : <CatIcon size={18} style={{ color: catConfig.color }} />}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {timeFormatted}
              </span>
              
              {alertFlag && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                  <AlertTriangle size={10} /> Alerta
                </span>
              )}

              <span style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                color: catConfig.color, backgroundColor: catConfig.bg,
                padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)'
              }}>
                {catConfig.label}
              </span>

              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                📍 {geoText}
              </span>
              
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                • {item.source}
              </span>

              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ({formatDateLabel(item.date)})
              </span>
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.4rem 0', lineHeight: 1.4, color: 'var(--text-primary)' }}>
              {item.title}
            </h3>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {item.summary}
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
            {!item.draft ? (
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
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
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <FileText size={12} />
                {isExpanded ? 'Ocultar' : 'Ver borrador'}
                <ChevronRight size={11} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            )}
            
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', padding: '0.3rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', justifyContent: 'center' }}>
                <ExternalLink size={10} /> Fuente Original
              </a>
            )}
          </div>
        </div>
        
        {isExpanded && item.draft && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} /> Borrador generado
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={() => navigator.clipboard.writeText(item.draft || '')}>
                  Copiar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  onClick={() => handleSendToEditor(item)}
                  disabled={isSending}
                >
                  {isSending ? (
                    <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                  ) : (
                    <><Send size={11} /> Enviar al Editor</>
                  )}
                </button>
              </div>
            </div>
            <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0, fontFamily: 'inherit' }}>
              {item.draft}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const TabButton = ({ tab, label, count, color }: { tab: RadarMainTab, label: string, count?: number, color: string }) => (
    <button 
      onClick={() => setMainTab(tab)}
      style={{ 
        background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
        fontWeight: 700, color: mainTab === tab ? color : 'var(--text-secondary)',
        borderBottom: mainTab === tab ? `3px solid ${color}` : '3px solid transparent',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '0.9rem', whiteSpace: 'nowrap',
        transition: 'all 0.2s'
      }}
    >
      <span>
        {tab === 'all' ? '📰' : tab === 'local' || tab === 'provincial' || tab === 'national' ? '📍' : tab === 'international' ? '🌎' : '🔥'}
      </span>
      {label}
      {count !== undefined && (
        <span style={{ 
          fontSize: '0.75rem', 
          backgroundColor: mainTab === tab ? color : 'var(--bg-tertiary)', 
          color: mainTab === tab ? 'white' : 'var(--text-secondary)',
          padding: '0.1rem 0.5rem', 
          borderRadius: 'var(--radius-full)',
          marginLeft: '0.2rem'
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={22} style={{ color: 'var(--primary)' }} />
            Radar de Noticias
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Mesa de entrada periodística en tiempo real para Rafaela Noticias.
          </p>
          {radarError && (
            <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={12} /> {radarError}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', opacity: loadingRadar ? 0.7 : 1 }}
            onClick={() => fetchLiveRadarNews()}
            disabled={loadingRadar}
          >
            <RefreshCw size={14} style={{ animation: loadingRadar ? 'spin 1s linear infinite' : 'none' }} />
            {loadingRadar ? 'Actualizando...' : 'Actualizar fuentes'}
          </button>
        </div>
      </div>

      {newsRadarItems.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Radio size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No hay noticias RSS disponibles actualmente.</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            El sistema está monitoreando las fuentes RSS en tiempo real.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* LEFT COLUMN: ACTIVE CATEGORY NEWS */}
          <div style={{ flex: '1 1 65%', minWidth: '300px' }}>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
              <TabButton tab="all" label="Todas" count={countTotal} color="#3b82f6" />
              <TabButton tab="local" label="Locales" count={countLocal} color="#eab308" />
              <TabButton tab="provincial" label="Provinciales" count={countProvincial} color="#22c55e" />
              <TabButton tab="national" label="Nacionales" count={countNational} color="#3b82f6" />
              <TabButton tab="international" label="Internacionales" count={countInternational} color="#a855f7" />
              <TabButton tab="trends" label="Tendencias" color="#ec4899" />
            </div>

            {/* List of News / Placeholder */}
            {mainTab === 'trends' ? (
              <div style={{ 
                padding: '3rem 2rem', 
                textAlign: 'center', 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <TrendingUp size={48} style={{ color: '#ec4899', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Monitoreo Social de Tendencias
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-secondary)', 
                  maxWidth: '500px', 
                  lineHeight: 1.5,
                  margin: 0,
                  fontWeight: 600
                }}>
                  Próximamente: integración con Instagram, TikTok, Google Trends y otras fuentes sociales.
                </p>
                <p style={{ 
                  fontSize: '0.78rem', 
                  color: 'var(--text-muted)', 
                  maxWidth: '450px', 
                  lineHeight: 1.4,
                  margin: 0
                }}>
                  Este módulo independiente está reservado para una futura implementación de monitoreo social y detección de conversaciones relevantes para Rafaela Noticias.
                </p>
              </div>
            ) : processedFeed.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                No hay noticias en esta categoría geográfica.
              </div>
            ) : (
              <div>
                {temporalBlocks.map(([key, block]) => (
                  <div key={key} style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px dashed var(--border-color)',
                      paddingBottom: '0.4rem',
                      marginBottom: '0.75rem'
                    }}>
                      {block.label}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {block.items.map(renderItemCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div style={{ flex: '0 0 30%', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 🚨 ALERTAS */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #ef4444', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                background: '#ef4444', 
                color: 'white',
                padding: '0.5rem 1rem', 
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                ALERTAS RECIENTES
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(() => {
                  const activeSidebarAlerts = alerts
                    .filter(a => a.status === 'active' && !closedAlertIds.has(a.id))
                    .sort((a, b) => {
                      const severityOrder = { critical: 0, high: 1, medium: 2 };
                      const orderA = severityOrder[a.severity] ?? 99;
                      const orderB = severityOrder[b.severity] ?? 99;
                      return orderA - orderB;
                    });

                  if (activeSidebarAlerts.length === 0) {
                    return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin alertas de redacción activas.</span>;
                  }

                  return activeSidebarAlerts.slice(0, 5).map(alert => {
                    let badgeColor = '#ef4444';
                    let badgeBg = 'rgba(239,68,68,0.1)';
                    let badgeLabel = '🔴 Crítica';
                    
                    if (alert.severity === 'high') {
                      badgeColor = '#f97316';
                      badgeBg = 'rgba(249,115,22,0.1)';
                      badgeLabel = '🟠 Alta';
                    } else if (alert.severity === 'medium') {
                      badgeColor = '#eab308';
                      badgeBg = 'rgba(234,179,8,0.1)';
                      badgeLabel = '🟡 Media';
                    }

                    return (
                      <div key={alert.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          color: badgeColor, 
                          backgroundColor: badgeBg, 
                          padding: '0.1rem 0.4rem', 
                          borderRadius: 'var(--radius-sm)', 
                          display: 'inline-block', 
                          marginBottom: '0.2rem' 
                        }}>
                          {badgeLabel}
                        </span>
                        <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {alert.title.replace('[RADAR] ', '')}
                        </h5>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Última hora</span>
                          <span>{new Date(alert.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 📈 TENDENCIAS SIDEBAR */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #ec4899', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                background: 'rgba(236,72,153,0.1)', 
                borderBottom: '1px solid var(--border-color)',
                padding: '0.75rem 1rem', 
                fontWeight: 800,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp size={16} />
                MONITOREO DE TENDENCIAS
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Próximamente:
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Integración automatizada con Instagram, TikTok, Google Trends y más.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
