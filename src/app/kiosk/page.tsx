"use client";

import React, { useState, useEffect, useCallback } from 'react';

type Step = 'IDLE' | 'SCANNING' | 'IDENTIFIED' | 'ACTIONS' | 'SUCCESS' | 'ERROR';

interface DeviceInfo {
  status: 'READY' | 'NOT_READY' | 'NOT_FOUND' | 'BUSY';
  port: number | null;
  deviceName?: string;
  serialNo?: string;
  message: string;
}

interface CaptureResult {
  success: boolean;
  pidData: string;
  pidDataHash: string;
  quality: number;
  errorCode?: string;
  errorMessage?: string;
  devicePort: number;
}

// Mantra RD Service ports to scan
const RD_SERVICE_PORTS = [11100, 11101, 11102, 11103, 11104, 11105];
const CAPTURE_TIMEOUT_MS = 15000;

const CAPTURE_XML = `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="0" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="${CAPTURE_TIMEOUT_MS}" otp="" wadh="" posh="UNKNOWN" />
</PidOptions>`;

async function discoverDevice(): Promise<DeviceInfo> {
  for (const port of RD_SERVICE_PORTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`http://127.0.0.1:${port}`, {
        method: 'RDSERVICE',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const xmlText = await response.text();
      if (xmlText.includes('READY') || xmlText.includes('ready')) {
        return { status: 'READY', port, deviceName: 'Mantra MFS110', message: 'Scanner ready' };
      } else if (xmlText.includes('NOTREADY')) {
        return { status: 'NOT_READY', port, message: 'Scanner found but not ready' };
      }
    } catch { continue; }
  }
  return { status: 'NOT_FOUND', port: null, message: 'Scanner not detected. Ensure RD Service is running.' };
}

async function captureFingerprint(port: number): Promise<CaptureResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS + 5000);
    const response = await fetch(`http://127.0.0.1:${port}/rd/capture`, {
      method: 'CAPTURE',
      headers: { 'Content-Type': 'text/xml' },
      body: CAPTURE_XML,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const xmlText = await response.text();
    const errorCodeMatch = xmlText.match(/errCode="([^"]+)"/i);
    const errorInfoMatch = xmlText.match(/errInfo="([^"]+)"/i);
    const errorCode = errorCodeMatch?.[1] || '0';
    if (errorCode !== '0') {
      return { success: false, pidData: '', pidDataHash: '', quality: 0, errorCode, errorMessage: errorInfoMatch?.[1] || 'Capture failed', devicePort: port };
    }
    const qualityMatch = xmlText.match(/qScore="([^"]+)"/i);
    const quality = qualityMatch ? parseInt(qualityMatch[1], 10) : 0;
    const dataMatch = xmlText.match(/<Data[^>]*>([\s\S]*?)<\/Data>/i);
    const pidBlockMatch = xmlText.match(/<Resp[^>]*\/>[\s\S]*$/i);
    const contentToHash = dataMatch?.[1] || pidBlockMatch?.[0] || xmlText;
    const encoder = new TextEncoder();
    const data = encoder.encode(contentToHash.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const pidDataHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { success: true, pidData: xmlText, pidDataHash, quality, devicePort: port };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false, pidData: '', pidDataHash: '', quality: 0,
      errorMessage: message.includes('abort') ? 'Timeout. Please place your finger on the scanner.' : `Scanner error: ${message}`,
      devicePort: port,
    };
  }
}

