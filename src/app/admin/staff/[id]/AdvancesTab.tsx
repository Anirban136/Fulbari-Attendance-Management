"use client";

import React, { useState, useEffect } from "react";

export default function AdvancesTab({ staffId }: { staffId: string }) {
  const [advances, setAdvances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdvances = async () => {
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/advances`);
      const data = await res.json();
      setAdvances(data.advances);
      setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, [staffId]);

  if (loading) return <div>Loading advances...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--background-surface)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Running Balance</p>
        <h2 style={{ fontSize: '1.5rem', color: '#f59e0b' }}>₹{summary?.totalBalance || 0}</h2>
      </div>

      <div className="glass-panel">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Amount</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {advances.map((adv: any) => (
              <tr key={adv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{new Date(adv.date).toLocaleDateString()}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{adv.amount}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    background: adv.status === 'PENDING' ? '#fef3c7' : '#d1fae5', 
                    color: adv.status === 'PENDING' ? '#92400e' : '#065f46' 
                  }}>
                    {adv.status}
                  </span>
                </td>
              </tr>
            ))}
            {advances.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No advance history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
