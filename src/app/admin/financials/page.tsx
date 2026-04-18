"use client";

import React, { useEffect, useState } from "react";

export default function FinancialsManagement() {
  const [advances, setAdvances] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ staffId: "", amount: "" });
  const [editingAdv, setEditingAdv] = useState<any>(null);
  
  // Filters
  const [filterStaffId, setFilterStaffId] = useState("");
  const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM

  const fetchData = async () => {
    try {
      const advRes = await fetch("/api/v1/advance");
      const staffRes = await fetch("/api/v1/staff");
      setAdvances(await advRes.json());
      setStaffList(await staffRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/v1/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ staffId: "", amount: "" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/v1/advance/${editingAdv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAdv)
      });
      setIsEditModalOpen(false);
      setEditingAdv(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (adv: any) => {
    try {
      await fetch(`/api/v1/advance/${adv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !adv.isActive })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const activeAdvances = advances.filter((a: any) => a.isActive && a.status === 'PENDING');
  
  const historyAdvances = advances.filter((a: any) => {
    const matchesStaff = filterStaffId ? a.staffId === filterStaffId : true;
    const matchesMonth = filterMonth ? a.date.startsWith(filterMonth) : true;
    return matchesStaff && matchesMonth;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Financials & Payroll</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage advances and track employee financial records.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary">
            Calculate Payroll
          </button>
          <button className="btn" onClick={() => setIsModalOpen(true)}>
            + Add Advance
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Active Advances (Settlement Pending) */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Advances Pending Settlement</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Staff</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Amount</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAdvances.map((adv: any) => (
                <tr key={adv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: '500' }}>{adv.staff?.name}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--brand-secondary)', fontWeight: 'bold' }}>-₹{adv.amount}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{new Date(adv.date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setEditingAdv(adv); setIsEditModalOpen(true); }} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                      <button onClick={() => toggleActive(adv)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem' }}>Mark Inactive</button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeAdvances.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No active advances pending.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* History Section */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Advance Payment History</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select className="input-base" style={{ width: 'auto', padding: '0.5rem' }} value={filterStaffId} onChange={(e) => setFilterStaffId(e.target.value)}>
                <option value="">All Staff</option>
                {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="month" className="input-base" style={{ width: 'auto', padding: '0.5rem' }} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Staff</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Amount</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyAdvances.map((adv: any) => (
                <tr key={adv.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: adv.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '1rem 0' }}>{adv.staff?.name}</td>
                  <td style={{ padding: '1rem 0' }}>₹{adv.amount}</td>
                  <td style={{ padding: '1rem 0' }}>{new Date(adv.date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: adv.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', 
                      color: adv.isActive ? '#10b981' : '#64748b',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${adv.isActive ? '#10b981' : '#64748b'}`
                    }}>
                      {adv.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Advance Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--background-base)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Log Advance Payment</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Select Staff</label>
                <select name="staffId" required className="input-base" value={formData.staffId} onChange={(e) => setFormData({...formData, staffId: e.target.value})}>
                  <option value="">Select Staff Member...</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                <input name="amount" required type="number" step="0.01" className="input-base" placeholder="50.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Confirm Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Advance Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--background-base)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Edit Advance Record</h2>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Staff: {editingAdv?.staff?.name}</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                <input 
                  name="amount" 
                  required 
                  type="number" 
                  step="0.01" 
                  className="input-base" 
                  value={editingAdv?.amount || ""} 
                  onChange={(e) => setEditingAdv({...editingAdv, amount: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setIsEditModalOpen(false); setEditingAdv(null); }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
