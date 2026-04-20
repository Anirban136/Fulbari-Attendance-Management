"use client";

import React, { useState } from "react";

interface StaffInfo {
  id: string;
  name: string;
  extra?: string;
}

interface DashboardStatsProps {
  activeStaff: StaffInfo[];
  onBreakStaff: StaffInfo[];
  pendingAdvances: StaffInfo[];
}

export default function DashboardStats({
  activeStaff,
  onBreakStaff,
  pendingAdvances,
}: DashboardStatsProps) {
  const [modalData, setModalData] = useState<{
    title: string;
    staff: StaffInfo[];
  } | null>(null);

  const stats = [
    {
      label: "Active Staff Today",
      count: activeStaff.length,
      data: activeStaff,
      color: "var(--brand-primary)",
      isGradient: true,
    },
    {
      label: "On Break",
      count: onBreakStaff.length,
      data: onBreakStaff,
      color: "var(--brand-secondary)",
      isGradient: true,
    },
    {
      label: "Pending Advances",
      count: pendingAdvances.length,
      data: pendingAdvances,
      color: "var(--brand-secondary)",
      isGradient: false,
    },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-panel text-center"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onClick={() => setModalData({ title: stat.label, staff: stat.data })}
          >
            <h3 style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
              {stat.label}
            </h3>
            <p
              className={stat.isGradient ? "text-gradient" : ""}
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                margin: "0",
                color: stat.isGradient ? undefined : stat.color,
              }}
            >
              {stat.count}
            </p>
          </div>
        ))}
      </div>

      {modalData && (
        <div className="modal-overlay" onClick={() => setModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalData(null)}>
              &times;
            </button>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              {modalData.title}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Listing all staff members in this category.
            </p>

            <ul className="staff-list">
              {modalData.staff.length > 0 ? (
                modalData.staff.map((s) => (
                  <li key={s.id} className="staff-item">
                    <span style={{ fontWeight: "500" }}>{s.name}</span>
                    {s.extra && (
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {s.extra}
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  No staff members found.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
