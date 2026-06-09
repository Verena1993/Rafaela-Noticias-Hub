import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Radio, Globe, MapPin, TrendingUp, Newspaper, Sparkles, Send, 
  ChevronRight, Clock, ExternalLink, FileText,
  RefreshCw, PlaySquare, MessageCircle, AlertTriangle, Smartphone,
  ServerCog, Layers, Activity, Target
} from 'lucide-react';
import type { RadarCategory, NewsRadarItem } from '../data/mockData';
import { formatFriendlyDate } from '../utils/dateUtils';
import { aiService } from '../services/aiService';
import { isSimilarTitle } from '../services/rssService';
import { clusterItems } from '../utils/topicClustering';

type RadarMainTab = 'feed' | 'opportunities' | 'topics' | 'local' | 'provincial' | 'national' | 'trends' | 'rafaela_talks' | 'diagnostics';

// Color map for tags and cards based on category
const CATEGORY_CONFIG: Record<RadarCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  national: { label: 'Nacional', icon: Globe, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },      // Blue
  provincial: { label: 'Provincial', icon: MapPin, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }, // Green
  local: { label: 'Local', icon: Newspaper, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },         // Yellow
  trending: { label: 'Google Trends', icon: TrendingUp, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  social_trends: { label: 'Redes Sociales', icon: PlaySquare, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' }, // Violet
  rafaela_talks: { label: 'Comunidad Local', icon: MessageCircle, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' }
};

const ALERT_KEYWORDS = ['accidente', 'choque', 'incendio', 'robo', 'allanamiento', 'homicidio', 'tormenta', 'evacuacion', 'evacuación', 'corte'];

const getTrendLevelColor = (level?: string) => {
  switch (level) {
    case 'Muy caliente': return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)' }; // Red
    case 'En crecimiento': return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }; // Orange
    case 'Moderada': return { text: '#10b981', bg: 'rgba(16,185,129,0.1)' }; // Green
    default: return { text: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' };
  }
};

export const NewsRadar: React.FC = () => {
  const { newsRadarItems, updateNewsRadarItem, addProposal, fetchLiveRadarNews, loadingRadar, coverages, proposals, rssDiagnostics } = useHub();
  
  const [mainTab, setMainTab] = useState<RadarMainTab>('feed');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [topicSortBy, setTopicSortBy] = useState<'recency' | 'media_count' | 'growth'>('media_count');
  const [oppSortBy, setOppSortBy] = useState<'score' | 'recency' | 'growth' | 'media_count' | 'local_impact'>('score');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

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

  const getWeight = (item: NewsRadarItem) => {
    if (isAlert(item.title)) return 10;
    
    // Top Priority Local Sources
    const topLocal = ['Radio Rafaela', 'Castellanos de Rafaela', 'La Opinión', 'Municipalidad de Rafaela'];
    if (topLocal.includes(item.source)) return 6;
    
    if (item.category === 'trending') return 4;
    if (item.category === 'local') return 3;
    if (item.category === 'provincial') return 2;
    return 1; // national
  };

  // Pure filtering: we ONLY work with items that are NOT covered.
  // The system removes them from the Radar completely if they are covered.
  const newItems = newsRadarItems.filter(i => !checkAlreadyCovered(i));

  // Divide datasets based on newItems
  const feedItems = newItems
    .filter(i => ['national', 'provincial', 'local', 'trending'].includes(i.category))
    .sort((a, b) => getWeight(b) - getWeight(a)); // Sort by priority
  
  const localItems = newItems.filter(i => i.category === 'local');
  const provincialItems = newItems.filter(i => i.category === 'provincial');
  const nationalItems = newItems.filter(i => i.category === 'national');
  const trendingItems = newItems.filter(i => ['trending', 'social_trends'].includes(i.category));
  const rafaelaTalks = newItems.filter(i => i.category === 'rafaela_talks');

  const tiktokVideos = trendingItems.filter(i => i.socialPlatform === 'tiktok');
  const igReels = trendingItems.filter(i => i.socialPlatform === 'instagram');
  const xTrends = trendingItems.filter(i => i.socialPlatform === 'x');
  const googleTrends = trendingItems.filter(i => i.category === 'trending');

  const clusteredTopics = React.useMemo(() => {
    let topics = clusterItems(newItems);
    
    topics.sort((a, b) => {
      if (topicSortBy === 'media_count') {
        if (b.mediaCount !== a.mediaCount) return b.mediaCount - a.mediaCount;
        return b.articleCount - a.articleCount;
      }
      if (topicSortBy === 'recency') return new Date(b.lastPublishedAt).getTime() - new Date(a.lastPublishedAt).getTime();
      if (topicSortBy === 'growth') {
        const aGrowth = a.articleCount / (Math.max(1, (new Date(a.lastPublishedAt).getTime() - new Date(a.firstPublishedAt).getTime()) / 3600000));
        const bGrowth = b.articleCount / (Math.max(1, (new Date(b.lastPublishedAt).getTime() - new Date(b.firstPublishedAt).getTime()) / 3600000));
        return bGrowth - aGrowth;
      }
      return 0;
    });
    return topics;
  }, [newItems, topicSortBy]);

  const opportunityTopics = React.useMemo(() => {
    let topics = [...clusteredTopics];
    topics.sort((a, b) => {
      if (oppSortBy === 'score') return (b.editorialScore?.score || 0) - (a.editorialScore?.score || 0);
      if (oppSortBy === 'recency') return new Date(b.lastPublishedAt).getTime() - new Date(a.lastPublishedAt).getTime();
      if (oppSortBy === 'growth') {
        const aGrowth = a.articleCount / (Math.max(1, (new Date(a.lastPublishedAt).getTime() - new Date(a.firstPublishedAt).getTime()) / 3600000));
        const bGrowth = b.articleCount / (Math.max(1, (new Date(b.lastPublishedAt).getTime() - new Date(b.firstPublishedAt).getTime()) / 3600000));
        return bGrowth - aGrowth;
      }
      if (oppSortBy === 'media_count') return b.mediaCount - a.mediaCount;
      if (oppSortBy === 'local_impact') return (b.editorialScore?.flags.impactoLocal ? 1 : 0) - (a.editorialScore?.flags.impactoLocal ? 1 : 0);
      return 0;
    });
    return topics;
  }, [clusteredTopics, oppSortBy]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffHours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'hace unos minutos';
    if (diffHours < 24) return `hace ${diffHours}h`;
    return formatFriendlyDate(dateStr);
  };

  const translateConnectionType = (type: string) => {
    switch (type) {
      case 'rss2json_proxy': return 'Proxy Público (rss2json)';
      case 'edge_function': return 'Supabase Edge Function';
      case 'google_news': return 'Google News Engine';
      case 'social_api': return 'Social Media API';
      case 'rss_direct': return 'RSS Directo';
      case 'pending': return 'Pendiente / No URL';
      default: return type;
    }
  };

  // Render a single Radar Card
  const renderItemCard = (item: NewsRadarItem) => {
    const catConfig = CATEGORY_CONFIG[item.category];
    const CatIcon = catConfig.icon;
    const isExpanded = expandedId === item.id;
    const isGenerating = generatingId === item.id;
    const isSending = sendingId === item.id;
    const alertFlag = isAlert(item.title);
    
    return (
      <div 
        key={item.id} 
        className="card"
        style={{
          borderLeft: alertFlag ? '4px solid #ef4444' : `4px solid ${catConfig.color}`,
          transition: 'all 0.2s',
          position: 'relative'
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              {alertFlag && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                  <AlertTriangle size={10} /> Alerta Crítica
                </span>
              )}
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                color: catConfig.color, backgroundColor: catConfig.bg,
                padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)'
              }}>
                {catConfig.label}
              </span>
              
              {item.trendLevel && (
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600,
                  color: getTrendLevelColor(item.trendLevel).text,
                  backgroundColor: getTrendLevelColor(item.trendLevel).bg,
                  padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)'
                }}>
                  🔥 {item.trendLevel}
                </span>
              )}

              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Clock size={11} />{formatDate(item.date)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>• {item.source}</span>
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.4rem 0', lineHeight: 1.4, color: 'var(--text-primary)' }}>
              {item.title}
            </h3>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {item.summary}
            </p>
            
            {item.views && (
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                👁 Visualizaciones estimadas: {item.views}
              </p>
            )}
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

  const TabButton = ({ tab, icon: Icon, label, count, color }: { tab: RadarMainTab, icon: any, label: string, count?: number, color?: string }) => (
    <button 
      onClick={() => setMainTab(tab)}
      style={{ 
        background: 'none', border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer',
        fontWeight: 700, color: mainTab === tab ? (color || 'var(--primary)') : 'var(--text-secondary)',
        borderBottom: mainTab === tab ? `2px solid ${color || 'var(--primary)'}` : '2px solid transparent',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.85rem', whiteSpace: 'nowrap'
      }}
    >
      <Icon size={16} /> {label} {count !== undefined && `(${count})`}
    </button>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={22} style={{ color: 'var(--primary)' }} />
            Radar de Noticias 360°
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Oportunidades puras para la redacción. Todo contenido en agenda es ocultado automáticamente.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            onClick={() => setMainTab('diagnostics')}
          >
            <ServerCog size={14} /> Diagnóstico de Conexión
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', opacity: loadingRadar ? 0.7 : 1 }}
            onClick={() => fetchLiveRadarNews()}
            disabled={loadingRadar}
          >
            <RefreshCw size={14} style={{ animation: loadingRadar ? 'spin 1s linear infinite' : 'none' }} />
            {loadingRadar ? 'Analizando...' : 'Actualizar métricas'}
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
        <TabButton tab="feed" icon={Newspaper} label="Feed Priorizado" />
        <TabButton tab="opportunities" icon={Target} label="Oportunidades Editoriales" color="#8b5cf6" count={opportunityTopics.length} />
        <TabButton tab="topics" icon={Layers} label="Temas Agrupados" color="#f43f5e" count={clusteredTopics.length} />
        <TabButton tab="local" icon={MapPin} label="Locales" color="#eab308" count={localItems.length} />
        <TabButton tab="provincial" icon={MapPin} label="Provinciales" color="#22c55e" count={provincialItems.length} />
        <TabButton tab="national" icon={Globe} label="Nacionales" color="#3b82f6" count={nationalItems.length} />
        <TabButton tab="trends" icon={TrendingUp} label="Tendencias" color="#a855f7" count={trendingItems.length} />
        <TabButton tab="rafaela_talks" icon={MessageCircle} label="Comunidad" count={rafaelaTalks.length} />
      </div>

      {/* Tab Contents */}
      {mainTab === 'opportunities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={16} style={{ color: '#8b5cf6' }} />
              Temas evaluados y priorizados por el Motor Editorial.
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className={`btn ${oppSortBy === 'score' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setOppSortBy('score')}>Mayor Score</button>
              <button className={`btn ${oppSortBy === 'recency' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setOppSortBy('recency')}>Más Reciente</button>
              <button className={`btn ${oppSortBy === 'growth' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setOppSortBy('growth')}>Crecimiento</button>
              <button className={`btn ${oppSortBy === 'local_impact' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setOppSortBy('local_impact')}>Impacto Local</button>
            </div>
          </div>

          {opportunityTopics.map(topic => {
            const scoreObj = topic.editorialScore;
            if (!scoreObj) return null;
            
            const isHigh = scoreObj.priority === 'Alta';
            const isMedium = scoreObj.priority === 'Media';
            
            const badgeColor = isHigh ? '#ef4444' : (isMedium ? '#eab308' : '#9ca3af');
            const badgeBg = isHigh ? 'rgba(239,68,68,0.1)' : (isMedium ? 'rgba(234,179,8,0.1)' : 'rgba(156,163,175,0.1)');
            
            return (
              <div key={`opp_${topic.id}`} className="card" style={{ borderLeft: `4px solid ${badgeColor}`, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: badgeColor, backgroundColor: badgeBg, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {isHigh ? '🔥' : (isMedium ? '🟡' : '⚪')} Oportunidad {scoreObj.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: badgeColor }}>
                    Score: {scoreObj.score}
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                  {topic.title}
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={14} /> Medios: <strong>{topic.mediaCount}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Newspaper size={14} /> Artículos: <strong>{topic.articleCount}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> Act. {formatDate(topic.lastPublishedAt)}</span>
                </div>
                
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', borderLeft: '2px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Motivo de Puntuación</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{scoreObj.reasoning}</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {scoreObj.flags.enCrecimiento && <span style={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>📈 En crecimiento</span>}
                  {scoreObj.flags.impactoLocal && <span style={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>📍 Impacto local</span>}
                  {scoreObj.flags.multifuente && <span style={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>📰 Multifuente</span>}
                  {scoreObj.flags.posibleExclusiva && <span style={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>⭐ Posible exclusiva</span>}
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                   <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id)}
                  >
                    <Layers size={12} />
                    {expandedTopicId === topic.id ? 'Ocultar Artículos' : 'Ver Artículos Agrupados'}
                    <ChevronRight size={11} style={{ transform: expandedTopicId === topic.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>
                
                {expandedTopicId === topic.id && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Artículos Asociados ({topic.items.length})</h4>
                    {topic.items.map(item => (
                      <div key={`opp_item_${item.id}`} style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.5rem' }}>
                        {renderItemCard(item)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mainTab === 'topics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Se agruparon {newItems.length} artículos en {clusteredTopics.length} temas.
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className={`btn ${topicSortBy === 'media_count' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setTopicSortBy('media_count')}>Más Medios</button>
              <button className={`btn ${topicSortBy === 'recency' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setTopicSortBy('recency')}>Más Reciente</button>
              <button className={`btn ${topicSortBy === 'growth' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setTopicSortBy('growth')}>Crecimiento Rápido</button>
            </div>
          </div>

          {clusteredTopics.map(topic => (
            <div key={topic.id} className="card" style={{ borderLeft: `4px solid #f43f5e`, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}>
                      Tema Agrupado
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}>
                      {topic.geoScope}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: topic.activityLevel === 'Caliente' ? '#ef4444' : '#10b981', backgroundColor: topic.activityLevel === 'Caliente' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Activity size={10} /> {topic.activityLevel}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={11} /> Actualizado {formatDate(topic.lastPublishedAt)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                    {topic.title}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Newspaper size={14} style={{ color: 'var(--primary)' }} />
                      <strong>{topic.articleCount}</strong> artículos
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Globe size={14} style={{ color: '#22c55e' }} />
                      <strong>{topic.mediaCount}</strong> medios distintos
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                    Iniciado por <strong>{topic.firstMedia}</strong> ({formatDate(topic.firstPublishedAt)}) • Último: <strong>{topic.lastMedia}</strong>
                  </p>
                </div>
                
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  onClick={() => setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id)}
                >
                  <Layers size={12} />
                  {expandedTopicId === topic.id ? 'Ocultar Artículos' : 'Ver Artículos'}
                  <ChevronRight size={11} style={{ transform: expandedTopicId === topic.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              {expandedTopicId === topic.id && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Artículos Asociados ({topic.items.length})</h4>
                  {topic.items.map(item => (
                    <div key={`topic_item_${item.id}`} style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.5rem' }}>
                      {renderItemCard(item)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mainTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Feed inteligente ordenado por gravedad (Alertas &gt; Locales Prioritarios &gt; Tendencias &gt; Provinciales &gt; Nacionales).
            </span>
          </div>
          {feedItems.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay noticias nuevas en el feed.</p>
          ) : (
            feedItems.map(renderItemCard)
          )}
        </div>
      )}

      {mainTab === 'local' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {localItems.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay noticias locales pendientes.</p> : localItems.map(renderItemCard)}
        </div>
      )}

      {mainTab === 'provincial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {provincialItems.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay noticias provinciales pendientes.</p> : provincialItems.map(renderItemCard)}
        </div>
      )}

      {mainTab === 'national' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {nationalItems.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay noticias nacionales pendientes.</p> : nationalItems.map(renderItemCard)}
        </div>
      )}

      {mainTab === 'trends' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Google Trends Block */}
          {googleTrends.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: '#f97316' }} /> Tendencias de Búsqueda (Google Trends)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {googleTrends.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* TikTok Block */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlaySquare size={18} style={{ color: '#00f2fe' }} /> Videos Virales (TikTok / YT Shorts)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tiktokVideos.map(renderItemCard)}
            </div>
          </div>

          {/* Instagram Block */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={18} style={{ color: '#e1306c' }} /> Tendencias en Instagram
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {igReels.map(renderItemCard)}
            </div>
          </div>

          {/* X Trends Block */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>𝕏</span> Trending Topics (X)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {xTrends.map(renderItemCard)}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'rafaela_talks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(236,72,153,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(236,72,153,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#ec4899', fontWeight: 700 }}>Monitoreo Local 24/7</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Captura conversaciones de redes locales, grupos de Facebook y cuentas de clubes o instituciones.
            </p>
          </div>
          {rafaelaTalks.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay temas detectados actualmente.</p>
          ) : (
            rafaelaTalks.map(renderItemCard)
          )}
        </div>
      )}

      {mainTab === 'diagnostics' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ServerCog size={18} style={{ color: 'var(--primary)' }} /> Estado del Gateway y Conexiones RSS
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            El sistema abstrae las conexiones para tolerar bloqueos de medios. Los medios bloqueados requieren configuración del Edge Function proxy. Las noticias simuladas no se inyectan.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Fuente</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Tipo de Conexión</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Estado</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Noticias Extraídas</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Tiempo (ms)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Última Revisión</th>
                </tr>
              </thead>
              <tbody>
                {rssDiagnostics.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay diagnósticos disponibles. Presiona "Actualizar métricas".
                    </td>
                  </tr>
                ) : (
                  rssDiagnostics.map(diag => (
                    <tr key={diag.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {diag.name}
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{diag.url}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)' 
                        }}>
                          {translateConnectionType(diag.connectionType)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {diag.status === 'OK' && (
                          <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>OK</span>
                        )}
                        {diag.status === 'ERROR' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem', alignSelf: 'flex-start' }}>Error</span>
                            <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{diag.message}</span>
                          </div>
                        )}
                        {diag.status === 'PENDING' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem', alignSelf: 'flex-start' }}>Pendiente</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: diag.status === 'OK' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {diag.itemCount}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {diag.responseTimeMs ? `${diag.responseTimeMs}ms` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(diag.lastChecked).toLocaleTimeString('es-AR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
