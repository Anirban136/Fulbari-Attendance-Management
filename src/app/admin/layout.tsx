"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsLightTheme(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isLightTheme;
    setIsLightTheme(newTheme);
    localStorage.setItem("theme", newTheme ? "light" : "dark");
  };

  const navLinks = [
    { name: "Dashboard", href: "/admin" },
    { name: "Staff Management", href: "/admin/staff" },
    { name: "Slot management", href: "/admin/qr" },
    { name: "Financials", href: "/admin/financials" },
    { name: "Payroll Engine", href: "/admin/payroll" },
  ];

  return (
    <div className={`admin-layout animate-fade-in ${isLightTheme ? "light-theme" : ""}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <h2 className="text-gradient" style={{ marginBottom: "1rem" }}>
          Fulbari Restora
        </h2>

        {/* Theme Toggle */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>Dark</span>
          <div 
            onClick={toggleTheme}
            style={{ 
              width: '40px', 
              height: '20px', 
              background: 'var(--background-surface-hover)', 
              borderRadius: '20px', 
              position: 'relative', 
              cursor: 'pointer',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: 'var(--brand-primary)', 
              borderRadius: '50%', 
              position: 'absolute', 
              top: '1px', 
              left: isLightTheme ? '21px' : '2px',
              transition: 'left 0.2s ease-in-out'
            }} />
          </div>
          <span>Light</span>
        </div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.name}
            </Link>
          ))}
          <Link href="/kiosk" className="nav-link" target="_blank">
            Kiosk View ↗
          </Link>
        </nav>

        <div style={{ marginTop: "auto" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Admin Logged In
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
