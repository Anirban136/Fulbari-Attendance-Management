"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    monthlySalary: "",
    slotId: "",
    location: "Restaurant"
  });

  const fetchData = async () => {
    try {
      const staffRes = await fetch("/api/v1/staff");
      const slotsRes = await fetch("/api/v1/slots");
      const availableRes = await fetch("/api/v1/slots?available=true");
      
      setStaffList(await staffRes.json());
      setSlots(await slotsRes.json());
      setAvailableSlots(await availableRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setEditingStaff({ 
      ...editingStaff, 
      [name]: type === 'checkbox' ? (e.target as any).checked : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/v1/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      setIsAddModalOpen(false);
      setFormData({ name: "", phone: "", pin: "", monthlySalary: "", slotId: "", location: "Restaurant" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/v1/staff/${editingStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStaff)
      });
      setIsEditModalOpen(false);
      setEditingStaff(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will permanently remove all their attendance and payroll history.`)) {
      return;
    }
    try {
      await fetch(`/api/v1/staff/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Staff Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Assign staff to slots and manage profiles. Manage physical slots in <Link href="/admin/qr" style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}>Slot QRs</Link>.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setIsAddModalOpen(true)}>
            + Add New Staff
          </button>
        </div>
      </header>

      {/* Staff Table */}
      <div className="glass-panel">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Name</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Location</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Assigned Slot</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Salary Base</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff: any) => (
              <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: staff.isActive ? 1 : 0.6 }}>
                <td style={{ padding: '1rem 0', fontWeight: '500' }}>
                  {staff.name}
                  {!staff.isActive && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'var(--background-surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>Inactive</span>}
                </td>
                <td style={{ padding: '1rem 0' }}>{staff.location || "N/A"}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{ background: 'var(--background-surface-hover)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                    {staff.slot?.name || "Unassigned"}
                  </span>
                </td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>₹{staff.monthlySalary}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{ color: staff.isActive ? '#10b981' : '#ef4444' }}>
                    {staff.isActive ? 'Active' : 'Offline'}
                  </span>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEditingStaff(staff); setIsEditModalOpen(true); }} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(staff.id, staff.name)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No staff members added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--background-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Add New Staff</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Location</label>
                <select name="location" required className="input-base" value={formData.location} onChange={handleInputChange}>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe Hub">Cafe Hub</option>
                  <option value="Chai Hub">Chai Hub</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Slot Assignment</label>
                <select name="slotId" required className="input-base" value={formData.slotId} onChange={handleInputChange}>
                  <option value="">Select a Slot...</option>
                  {availableSlots.map((slot: any) => (
                    <option key={slot.id} value={slot.id}>{slot.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input name="name" required className="input-base" placeholder="John Doe" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input name="phone" required className="input-base" placeholder="+1234567890" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Login PIN (4 digits)</label>
                <input name="pin" required type="password" maxLength={4} className="input-base" placeholder="****" value={formData.pin} onChange={handleInputChange} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Monthly Salary (₹)</label>
                <input name="monthlySalary" required type="number" step="1" className="input-base" placeholder="25000" value={formData.monthlySalary} onChange={handleInputChange} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--background-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Edit Staff</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingStaff(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-surface)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold' }}>Active Status</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Individual slot will be freed if deactivated.</p>
                </div>
                <input 
                  type="checkbox" 
                  name="isActive" 
                  checked={editingStaff.isActive} 
                  onChange={handleEditInputChange}
                  style={{ width: '1.5rem', height: '1.5rem', accentColor: 'var(--brand-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Location</label>
                <select name="location" required className="input-base" value={editingStaff.location} onChange={handleEditInputChange}>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe Hub">Cafe Hub</option>
                  <option value="Chai Hub">Chai Hub</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Slot Assignment</label>
                <select name="slotId" required className="input-base" value={editingStaff.slotId} onChange={handleEditInputChange} disabled={!editingStaff.isActive}>
                  {slots.map((slot: any) => {
                    const isOtherAssigned = staffList.some(s => s.slotId === slot.id && s.id !== editingStaff.id && s.isActive);
                    if (isOtherAssigned) return null;
                    return <option key={slot.id} value={slot.id}>{slot.name}</option>;
                  })}
                </select>
                {!editingStaff.isActive && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>Re-enable account to assign a slot.</p>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input name="name" required className="input-base" value={editingStaff.name} onChange={handleEditInputChange} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Monthly Salary (₹)</label>
                <input name="monthlySalary" required type="number" step="1" className="input-base" value={editingStaff.monthlySalary} onChange={handleEditInputChange} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
