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
    take: 8,
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

  const currentMonthYear = today.toISOString().slice(0, 7);
  const releasedSalaries = await prisma.payrollRecord.findMany({
    where: { monthYear: currentMonthYear }
  });
  const totalMonthlyExpense = releasedSalaries.reduce((acc, curr) => acc + curr.finalPayable, 0);

  const formatState = (state: string) => {
    switch (state) {
      case 'SHIFT_STARTED': return <span style={{ color: 'var(--brand-primary-light)', fontWeight: '600' }}>Shift Started</span>;
      case 'ON_BREAK': return <span style={{ color: '#f59e0b', fontWeight: '600' }}>On Break</span>;
      case 'SHIFT_ENDED': return <span style={{ color: 'var(--brand-secondary)', fontWeight: '600' }}>Shift Ended</span>;
      default: return <span style={{ color: 'var(--text-muted)' }}>Not Started</span>;
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Executive Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Welcome to the Fulbari Restora intelligence hub.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-modern btn-secondary">
             Sync Data
          </button>
          <button className="btn-modern btn-primary">
            Export Report
          </button>
        </div>
      </header>
      
      <EmergencyPopup alerts={highAdvanceAlerts} />

      <DashboardStats 
        activeStaff={activeStaff}
        onBreakStaff={onBreakStaff}
        pendingAdvances={pendingAdvances}
        totalMonthlyExpense={totalMonthlyExpense}
      />

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Recent Attendance Activity</h2>
          <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary-light)', fontWeight: '600', cursor: 'pointer' }}>View All Activity</button>
        </div>
        
        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Assignment Slot</th>
                <th>Current Status</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td style={{ fontWeight: '600' }}>{activity.staff.name}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.8rem' }}>
                      {activity.staff.slot.name}
                    </span>
                  </td>
                  <td>{formatState(activity.state)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(activity.updatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {recentActivity.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                    No activity recorded for today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
