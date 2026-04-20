import React from "react";


export const dynamic = 'force-dynamic';

import prisma from '../../lib/prisma';

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeStaffCount = await prisma.attendanceRecord.count({
    where: {
      shiftDate: { gte: today },
      state: 'SHIFT_STARTED'
    }
  });

  const onBreakCount = await prisma.attendanceRecord.count({
    where: {
      shiftDate: { gte: today },
      state: 'ON_BREAK'
    }
  });

  const pendingAdvancesCount = await prisma.advance.count({
    where: {
      status: 'PENDING',
      isActive: true
    }
  });

  const recentActivity = await prisma.attendanceRecord.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      staff: {
        include: {
          slot: true
        }
      }
    }
  });

  const formatState = (state: string) => {
    switch (state) {
      case 'SHIFT_STARTED': return <span style={{ color: 'var(--brand-primary)' }}>Shift Started</span>;
      case 'ON_BREAK': return <span style={{ color: 'var(--brand-secondary)' }}>On Break</span>;
      case 'SHIFT_ENDED': return <span style={{ color: '#ef4444' }}>Shift Ended</span>;
      default: return <span style={{ color: 'var(--text-secondary)' }}>Not Started</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to the Fulbari Restora Administrator Dashboard.</p>
        </div>
        <button className="btn">
          Export Report
        </button>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Active Staff Today</h3>
          <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0' }}>{activeStaffCount}</p>
        </div>
        <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>On Break</h3>
          <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0' }}>{onBreakCount}</p>
        </div>
        <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Pending Advances</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--brand-secondary)', margin: '0' }}>{pendingAdvancesCount}</p>
        </div>
      </div>

      {/* Recent Activity Table */}
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
            {recentActivity.map((activity) => (
              <tr key={activity.id} style={{ borderBottom: 'auto' }}>
                <td style={{ padding: '1rem 0' }}>{activity.staff.name}</td>
                <td style={{ padding: '1rem 0' }}>{activity.staff.slot.name}</td>
                <td style={{ padding: '1rem 0' }}>{formatState(activity.state)}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>
                  {new Date(activity.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {recentActivity.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No recent activity today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
