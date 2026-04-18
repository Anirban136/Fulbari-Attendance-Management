"use client";

import React, { useEffect, useState } from "react";

export default function SlotManagement() {
  const [slots, setSlots] = useState([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const slotsRes = await fetch("/api/v1/slots");
      setSlots(await slotsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/v1/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSlotName })
      });
      setIsSlotModalOpen(false);
      setNewSlotName("");
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/v1/slots/${editingSlot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingSlot.name })
      });
      setIsEditModalOpen(false);
      setEditingSlot(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All associated staff assignment history for this slot will be lost.`)) {
      return;
    }
    try {
      await fetch(`/api/v1/slots/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Slot Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your physical counters and access their QR codes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--background-surface)', border: '1px solid var(--border-color)' }} onClick={handlePrint}>
            Print All Labels
          </button>
          <button className="btn" onClick={() => setIsSlotModalOpen(true)}>
            + Add New Slot
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {slots.map((slot: any) => (
          <div key={slot.id} className="glass-panel" style={{ textAlign: 'center', padding: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => { setEditingSlot(slot); setIsEditModalOpen(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
              >
                Edit
              </button>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>{slot.name}</h3>
            
            <div style={{ 
              width: '180px', 
              height: '180px', 
              background: '#fff', 
              margin: '0 auto 1.5rem auto', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${slot.qrToken}`} 
                alt={slot.name} 
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            
            <div style={{ background: 'var(--background-surface)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              Token: {slot.qrToken}
            </div>
            
            <button className="btn" style={{ marginTop: '1rem', width: '100%', background: 'var(--background-surface)' }} onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${slot.qrToken}`, '_blank')}>
              Open HQ QR
            </button>
          </div>
        ))}

        {slots.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No slots created yet. Add a slot to get started.</p>
          </div>
        )}
      </div>

      {/* New Slot Modal */}
      {isSlotModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--background-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Add New Staff Slot</h2>
              <button onClick={() => setIsSlotModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Slot Name (e.g. Counter 1)</label>
                <input name="name" required className="input-base" placeholder="Counter 1" value={newSlotName} onChange={(e) => setNewSlotName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--background-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Edit Staff Slot</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingSlot(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <form onSubmit={handleUpdateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Slot Name</label>
                <input 
                  name="name" 
                  required 
                  className="input-base" 
                  value={editingSlot?.name || ""} 
                  onChange={(e) => setEditingSlot({ ...editingSlot, name: e.target.value })} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .admin-sidebar, .btn, header, .admin-main > header {
            display: none !important;
          }
          .glass-panel {
            border: 1px solid #000 !important;
            break-inside: avoid;
            margin-bottom: 2rem;
          }
          .admin-main {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
