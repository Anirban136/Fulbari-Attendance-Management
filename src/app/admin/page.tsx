import React from "react";

export const dynamic = 'force-dynamic';

import prisma from '../../lib/prisma';
import DashboardStats from "./DashboardStats";
import EmergencyPopup from "./EmergencyPopup";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeStaffRecords = await prisma.attendanceRecord.findMany({
    where: {
      shiftDate: { gte: today },
      state: 'SHIFT_STARTED'
    },
    include: { staff: true }
  });

  const onBreakStaffRecords = await prisma.attendanceRecord.findMany({
    where: {
      shiftDate: { gte: today },
      state: 'ON_BREAK'
    },
    include: { 
      staff: true,
      breaks: {
        orderBy: { startTime: 'desc' },
        take: 1
      }
    }
  });

  const pendingAdvancesRecords = await prisma.advance.findMany({
    where: {
      status: 'PENDING',
      isActive: true
    },
    include: { staff: true }
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

  const timeOptions: Intl.DateTimeFormatOptions = { 
    timeZone: 'Asia/Kolkata', 
    hour: '2-digit', 
    minute: '2-digit' 
  };

  const activeStaff = activeStaffRecords.map(r => ({ 
    id: r.staff.id, 
    name: r.staff.name,
    extra: r.startTime ? `Shift started: ${r.startTime.toLocaleTimeString('en-IN', timeOptions)}` : ''
  }));
  
  const onBreakStaff = onBreakStaffRecords.map(r => {
    const latestBreak = r.breaks[0];
    return { 
      id: r.staff.id, 
      name: r.staff.name,
      extra: latestBreak?.startTime ? `Break started: ${latestBreak.startTime.toLocaleTimeString('en-IN', timeOptions)}` : ''
    };
  });
  
  // Calculate high advance alerts
  const staffAdvancesMap = new Map<string, { name: string, total: number, salary: number }>();
  pendingAdvancesRecords.forEach(a => {
    const existing = staffAdvancesMap.get(a.staffId) || { name: a.staff.name, total: 0, salary: a.staff.monthlySalary };
    existing.total += a.amount;
    staffAdvancesMap.set(a.staffId, existing);
  });

  const highAdvanceAlerts: { name: string, percent: number }[] = [];
  staffAdvancesMap.forEach(data => {
    if (data.total > data.salary * 0.5 && data.salary > 0) {
      highAdvanceAlerts.push({ name: data.name, percent: Math.round((data.total / data.salary) * 100) });
    }
  });

  const pendingAdvances = pendingAdvancesRecords.map(a => ({ 
    id: a.id, 
    name: a.staff.name, 
    extra: `₹${a.amount}` 
  }));

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
      
      <EmergencyPopup alerts={highAdvanceAlerts} />

      {/* Stats Cards */}
      <DashboardStats 
        activeStaff={activeStaff}
        onBreakStaff={onBreakStaff}
        pendingAdvances={pendingAdvances}
      />

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
                  {new Date(activity.updatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
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
