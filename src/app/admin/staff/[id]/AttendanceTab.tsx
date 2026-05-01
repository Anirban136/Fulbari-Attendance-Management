"use client";

import React, { useState, useEffect } from "react";

export default function AttendanceTab({ staffId }: { staffId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [calendarData, setCalendarData] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const fetchCalendar = async () => {
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/attendance?month=${currentMonth}`);
      const data = await res.json();
      setCalendarData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth]);

  const handleMarkLeave = async (type: string) => {
    try {
      await fetch(`/api/v1/staff/${staffId}/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.fullDate,
          type,
          markedBy: "Admin"
        })
      });
      setIsLeaveModalOpen(false);
      fetchCalendar();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLeave = async () => {
    try {
      await fetch(`/api/v1/staff/${staffId}/leaves?date=${selectedDate.fullDate}`, {
        method: "DELETE"
      });
      setIsLeaveModalOpen(false);
      fetchCalendar();
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar Helpers
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const days = [];
  // Empty slots for start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentMonth}-${i.toString().padStart(2, '0')}`;
    days.push({
      day: i,
      fullDate: dateStr,
      data: calendarData[dateStr]
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return '#10b981'; // Green
      case 'FULL_LEAVE': return '#ef4444'; // Red
      case 'HALF_LEAVE': return '#f59e0b'; // Orange
      case 'IN_PROGRESS': return '#3b82f6'; // Blue
      default: return 'var(--border-color)'; // Grey
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Attendance Calendar</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn" style={{ padding: '0.25rem 0.5rem' }} onClick={() => {
            const d = new Date(year, month - 2);
            setCurrentMonth(d.toISOString().slice(0, 7));
          }}>&larr;</button>
          <input 
            type="month" 
            className="input-base" 
            style={{ width: 'auto', padding: '0.25rem 0.5rem' }} 
            value={currentMonth} 
            onChange={(e) => setCurrentMonth(e.target.value)} 
          />
          <button className="btn" style={{ padding: '0.25rem 0.5rem' }} onClick={() => {
            const d = new Date(year, month);
            setCurrentMonth(d.toISOString().slice(0, 7));
          }}>&rarr;</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>{d}</div>
        ))}
        {days.map((day, i) => (
          <div 
            key={i} 
            onClick={() => { if(day) { setSelectedDate(day); setIsLeaveModalOpen(true); } }}
            style={{ 
              aspectRatio: '1', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '0.5rem',
              cursor: day ? 'pointer' : 'default',
              background: day?.data ? `${getStatusColor(day.data.status)}15` : 'transparent',
              borderColor: day?.data ? getStatusColor(day.data.status) : 'var(--border-color)',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            {day && (
              <>
                <span style={{ fontSize: '0.875rem' }}>{day.day}</span>
                {day.data && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '0.5rem', 
                    right: '0.5rem', 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: getStatusColor(day.data.status) 
                  }} />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', justifyContent: 'center' }}>
        <LegendItem color="#10b981" label="Present" />
        <LegendItem color="#f59e0b" label="Half Day" />
        <LegendItem color="#ef4444" label="Full Leave" />
        <LegendItem color="#3b82f6" label="In Progress" />
      </div>

      {/* Date Detail / Leave Modal */}
      {isLeaveModalOpen && selectedDate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--background-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Details for {new Date(selectedDate.fullDate).toLocaleDateString()}</h2>
              <button onClick={() => setIsLeaveModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {selectedDate.data ? (
                <div style={{ background: 'var(--background-surface)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Status: {selectedDate.data.status}</p>
                  {selectedDate.data.startTime && <p>Start: {new Date(selectedDate.data.startTime).toLocaleTimeString()}</p>}
                  {selectedDate.data.endTime && <p>End: {new Date(selectedDate.data.endTime).toLocaleTimeString()}</p>}
                  {selectedDate.data.workHours && <p>Work Hours: {selectedDate.data.workHours}h</p>}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No attendance data for this day.</p>
              )}

              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Admin Controls</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button className="btn" style={{ background: '#ef4444', flex: 1 }} onClick={() => handleMarkLeave('FULL')}>Full Leave</button>
                <button className="btn" style={{ background: '#f59e0b', flex: 1 }} onClick={() => handleMarkLeave('HALF')}>Half Leave</button>
                {selectedDate.data?.status.includes('LEAVE') && (
                   <button className="btn" style={{ background: 'var(--background-surface-hover)', color: 'var(--text-primary)', width: '100%' }} onClick={handleDeleteLeave}>Remove Leave</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
      <span>{label}</span>
    </div>
  );
}
