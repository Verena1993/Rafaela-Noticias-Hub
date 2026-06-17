import React from 'react';
import { RSS_FEEDS } from '../config/rssFeeds';
import type { RssDiagnostic } from '../types';
import { RefreshCw, ExternalLink, Activity } from 'lucide-react';

interface SourceStatusProps {
  diagnostics: RssDiagnostic[];
  onRefresh: () => void;
  loading: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  local:         { label: 'Local',         color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  regional:      { label: 'Regional',      color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  provincial:    { label: 'Provincial',    color: '#16a34a', bg: 'rgba(22,163,74,0.12)'  },
  national:      { label: 'Nacional',      color: '#2563eb', bg: 'rgba(37,99,235,0.12)'  },
  international: { label: 'Internacional', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
};

const CONNECTION_LABELS: Record<string, string> = {
  rss_direct:       'RSS Directo',
  rss2json_proxy:   'RSS',
  edge_function:    'RSS',
  google_news:      'RSS',
  social_api:       'API',
  pending:          'Pendiente',
  local_proxy:      'RSS',
  allorigins_proxy: 'RSS',
  corsproxy_proxy:  'RSS',
  html_scraping:    'HTML Scraping'
};

const getStatusBadge = (diag: RssDiagnostic | undefined, isPending: boolean) => {
  if (isPending) {
    return { icon: '⏸️', label: 'Pendiente', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
  }
  if (!diag) {
    return { icon: '⚪', label: 'Sin datos', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  }
  if (diag.status === 'ERROR' || diag.itemCount === 0) {
    return { icon: '🔴', label: 'Caída', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  }
  if (diag.itemCount > 0 && diag.itemCount < 3) {
    return { icon: '🟡', label: 'Parcial', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  }
  return { icon: '🟢', label: 'Activa', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
};

const formatTs = (iso: string | undefined) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).replace(',', '');
  } catch { return iso; }
};

export const SourceStatus: React.FC<SourceStatusProps> = ({ diagnostics, onRefresh, loading }) => {
  const diagMap: Record<string, RssDiagnostic> = {};
  diagnostics.forEach(d => { diagMap[d.id] = d; });

  // Count summary
  const totalActive  = diagnostics.filter(d => d.status === 'OK' && d.itemCount > 0).length;
  const totalPartial = diagnostics.filter(d => d.status === 'OK' && d.itemCount > 0 && d.itemCount < 3).length;
  const totalDown    = diagnostics.filter(d => d.status === 'ERROR' || (d.status === 'OK' && d.itemCount === 0)).length;
  const totalPending = RSS_FEEDS.filter(f => f.connectionType === 'pending').length;

  const categories = ['local', 'regional', 'provincial', 'national', 'international'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={18} style={{ color: '#6366f1' }} />
            Estado de Fuentes RSS
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Diagnóstico en tiempo real de todos los medios configurados
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', opacity: loading ? 0.7 : 1 }}
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Actualizando...' : 'Actualizar ahora'}
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { icon: '🟢', label: 'Activas', count: totalActive - totalPartial, color: '#22c55e' },
          { icon: '🟡', label: 'Parcial', count: totalPartial, color: '#f59e0b' },
          { icon: '🔴', label: 'Caídas', count: totalDown, color: '#ef4444' },
          { icon: '⏸️', label: 'Pendientes', count: totalPending, color: '#6b7280' },
        ].map(chip => (
          <div key={chip.label} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)', padding: '0.35rem 0.75rem',
            fontSize: '0.8rem', fontWeight: 700
          }}>
            <span>{chip.icon}</span>
            <span style={{ color: chip.color }}>{chip.count}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{chip.label}</span>
          </div>
        ))}
      </div>

      {/* Table per category */}
      {categories.map(cat => {
        const feeds = RSS_FEEDS.filter(f => f.defaultCategory === cat);
        if (feeds.length === 0) return null;
        const catCfg = CATEGORY_LABELS[cat];

        return (
          <div key={cat} style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${catCfg.color}40`,
            overflow: 'hidden'
          }}>
            {/* Category header */}
            <div style={{
              background: catCfg.bg,
              borderBottom: `1px solid ${catCfg.color}30`,
              padding: '0.6rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                color: catCfg.color, letterSpacing: '0.06em'
              }}>
                {catCfg.label}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ({feeds.length} {feeds.length === 1 ? 'fuente' : 'fuentes'})
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)' }}>
                    {['Medio', 'URL RSS', 'Estado', 'Últ. actualización', 'Noticias', 'Respuesta', 'Conexión', 'Error detectado'].map(col => (
                      <th key={col} style={{
                        padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700,
                        color: 'var(--text-secondary)', fontSize: '0.7rem',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)'
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeds.map((feed, i) => {
                    const diag = diagMap[feed.id];
                    const isPending = feed.connectionType === 'pending';
                    const badge = getStatusBadge(diag, isPending);
                    const isEven = i % 2 === 0;

                    return (
                      <tr
                        key={feed.id}
                        style={{
                          background: isEven ? 'transparent' : 'rgba(255,255,255,0.02)',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                      >
                        {/* Medio */}
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {feed.name}
                        </td>

                        {/* URL RSS */}
                        <td style={{ padding: '0.6rem 0.75rem', maxWidth: '220px' }}>
                          {feed.url ? (
                            <a
                              href={feed.url}
                              target="_blank"
                              rel="noreferrer"
                              title={feed.url}
                              style={{
                                color: 'var(--primary)', textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: '200px', fontSize: '0.72rem'
                              }}
                            >
                              <ExternalLink size={10} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {feed.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
                                {feed.url.length > 60 ? '…' : ''}
                              </span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin URL</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: badge.bg, color: badge.color,
                            padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem', fontWeight: 700
                          }}>
                            {badge.icon} {badge.label}
                          </span>
                        </td>

                         {/* Última actualización */}
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          {isPending ? '—' : diag ? formatTs(diag.lastChecked) : '—'}
                        </td>

                        {/* Noticias obtenidas */}
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>
                          {isPending ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : diag ? (
                            <span style={{ color: diag.itemCount > 0 ? '#22c55e' : '#ef4444' }}>
                              {diag.itemCount}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Tiempo de respuesta */}
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {isPending ? '—' : diag?.responseTimeMs ? `${diag.responseTimeMs} ms` : '—'}
                        </td>

                        {/* Tipo de conexión */}
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '0.68rem', color: 'var(--text-secondary)',
                            background: 'var(--bg-tertiary)',
                            padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)',
                            fontFamily: 'monospace'
                          }}>
                            {diag ? (CONNECTION_LABELS[diag.connectionType] || diag.connectionType) : CONNECTION_LABELS[feed.connectionType] || feed.connectionType}
                          </span>
                        </td>

                        {/* Error detectado */}
                        <td style={{ padding: '0.6rem 0.75rem', maxWidth: '200px' }}>
                          {diag?.message ? (
                            <span
                              title={diag.message}
                              style={{
                                fontSize: '0.68rem', color: '#ef4444',
                                display: 'block', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px'
                              }}
                            >
                              ⚠️ {diag.message}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
