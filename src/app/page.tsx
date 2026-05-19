import Link from "next/link";

export default function Home() {
  return (
    <main className="animate-slide-up">
      <div className="bg-mesh" />
      
      <div className="container-main" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '4rem' }}>
          <span className="glass" style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '100px', 
            fontSize: '0.8rem', 
            fontWeight: '600',
            color: 'var(--brand-primary-light)',
            marginBottom: '2rem',
            display: 'inline-block'
          }}>
            ✨ Next Generation Attendance
          </span>
          <h1 className="text-gradient" style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 5rem)', 
            lineHeight: '1.1',
            marginBottom: '1.5rem'
          }}>
            Fulbari Restora<br/>Attendance
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
            color: 'var(--text-muted)', 
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            A precision-engineered terminal for modern restaurants. 
            Real-time tracking, automated payroll, and seamless staff management.
          </p>
        </div>

        <div className="grid-auto" style={{ width: '100%', maxWidth: '900px' }}>
          <Link href="/admin" className="glass glass-hover" style={{ padding: '3rem 2rem', textAlign: 'left' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '1.5rem'
            }}>
              ⚙️
            </div>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Admin Portal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Full control over operations. Manage staff, analyze financials, and finalize payroll records.
            </p>
            <div style={{ marginTop: '2rem', fontWeight: '600', color: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Open Dashboard <span>→</span>
            </div>
          </Link>

          <Link href="/kiosk" className="glass glass-hover" style={{ padding: '3rem 2rem', textAlign: 'left' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: 'rgba(244, 63, 94, 0.1)', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '1.5rem'
            }}>
              📱
            </div>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Staff Kiosk</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Touch-optimized terminal for daily clock-ins. Fingerprint-secured biometric attendance logging.
            </p>
            <div style={{ marginTop: '2rem', fontWeight: '600', color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Launch Terminal <span>→</span>
            </div>
          </Link>
        </div>

        <footer style={{ marginTop: '6rem', opacity: 0.5, fontSize: '0.8rem' }}>
          <p>© 2026 Fulbari Restora • Powered by Antigravity AI Engine</p>
        </footer>
      </div>
    </main>
  );
}
