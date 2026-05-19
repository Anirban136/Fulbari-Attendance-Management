"use client";

import React, { useState, useEffect } from "react";

// Inline Mantra RD Service communication for enrollment
const RD_SERVICE_PORTS = [11100, 11101, 11102, 11103, 11104, 11105];
const CAPTURE_TIMEOUT_MS = 15000;
const CAPTURE_XML = `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="0" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="${CAPTURE_TIMEOUT_MS}" otp="" wadh="" posh="UNKNOWN" />
</PidOptions>`;

interface FormData {
  name: string;
  phone: string;
  monthlySalary: number;
  emergencyContact: string;
  address: string;
}

export default function OverviewTab({ staff, refresh }: { staff: any; refresh: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollStep, setEnrollStep] = useState<'idle' | 'detecting' | 'scanning' | 'saving' | 'done' | 'error'>('idle');
  const [enrollError, setEnrollError] = useState('');
  const [selectedFinger, setSelectedFinger] = useState('RIGHT_INDEX');
  const [deviceStatus, setDeviceStatus] = useState<'unknown' | 'ready' | 'not_found'>('unknown');
  const [formData, setFormData] = useState<FormData>({
    name: staff.name || '',
    phone: staff.phone || '',
    monthlySalary: staff.monthlySalary || 0,
    emergencyContact: staff.emergencyContact || '',
    address: staff.address || '',
  });

  const fingerprintCount = staff.fingerprints?.length || 0;

  // Check scanner on mount
  useEffect(() => {
    checkScanner();
  }, []);

  const checkScanner = async () => {
    setDeviceStatus('unknown');
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
          setDeviceStatus('ready');
          return port;
        }
      } catch { continue; }
    }
    setDeviceStatus('not_found');
    return null;
  };

  const handleEnrollFingerprint = async () => {
    setIsEnrolling(true);
    setEnrollError('');
    setEnrollStep('detecting');

    try {
      // 1. Find scanner
      let activePort: number | null = null;
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
            activePort = port;
            break;
          }
        } catch { continue; }
      }

      if (!activePort) {
        throw new Error('Mantra MFS110 scanner not detected. Please ensure the device is connected and RD Service is running.');
      }

      setEnrollStep('scanning');

      // 2. Capture fingerprint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS + 5000);
      const captureRes = await fetch(`http://127.0.0.1:${activePort}/rd/capture`, {
        method: 'CAPTURE',
        headers: { 'Content-Type': 'text/xml' },
        body: CAPTURE_XML,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const xmlText = await captureRes.text();

      const errorCodeMatch = xmlText.match(/errCode="([^"]+)"/i);
      const errorInfoMatch = xmlText.match(/errInfo="([^"]+)"/i);
      const errorCode = errorCodeMatch?.[1] || '0';
      
      if (errorCode !== '0') {
        throw new Error(errorInfoMatch?.[1] || 'Fingerprint capture failed. Please try again.');
      }

      // 3. Generate hash of captured data for storage
      const dataMatch = xmlText.match(/<Data[^>]*>([\s\S]*?)<\/Data>/i);
      const pidBlockMatch = xmlText.match(/<Resp[^>]*\/>[\s\S]*$/i);
      const contentToHash = dataMatch?.[1] || pidBlockMatch?.[0] || xmlText;
      const encoder = new TextEncoder();
      const data = encoder.encode(contentToHash.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const templateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setEnrollStep('saving');

      // 4. Save to server
      const enrollRes = await fetch('/api/v1/fingerprint/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff.id,
          templateData: templateHash,
          fingerIndex: selectedFinger,
          deviceInfo: `Mantra MFS110 @ port ${activePort}`,
        })
      });

      const enrollData = await enrollRes.json();
      if (enrollData.error) throw new Error(enrollData.error);

      setEnrollStep('done');
      setTimeout(() => {
        setIsEnrolling(false);
        setEnrollStep('idle');
        refresh();
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setEnrollError(e.message);
      setEnrollStep('error');
    }
  };

  const handleDeleteFingerprint = async (fpId: string) => {
    if (!confirm('Are you sure you want to remove this fingerprint enrollment?')) return;
    try {
      await fetch(`/api/v1/fingerprint/enroll?id=${fpId}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

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
    { label: "Attendance Reliability", value: `${staff.metrics?.attendanceRate || 0}%`, color: "var(--brand-primary-light)", icon: "📈" },
    { label: "Deployment Days", value: staff.metrics?.totalDaysWorked || 0, color: "var(--brand-accent)", icon: "📅" },
    { label: "Absence Record", value: staff.metrics?.totalLeaves?.total || 0, color: "var(--brand-secondary)", icon: "🚫" },
    { label: "Financial Exposure", value: `₹${staff.metrics?.totalAdvanceTaken || 0}`, color: "#f59e0b", icon: "💰" },
  ];

  const fingerOptions = [
    { value: 'RIGHT_INDEX', label: '☝️ Right Index' },
    { value: 'LEFT_INDEX', label: '☝️ Left Index' },
    { value: 'RIGHT_THUMB', label: '👍 Right Thumb' },
    { value: 'LEFT_THUMB', label: '👍 Left Thumb' },
    { value: 'RIGHT_MIDDLE', label: '🖕 Right Middle' },
    { value: 'LEFT_MIDDLE', label: '🖕 Left Middle' },
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Metrics Grid */}
      <div className="grid-auto">
        {metrics.map((m, i) => (
          <div key={i} className="glass stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <span className="stat-label">{m.label}</span>
               <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
            </div>
            <h3 className="stat-value" style={{ color: m.color }}>{m.value}</h3>
          </div>
        ))}
      </div>

      {/* Details Card */}
      <section className="glass" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem' }} className="text-gradient">Personnel Profile</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Core identification and employment records.</p>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`btn-modern ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
          >
            {isEditing ? "Discard Changes" : "Modify Record"}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Legal Name</label>
              <input 
                className="input-modern" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Contact Identifier</label>
              <input 
                className="input-modern" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Base Remuneration (₹)</label>
              <input 
                className="input-modern" 
                type="number" 
                value={formData.monthlySalary} 
                onChange={(e) => setFormData({...formData, monthlySalary: Number(e.target.value)})} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Emergency Protocol Contact</label>
              <input 
                className="input-modern" 
                placeholder="Name or Phone"
                value={formData.emergencyContact} 
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Residential Address</label>
              <textarea 
                className="input-modern" 
                style={{ minHeight: '100px', resize: 'vertical' }} 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="submit" className="btn-modern btn-primary" style={{ width: '100%' }}>Update Permanent Record</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
            <DetailItem label="Official Name" value={staff.name} />
            <DetailItem label="Verified Phone" value={staff.phone} />
            <DetailItem label="Monthly Commitment" value={`₹${staff.monthlySalary}`} />
            <DetailItem label="Activation Date" value={new Date(staff.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <DetailItem label="Emergency Dispatch" value={staff.emergencyContact || "No data provided"} />
            <DetailItem label="Primary Residency" value={staff.address || "No data provided"} />
          </div>
        )}
      </section>

      {/* Fingerprint Enrollment Card */}
      <section className="glass" style={{ 
        padding: '2.5rem', 
        borderLeft: `4px solid ${fingerprintCount > 0 ? 'var(--brand-accent)' : 'var(--brand-secondary)'}` 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>🔐 Fingerprint Identity</h2>
              <span style={{ 
                padding: '0.2rem 0.6rem', 
                background: deviceStatus === 'ready' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                color: deviceStatus === 'ready' ? 'var(--brand-accent)' : 'var(--brand-secondary)',
                borderRadius: '100px',
                fontSize: '0.65rem',
                fontWeight: '800',
              }}>
                {deviceStatus === 'ready' ? 'MFS110 ONLINE' : deviceStatus === 'not_found' ? 'SCANNER OFFLINE' : 'CHECKING...'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {fingerprintCount > 0 
                ? `${fingerprintCount} fingerprint(s) enrolled. Staff can use the scanner for attendance.` 
                : "No fingerprints enrolled. Enroll at least one fingerprint for biometric attendance."
              }
            </p>
          </div>
        </div>

        {/* Enrolled Fingerprints List */}
        {fingerprintCount > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {staff.fingerprints?.map((fp: any, idx: number) => (
                <div key={fp.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      👆
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        Fingerprint #{idx + 1} — {fp.fingerIndex?.replace(/_/g, ' ') || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Enrolled {new Date(fp.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {fp.deviceInfo ? ` • ${fp.deviceInfo}` : ''}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteFingerprint(fp.id)}
                    style={{ 
                      background: 'rgba(244, 63, 94, 0.1)', 
                      border: '1px solid rgba(244, 63, 94, 0.2)', 
                      color: 'var(--brand-secondary)', 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontSize: '0.75rem', 
                      fontWeight: '700' 
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrollment UI */}
        {!isEnrolling ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                FINGER TO ENROLL
              </label>
              <select 
                className="input-modern" 
                value={selectedFinger} 
                onChange={(e) => setSelectedFinger(e.target.value)}
              >
                {fingerOptions.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleEnrollFingerprint}
              disabled={fingerprintCount >= 3 || deviceStatus !== 'ready'}
              className="btn-modern btn-primary"
              style={{ padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }}
            >
              {fingerprintCount >= 3 
                ? '🔒 Max Enrolled (3/3)' 
                : deviceStatus !== 'ready'
                  ? '🔍 Scanner Not Found'
                  : '👆 Enroll Fingerprint'
              }
            </button>
          </div>
        ) : (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
          }}>
            {enrollStep === 'detecting' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Detecting Scanner...</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Looking for Mantra MFS110</p>
              </>
            )}
            {enrollStep === 'scanning' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>👆</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Place Finger on Scanner</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Place your <strong>{selectedFinger.replace(/_/g, ' ').toLowerCase()}</strong> finger on the MFS110 scanner now
                </p>
              </>
            )}
            {enrollStep === 'saving' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💾</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Saving Template...</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Storing fingerprint data securely</p>
              </>
            )}
            {enrollStep === 'done' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--brand-accent)' }}>✅</div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--brand-accent)' }}>Fingerprint Enrolled!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Successfully registered</p>
              </>
            )}
            {enrollStep === 'error' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--brand-secondary)' }}>Enrollment Failed</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{enrollError}</p>
                <button 
                  onClick={() => { setIsEnrolling(false); setEnrollStep('idle'); setEnrollError(''); }}
                  className="btn-modern btn-secondary"
                  style={{ padding: '0.6rem 1.5rem' }}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{value}</p>
    </div>
  );
}