export default function KioskPage() {
  const [step, setStep] = useState<Step>('IDLE');
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [staff, setStaff] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);

  // Check scanner status periodically
  useEffect(() => {
    const checkDevice = async () => {
      const info = await discoverDevice();
      setDevice(info);
    };
    checkDevice();
    const interval = setInterval(checkDevice, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for scanner
  useEffect(() => {
    const interval = setInterval(() => setScanPulse(p => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  const handleScanFingerprint = useCallback(async () => {
    if (!device || device.status !== 'READY' || !device.port) {
      setError('Scanner is not ready. Please check the device connection.');
      return;
    }

    setStep('SCANNING');
    setError('');
    setLoading(true);

    try {
      // 1. Capture fingerprint
      const capture = await captureFingerprint(device.port);
      
      if (!capture.success) {
        throw new Error(capture.errorMessage || 'Fingerprint capture failed');
      }

      // 2. Identify staff via server
      const res = await fetch('/api/v1/fingerprint/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateData: capture.pidDataHash })
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 3. Staff identified!
      setStaff(data);
      setStatus({ currentState: data.currentState });
      setStep('ACTIONS');
    } catch (e: any) {
      setError(e.message);
      setStep('IDLE');
    } finally {
      setLoading(false);
    }
  }, [device]);

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
      setTimeout(() => { resetKiosk(); }, 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setStep('IDLE');
    setStaff(null);
    setStatus(null);
    setError('');
  };

  const deviceReady = device?.status === 'READY';

  return (
    <div className="kiosk-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="bg-mesh" />
      
      <div className="glass animate-slide-up" style={{ 
        width: '100%', 
        maxWidth: '520px', 
        padding: '3rem 2rem', 
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '200px', height: '200px', background: 'var(--brand-primary)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '160px', height: '160px', background: 'var(--brand-accent)', filter: 'blur(80px)', opacity: 0.1, pointerEvents: 'none' }} />

        {/* Scanner Status Indicator */}
        <div style={{ 
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 0.8rem',
          background: deviceReady ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${deviceReady ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
          borderRadius: '100px',
          fontSize: '0.7rem',
          fontWeight: '700',
        }}>
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%',
            background: deviceReady ? 'var(--brand-accent)' : 'var(--brand-secondary)',
            boxShadow: deviceReady ? '0 0 8px var(--brand-accent)' : 'none',
          }} />
          <span style={{ color: deviceReady ? 'var(--brand-accent)' : 'var(--brand-secondary)' }}>
            {deviceReady ? 'MFS110 ONLINE' : 'SCANNER OFFLINE'}
          </span>
        </div>

        {/* IDLE STATE — Ready to Scan */}
        {step === 'IDLE' && (
          <div className="animate-slide-up">
            <div style={{ 
              margin: '1rem auto 2rem auto',
              width: '140px', height: '140px',
              position: 'relative',
              cursor: deviceReady ? 'pointer' : 'not-allowed',
            }} onClick={deviceReady ? handleScanFingerprint : undefined}>
              {/* Pulsing rings */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: scanPulse ? '160px' : '130px',
                height: scanPulse ? '160px' : '130px',
                borderRadius: '50%',
                border: `2px solid ${deviceReady ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 1.5s ease',
                opacity: scanPulse ? 0 : 0.6,
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: deviceReady 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1))' 
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${deviceReady ? 'rgba(99, 102, 241, 0.3)' : 'var(--glass-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: deviceReady ? '0 0 40px rgba(99, 102, 241, 0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={deviceReady ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255,255,255,0.15)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02.1 2.51.412 4.06C10.96 18.7 11.48 21 12 21c.52 0 1.04-2.3 1.588-4.94C13.9 14.51 14 13.02 14 12a2 2 0 0 0-2-2Z" />
                  <path d="M8.65 14.8a25 25 0 0 1-.24-2.8c0-1.98.82-3.59 2.12-4.35a3.57 3.57 0 0 1 2.94 0c1.3.76 2.12 2.37 2.12 4.35 0 .93-.06 1.88-.24 2.8" />
                  <path d="M6.73 17.13A31 31 0 0 1 6.4 12c0-2.85.89-5.38 2.34-6.97A5.72 5.72 0 0 1 12 3.25c1.2 0 2.32.63 3.26 1.78C16.71 6.62 17.6 9.15 17.6 12c0 1.73-.11 3.47-.33 5.13" />
                  <path d="M4.81 19.09c-.36-2.3-.61-4.65-.61-7.09C4.2 7.69 7.69 4 12 4s7.8 3.69 7.8 8c0 2.44-.25 4.79-.61 7.09" />
                </svg>
              </div>
            </div>

            <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>
              {deviceReady ? 'Place Your Finger' : 'Scanner Not Detected'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              {deviceReady 
                ? 'Touch the fingerprint scanner to identify yourself and log your attendance.'
                : 'Please connect the Mantra MFS110 scanner and ensure the RD Service is running.'
              }
            </p>

            {deviceReady && (
              <button 
                className="btn-modern btn-primary"
                onClick={handleScanFingerprint}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  fontSize: '1.1rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
                }}
              >
                👆 Scan Fingerprint
              </button>
            )}

            {!deviceReady && (
              <button 
                className="btn-modern btn-secondary"
                onClick={async () => {
                  const info = await discoverDevice();
                  setDevice(info);
                }}
                style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '16px' }}
              >
                🔄 Retry Connection
              </button>
            )}
          </div>
        )}

        {/* SCANNING STATE */}
        {step === 'SCANNING' && (
          <div className="animate-slide-up" style={{ padding: '2rem 0' }}>
            <div style={{
              width: '100px', height: '100px',
              margin: '0 auto 2rem auto',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02.1 2.51.412 4.06C10.96 18.7 11.48 21 12 21c.52 0 1.04-2.3 1.588-4.94C13.9 14.51 14 13.02 14 12a2 2 0 0 0-2-2Z" />
                <path d="M8.65 14.8a25 25 0 0 1-.24-2.8c0-1.98.82-3.59 2.12-4.35a3.57 3.57 0 0 1 2.94 0c1.3.76 2.12 2.37 2.12 4.35 0 .93-.06 1.88-.24 2.8" />
                <path d="M6.73 17.13A31 31 0 0 1 6.4 12c0-2.85.89-5.38 2.34-6.97A5.72 5.72 0 0 1 12 3.25c1.2 0 2.32.63 3.26 1.78C16.71 6.62 17.6 9.15 17.6 12c0 1.73-.11 3.47-.33 5.13" />
              </svg>
            </div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Reading Fingerprint...</h1>
            <p style={{ color: 'var(--text-muted)' }}>Keep your finger steady on the scanner</p>
            
            <div style={{ marginTop: '2rem' }}>
              <div style={{
                height: '4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))',
                  borderRadius: '2px',
                  animation: 'loading 2s ease-in-out infinite',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS STATE — Staff Identified */}
        {step === 'ACTIONS' && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ 
                width: '70px', height: '70px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                fontSize: '2rem',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)',
              }}>
                ✓
              </div>
              <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Hi, {staff?.staffName}!
              </h1>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ 
                  padding: '0.3rem 0.8rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '100px', 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
                  color: 'var(--text-muted)'
                }}>
                  {staff?.slotName}
                </span>
                <span style={{ 
                  padding: '0.3rem 0.8rem', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: 'var(--brand-accent)', 
                  borderRadius: '100px', 
                  fontSize: '0.75rem', 
                  fontWeight: '700'
                }}>
                  {status?.currentState?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {status?.currentState === 'NOT_STARTED' && (
                <button className="btn-modern btn-primary" onClick={() => handleAction('START_SHIFT')} disabled={loading} style={{ height: '90px', fontSize: '1.4rem', borderRadius: '24px' }}>
                  <span style={{ fontSize: '2.25rem' }}>☀️</span> Start Shift
                </button>
              )}
              {status?.currentState === 'SHIFT_STARTED' && (
                <>
                  <button className="btn-modern" onClick={() => handleAction('START_BREAK')} disabled={loading} style={{ height: '90px', fontSize: '1.4rem', borderRadius: '24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
                    <span style={{ fontSize: '2.25rem' }}>☕</span> Take Break
                  </button>
                  <button className="btn-modern" onClick={() => handleAction('END_SHIFT')} disabled={loading} style={{ height: '90px', fontSize: '1.4rem', borderRadius: '24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                    <span style={{ fontSize: '2.25rem' }}>🏠</span> End Shift
                  </button>
                </>
              )}
              {status?.currentState === 'ON_BREAK' && (
                <button className="btn-modern btn-primary" onClick={() => handleAction('END_BREAK')} disabled={loading} style={{ height: '90px', fontSize: '1.4rem', borderRadius: '24px' }}>
                  <span style={{ fontSize: '2.25rem' }}>🔙</span> Resume Work
                </button>
              )}
              {status?.currentState === 'SHIFT_ENDED' && (
                <div className="glass" style={{ padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Shift Completed</h3>
                  <p style={{ color: 'var(--text-muted)' }}>You have already finished your duties for today. See you tomorrow!</p>
                </div>
              )}
            </div>
            <button onClick={resetKiosk} style={{ marginTop: '2.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>Done</button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {step === 'SUCCESS' && (
          <div className="animate-slide-up" style={{ padding: '2rem 0' }}>
            <div style={{ 
              width: '100px', height: '100px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2rem auto',
              fontSize: '4rem',
              color: 'var(--brand-accent)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)'
            }}>
              ✓
            </div>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Success!</h1>
            <p style={{ color: 'var(--text-muted)' }}>Attendance logged for <strong>{staff?.staffName}</strong>.<br/>Returning to scanner mode...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.25rem', 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.2)', 
            borderRadius: '16px', 
            color: 'var(--brand-secondary)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
      
      <p style={{ marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.1em', opacity: 0.6 }}>
        FULBARI TERMINAL • v3.0.0 • BIOMETRIC SECURED
      </p>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(60%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
