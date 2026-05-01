"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import OverviewTab from "./OverviewTab";
import AttendanceTab from "./AttendanceTab";
import AdvancesTab from "./AdvancesTab";
import DocumentsTab from "./DocumentsTab";

export default function EmployeeProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("overview");
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/v1/staff/${id}`);
      const data = await res.json();
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;
  if (!staff) return <div style={{ padding: '2rem', textAlign: 'center' }}>Staff not found.</div>;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Attendance" },
    { id: "advances", label: "Advances" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/admin/staff" style={{ color: 'var(--brand-primary)', fontSize: '0.875rem' }}>&larr; Back to Staff</Link>
          </div>
          <h1 style={{ fontSize: '2rem' }}>{staff.name}&apos;s Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {staff.slot?.name || "Unassigned"} &bull; {staff.location}
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && <OverviewTab staff={staff} refresh={fetchProfile} />}
        {activeTab === "attendance" && <AttendanceTab staffId={id} />}
        {activeTab === "advances" && <AdvancesTab staffId={id} />}
        {activeTab === "documents" && <DocumentsTab staffId={id} />}
      </div>
    </div>
  );
}
