import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Globe, Share2, Camera, MonitorPlay, CheckCircle, 
  Clock, Edit3, Lightbulb, Filter, Search 
} from 'lucide-react';
import { formatFriendlyDate } from '../utils/dateUtils';

type PlatformType = 'portal' | 'facebook' | 'instagram' | 'youtube';
type PubStatus = 'Idea' | 'En Producción' | 'Programado' | 'Publicado';

interface PubItem {
  id: string;
  coverageId: string;
  coverageTitle: string;
  platform: PlatformType;
  status: PubStatus;
  date: string;
}

const PLATFORM_ICONS: Record<PlatformType, React.ReactNode> = {
  portal: <Globe size={16} color="#3b82f6" />,
  facebook: <Share2 size={16} color="#1877f2" />,
  instagram: <Camera size={16} color="#e1306c" />,
  youtube: <MonitorPlay size={16} color="#ff0000" />
};

const PLATFORM_LABELS: Record<PlatformType, string> = {
  portal: 'Portal Web',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube'
};

const STATUS_ICONS: Record<PubStatus, React.ReactNode> = {
  'Idea': <Lightbulb size={14} />,
  'En Producción': <Edit3 size={14} />,
  'Programado': <Clock size={14} />,
  'Publicado': <CheckCircle size={14} />
};

const STATUS_COLORS: Record<PubStatus, string> = {
  'Idea': '#f59e0b',
  'En Producción': '#3b82f6',
  'Programado': '#8b5cf6',
  'Publicado': '#10b981'
};

export const Publications: React.FC = () => {
  const { productions } = useHub();
  const [activePlatform, setActivePlatform] = useState<PlatformType | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<PubStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const deriveStatus = (prodStatus: string, isPublished: boolean, dateStr?: string): PubStatus => {
    if (isPublished) return 'Publicado';
    if (prodStatus === 'pendiente_planificacion') return 'Idea';
    
    if (dateStr) {
      const covDate = new Date(dateStr + 'T00:00:00');
      const now = new Date();
      if (covDate > now) return 'Programado';
    }

    return 'En Producción';
  };

  const allPubs: PubItem[] = productions.flatMap(prod => {
    const platforms: PlatformType[] = ['portal', 'facebook', 'instagram', 'youtube'];
    const prodDateTime = prod.productionDate 
      ? `${prod.productionDate}T${prod.productionTime || '00:00'}`
      : new Date().toISOString();

    return platforms.map(plat => {
      const isPublished = (prod.mediaOutlets || []).includes(plat);
      return {
        id: `${prod.id}_${plat}`,
        coverageId: prod.id,
        coverageTitle: prod.title,
        platform: plat,
        status: deriveStatus(prod.status, isPublished, prod.productionDate),
        date: prodDateTime
      };
    });
  });

  const filteredPubs = allPubs.filter(p => {
    const matchesPlat = activePlatform === 'all' || p.platform === activePlatform;
    const matchesStat = activeStatus === 'all' || p.status === activeStatus;
    const matchesSearch = p.coverageTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlat && matchesStat && matchesSearch;
  });

  return (
    <div className="publications-module" style={{ padding: '0 1rem' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={22} style={{ color: 'var(--primary)' }} />
            Centro de Publicaciones
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Monitor unificado de distribución en Portal Web y Redes Sociales.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar cobertura..." 
            style={{ paddingLeft: '2.2rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" value={activePlatform} onChange={e => setActivePlatform(e.target.value as any)}>
            <option value="all">Todas las plataformas</option>
            <option value="portal">Portal Web</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <select className="form-select" value={activeStatus} onChange={e => setActiveStatus(e.target.value as any)}>
            <option value="all">Todos los estados</option>
            <option value="Idea">Idea</option>
            <option value="En Producción">En Producción</option>
            <option value="Programado">Programado</option>
            <option value="Publicado">Publicado</option>
          </select>
        </div>
      </div>

      <div className="table-responsive-wrapper card" style={{ padding: '0' }}>
        <table className="production-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <tr>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Plataforma</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cobertura Asociada</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fecha / Hora Ref.</th>
            </tr>
          </thead>
          <tbody>
            {filteredPubs.map(pub => (
              <tr key={pub.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover-card-bg">
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    {PLATFORM_ICONS[pub.platform]}
                    {PLATFORM_LABELS[pub.platform]}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {pub.coverageTitle.replace(/^\[.*?\] /, '')}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem', 
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: `${STATUS_COLORS[pub.status]}15`,
                    color: STATUS_COLORS[pub.status]
                  }}>
                    {STATUS_ICONS[pub.status]}
                    {pub.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {formatFriendlyDate(pub.date)}
                </td>
              </tr>
            ))}
            {filteredPubs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No se encontraron publicaciones con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
