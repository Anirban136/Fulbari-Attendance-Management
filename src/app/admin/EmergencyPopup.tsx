"use client";
import React, { useState } from "react";

export default function EmergencyPopup({ alerts }: { alerts: { name: string, percent: number }[] }) {
  const [open, setOpen] = useState(true);

  if (!open || alerts.length === 0) return null;

  return (
    <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '2rem', position: 'relative' }}>
      <button 
        onClick={() => setOpen(false)} 
        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
      >
        &times;
      </button>
      <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
        ⚠️ Emergency Notification
      </h3>
      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>The following staff members have pending advances exceeding 50% of their monthly salary:</p>
      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-primary)' }}>
        {alerts.map((a, i) => (
          <li key={i} style={{ marginBottom: '0.25rem' }}>
            <strong style={{ color: '#ef4444' }}>{a.name}</strong> has taken <strong>{a.percent}%</strong> of their salary as advance.
          </li>
        ))}
      </ul>
    </div>
  );
}
