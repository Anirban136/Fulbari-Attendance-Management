import React from "react";

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to the RestaurantOS Administrator Dashboard.</p>
        </div>
        <button className="btn">
          Export Report
        </button>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Active Staff Today</h3>
          <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0' }}>12</p>
        </div>
        <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>On Break</h3>
          <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0' }}>2</p>
        </div>
        <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Pending Warnings</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--brand-secondary)', margin: '0' }}>3</p>
        </div>
      </div>

      {/* Recent Activity Table (Placeholder) */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Attendance Activity</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: '500' }}>Staff</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: '500' }}>Slot</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: '500' }}>Action</th>
              <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: '500' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem 0' }}>John Doe</td>
              <td style={{ padding: '1rem 0' }}>Staff1</td>
              <td style={{ padding: '1rem 0' }}><span style={{ color: 'var(--brand-primary)' }}>Shift Started</span></td>
              <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>09:05 AM</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem 0' }}>Jane Smith</td>
              <td style={{ padding: '1rem 0' }}>Staff2</td>
              <td style={{ padding: '1rem 0' }}><span style={{ color: 'var(--brand-secondary)' }}>Break Started</span></td>
              <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>13:30 PM</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
