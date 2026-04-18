"use client";

import React, { useState, useEffect } from 'react';

type Step = 'SCAN' | 'PIN' | 'ACTIONS' | 'SUCCESS';

export default function KioskPage() {
  const [step, setStep] = useState<Step>('SCAN');
  const [qrToken, setQrToken] = useState('');
  const [slots, setSlots] = useState([]);
  const [staff, setStaff] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // For simulation: fetch slots
  useEffect(() => {
    fetch('/api/v1/slots')
      .then(res => res.json())
      .then(setSlots)
      .catch(console.error);
  }, []);

  const handleScan = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStaff(data);
      setQrToken(token);
      setStep('PIN');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (finalPin: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staff.staffId, pin: finalPin })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatus(data);
      setStep('ACTIONS');
    } catch (e: any) {
      setError(e.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staff.staffId, action })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStep('SUCCESS');
      setTimeout(() => {
        resetKiosk();
      }, 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setStep('SCAN');
    setQrToken('');
    setStaff(null);
    setPin('');
    setStatus(null);
    setError('');
  };

  const appendPin = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handlePinSubmit(newPin);
      }
    }
  };

  return (
    <div className="kiosk-container" style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
      padding: '2rem'
    }}>
      
      <div className="glass-panel animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '3rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        
        {step === 'SCAN' && (
          <>
            <h1 className="text-gradient">Scan QR Code</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Position the slot QR code in front of the camera</p>
            
            <div style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '20px' }}>
              {/* Simulation buttons */}
              <p style={{ fontSize: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Simulate Scan:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {slots.map((s: any) => (
                  <button key={s.id} onClick={() => handleScan(s.qrToken)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            {error && <p style={{ color: 'var(--brand-secondary)' }}>{error}</p>}
          </>
        )}

        {step === 'PIN' && (
          <>
            <div>
              <h1 className="text-gradient">Welcome, {staff?.staffName}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Enter your 4-digit PIN</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1rem 0' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  background: pin.length > i ? 'var(--brand-primary)' : 'var(--background-base)',
                  border: '1px solid var(--border-color)',
                  boxShadow: pin.length > i ? 'var(--shadow-glow)' : 'none'
                }} />
              ))}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => (
                <button 
                  key={k} 
                  disabled={loading}
                  onClick={() => {
                    if (k === 'C') setPin('');
                    else if (k === '⌫') setPin(pin.slice(0, -1));
                    else appendPin(k);
                  }}
                  className="btn" 
                  style={{ 
                    height: '60px', 
                    fontSize: '1.25rem',
                    background: (k === 'C' || k === '⌫') ? 'var(--background-surface)' : undefined,
                    border: (k === 'C' || k === '⌫') ? '1px solid var(--border-color)' : undefined
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
            {error && <p style={{ color: 'var(--brand-secondary)' }}>{error}</p>}
            <button onClick={resetKiosk} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          </>
        )}

        {step === 'ACTIONS' && (
          <>
            <div>
              <h1 className="text-gradient">Choose Action</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Status: {status.currentState.replace('_', ' ')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {status.currentState === 'NOT_STARTED' && (
                <button className="btn" onClick={() => handleAction('START_SHIFT')} style={{ height: '80px', fontSize: '1.5rem' }}>
                  ☀️ Start Shift
                </button>
              )}
              {status.currentState === 'SHIFT_STARTED' && (
                <>
                  <button className="btn" onClick={() => handleAction('START_BREAK')} style={{ height: '80px', fontSize: '1.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    ☕ Take Break
                  </button>
                  <button className="btn" onClick={() => handleAction('END_SHIFT')} style={{ height: '80px', fontSize: '1.5rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    🏠 End Shift
                  </button>
                </>
              )}
              {status.currentState === 'ON_BREAK' && (
                <button className="btn" onClick={() => handleAction('END_BREAK')} style={{ height: '80px', fontSize: '1.5rem' }}>
                  🔙 End Break
                </button>
              )}
              {status.currentState === 'SHIFT_ENDED' && (
                <div style={{ padding: '2rem' }}>
                  <p>You have already finished your shift for today.</p>
                </div>
              )}
            </div>
            <button onClick={resetKiosk} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '1rem' }}>Done</button>
          </>
        )}

        {step === 'SUCCESS' && (
          <div className="animate-fade-in">
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
            <h1 className="text-gradient">Success!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Action logged successfully. Redirecting...</p>
          </div>
        )}

      </div>
      
      <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        RestaurantOS v1.0 • Kiosk Terminal
      </p>
    </div>
  );
}
