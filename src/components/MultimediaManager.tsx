import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  UploadCloud, Image as ImageIcon, Video, Music, FileText, 
  Link as LinkIcon, Download, Trash2, ExternalLink, HardDrive
} from 'lucide-react';
import type { MultimediaItem, Coverage } from '../data/mockData';

interface MultimediaManagerProps {
  coverage: Coverage;
}

export const MultimediaManager: React.FC<MultimediaManagerProps> = ({ coverage }) => {
  const { addMultimediaToCoverage, addSharedLinkToCoverage, users } = useHub();
  
  const [activeTab, setActiveTab] = useState<'files' | 'links' | 'drive'>('files');
  const [dragActive, setDragActive] = useState(false);
  const [showMobileUploadModal, setShowMobileUploadModal] = useState(false);

  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      // Simulate file upload
      let type: MultimediaItem['type'] = 'document';
      if (file.type.startsWith('image/')) type = 'photo';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('audio/')) type = 'audio';

      const simulatedUrl = URL.createObjectURL(file); // Temporary blob URL for preview
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      addMultimediaToCoverage(coverage.id, file.name, type, simulatedUrl, sizeMB);
    });
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl || !newLinkTitle) return;
    addSharedLinkToCoverage(coverage.id, newLinkTitle, newLinkUrl);
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const getFileIcon = (type: MultimediaItem['type']) => {
    switch(type) {
      case 'photo': return <ImageIcon size={24} style={{ color: '#3b82f6' }} />;
      case 'video': return <Video size={24} style={{ color: '#ef4444' }} />;
      case 'audio': return <Music size={24} style={{ color: '#8b5cf6' }} />;
      case 'document': return <FileText size={24} style={{ color: '#10b981' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      {/* Internal Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('files')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: 600, color: activeTab === 'files' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'files' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Archivos Subidos ({coverage.multimedia.length})
        </button>
        <button 
          onClick={() => setActiveTab('links')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: 600, color: activeTab === 'links' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'links' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Enlaces / Fuentes ({coverage.sharedLinks?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('drive')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: 600, color: activeTab === 'drive' ? '#10b981' : 'var(--text-secondary)',
            borderBottom: activeTab === 'drive' ? '2px solid #10b981' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}
        >
          <HardDrive size={16} /> Google Drive
        </button>
      </div>

      {activeTab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', margin: 0 }}>Carga Rápida</h4>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '0.85rem' }}
              onClick={() => setShowMobileUploadModal(true)}
            >
              <UploadCloud size={16} /> Subir desde celular
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              multiple 
              style={{ display: 'none' }} 
              onChange={handleChange}
            />
            <UploadCloud size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Haz clic para subir o arrastra archivos aquí</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Soporta Fotos, Videos, Audios y Documentos (.pdf, .docx)</p>
          </div>

          {/* Files Grid */}
          {coverage.multimedia.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>
              No hay archivos multimedia subidos a esta cobertura.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {[...coverage.multimedia].sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).map(item => (
                <div key={item.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {item.type === 'photo' ? (
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : item.type === 'video' ? (
                      <video src={item.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : item.type === 'audio' ? (
                      <audio src={item.url} controls style={{ width: '95%' }} />
                    ) : (
                      getFileIcon(item.type)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.name}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {new Date(item.uploadDate).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      <br />
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        {item.userId ? (users.find(u => u.id === item.userId)?.name.split(' ')[0] || 'Usuario') : 'Usuario'}
                      </span>
                      {' • '}{item.size}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Descargar">
                      <Download size={14} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-text)' }} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'links' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <form onSubmit={handleAddLink} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Título del Enlace</label>
              <input type="text" className="form-input" placeholder="Ej: Video testimonio en Youtube" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} />
            </div>
            <div style={{ flex: 2 }}>
              <label className="form-label">URL del Enlace</label>
              <input type="url" className="form-input" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1rem' }}>
              <LinkIcon size={16} /> Añadir
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {(coverage.sharedLinks || []).length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No hay enlaces vinculados.</p>
            ) : (
              (coverage.sharedLinks || []).map(link => (
                <div key={link.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '50%' }}>
                      <LinkIcon size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{link.title}</h4>
                      <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <ExternalLink size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'drive' && (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)' }}>
          <HardDrive size={48} style={{ color: '#10b981', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Carpeta Compartida de Google Drive</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
            La carpeta de esta actividad será generada automáticamente para almacenar el crudo y los documentos pesados.
          </p>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'inline-block', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nombre de carpeta asignado:</span>
            <strong style={{ fontSize: '0.9rem' }}>{coverage.dateTime.split('T')[0]} - {coverage.title}</strong>
          </div>
          <br />
          <button className="btn btn-secondary" disabled style={{ opacity: 0.7 }}>
            Sincronizar con Drive (Próximamente)
          </button>
        </div>
      )}
      {/* Modal Subir desde celular */}
      {showMobileUploadModal && (
        <div className="modal-overlay" style={{ zIndex: 110 }} onClick={() => setShowMobileUploadModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Subir material desde el móvil</h3>
              <button className="modal-close" onClick={() => setShowMobileUploadModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', padding: '2rem 1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Escanea este código QR con la cámara de tu celular para abrir directamente la carpeta de subida de esta cobertura.
              </p>
              <div style={{ width: '180px', height: '180px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 'var(--radius-md)' }}>
                {/* Mock QR Code */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', width: '120px', height: '120px' }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} style={{ backgroundColor: Math.random() > 0.4 ? '#0f172a' : 'transparent' }}></div>
                  ))}
                </div>
              </div>
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>O copia este enlace de subida rápida</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" readOnly className="form-input" value={`https://hub.rafaelanoticias.com/upload/${coverage.id}`} style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-tertiary)' }} />
                  <button className="btn btn-secondary" onClick={() => alert('¡Copiado!')}>Copiar</button>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowMobileUploadModal(false)}>Listo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
