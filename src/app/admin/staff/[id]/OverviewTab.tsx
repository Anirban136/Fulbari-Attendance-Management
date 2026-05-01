"use client";

import React, { useState } from "react";

export default function OverviewTab({ staff, refresh }: { staff: any; refresh: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: staff.name,
    phone: staff.phone,
    address: staff.address || "",
    emergencyContact: staff.emergencyContact || "",
    monthlySalary: staff.monthlySalary
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/v1/staff/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      setIsEditing(false);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const metrics = [
    { label: "Attendance Rate", value: `${staff.metrics?.attendanceRate || 0}%`, color: "var(--brand-primary)" },
    { label: "Days Worked", value: staff.metrics?.totalDaysWorked || 0, color: "#10b981" },
    { label: "Total Leaves", value: staff.metrics?.totalLeaves?.total || 0, color: "#ef4444" },
    { label: "Total Advances", value: `₹${staff.metrics?.totalAdvanceTaken || 0}`, color: "#f59e0b" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {metrics.map((m, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{m.label}</p>
            <h3 style={{ fontSize: '1.5rem', color: m.color }}>{m.value}</h3>
          </div>
        ))}
      </div>

      {/* Details Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Employee Details</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="btn" 
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: isEditing ? 'var(--background-surface-hover)' : 'var(--brand-primary)', color: isEditing ? 'var(--text-primary)' : 'white' }}
          >
            {isEditing ? "Cancel" : "Edit Details"}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label className="label-base">Full Name</label>
              <input 
                className="input-base" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="label-base">Phone Number</label>
              <input 
                className="input-base" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="label-base">Monthly Salary (₹)</label>
              <input 
                className="input-base" 
                type="number" 
                value={formData.monthlySalary} 
                onChange={(e) => setFormData({...formData, monthlySalary: Number(e.target.value)})} 
                required 
              />
            </div>
            <div>
              <label className="label-base">Emergency Contact</label>
              <input 
                className="input-base" 
                value={formData.emergencyContact} 
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label-base">Address</label>
              <textarea 
                className="input-base" 
                style={{ minHeight: '80px', paddingTop: '0.5rem' }} 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn" style={{ width: '100%' }}>Save Changes</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <DetailItem label="Full Name" value={staff.name} />
            <DetailItem label="Phone Number" value={staff.phone} />
            <DetailItem label="Monthly Salary" value={`₹${staff.monthlySalary}`} />
            <DetailItem label="Joining Date" value={new Date(staff.joiningDate).toLocaleDateString()} />
            <DetailItem label="Emergency Contact" value={staff.emergencyContact || "Not provided"} />
            <DetailItem label="Address" value={staff.address || "Not provided"} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontWeight: '500' }}>{value}</p>
    </div>
  );
}
