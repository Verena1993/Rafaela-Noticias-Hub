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
  const { addMultimediaToCoverage, addSharedLinkToCoverage } = useHub();
  
  const [activeTab, setActiveTab] = useState<'files' | 'links' | 'drive'>('files');
  const [dragActive, setDragActive] = useState(false);

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
              {coverage.multimedia.map(item => (
                <div key={item.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {item.type === 'photo' && item.url.startsWith('http') ? (
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getFileIcon(item.type)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.name}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.size}</p>
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Integración con Google Drive</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            Prepara la estructura corporativa. En futuras versiones, al crear una cobertura, se generará automáticamente una carpeta en Drive para almacenar crudos, audios pesados y documentos de la investigación.
          </p>
          <button className="btn btn-secondary" disabled style={{ opacity: 0.7 }}>
            Conectar cuenta corporativa (Próximamente)
          </button>
        </div>
      )}
    </div>
  );
};
