"use client";

import React, { useState, useEffect } from "react";

export default function DocumentsTab({ staffId }: { staffId: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [staffId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', type);

    try {
      const res = await fetch(`/api/v1/staff/${staffId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const docTypes = [
    { id: 'PAN', label: 'PAN Card' },
    { id: 'AADHAAR', label: 'Aadhaar Card' },
    { id: 'VOTER_ID', label: 'Voter ID' },
  ];

  if (loading) return <div>Loading documents...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {docTypes.map((type) => {
          const doc = documents.find(d => d.documentType === type.id);
          return (
            <div key={type.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{type.label}</h3>
              
              {doc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ 
                    height: '150px', 
                    background: 'var(--background-surface)', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    {doc.fileUrl.match(/\.(jpg|jpeg|png)$/i) ? (
                      <img 
                        src={`/api/v1/documents/${doc.fileUrl}`} 
                        alt={type.label} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '2rem' }}>📄</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PDF Document</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a 
                      href={`/api/v1/documents/${doc.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn" 
                      style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', padding: '0.5rem' }}
                    >
                      View Full
                    </a>
                    <label className="btn" style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', padding: '0.5rem', background: 'var(--background-surface-hover)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Replace
                      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleUpload(e, type.id)} disabled={uploading} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  height: '150px', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No document uploaded</p>
                  <label className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', cursor: 'pointer' }}>
                    Upload {type.id}
                    <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleUpload(e, type.id)} disabled={uploading} />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {uploading && <div style={{ textAlign: 'center', color: 'var(--brand-primary)' }}>Uploading...</div>}
    </div>
  );
}
