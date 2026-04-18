import Link from "next/link";

export default function Home() {
  return (
    <main style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
      padding: '2rem'
    }}>
      <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '800px' }}>
        <h1 className="text-gradient" style={{ fontSize: '4rem', marginBottom: '1rem', fontWeight: '800' }}>
          RestaurantOS
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          Next-generation workforce management. Accurate attendance, flexible payroll, and real-time insights for your restaurant.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <Link href="/admin" className="glass-panel" style={{ padding: '2.5rem', display: 'block', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Manage staff profiles, assign slots, track advances, and run the payroll engine.
            </p>
          </Link>

          <Link href="/kiosk" className="glass-panel" style={{ padding: '2.5rem', display: 'block', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Staff Kiosk</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Terminal for staff attendance. QR scanning, PIN verification, and shift/break logging.
            </p>
          </Link>
        </div>

        <p style={{ marginTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.5 }}>
          Built with Excellence by Antigravity AI
        </p>
      </div>
    </main>
  );
}
