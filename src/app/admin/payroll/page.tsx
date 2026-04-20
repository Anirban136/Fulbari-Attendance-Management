"use client";

import React, { useState } from "react";

export default function PayrollCalculationPage() {
  const [month, setMonth] = useState("2026-04");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/payroll/calculate?month=${month}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Payroll Engine</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Compare salary modes and finalize payments.</p>
      </header>

      <div className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Month</label>
          <input type="month" className="input-base" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <button className="btn" style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }} onClick={handleCalculate} disabled={loading}>
          {loading ? 'Calculating...' : 'Run Engine'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="glass-panel animate-fade-in">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Staff</th>
                <th style={{ padding: '1rem' }}>Base Salary</th>
                <th style={{ padding: '1rem' }}>PF (12%)</th>
                <th style={{ padding: '1rem' }}>Inhand Base</th>
                <th style={{ padding: '1rem' }}>Strict Salary</th>
                <th style={{ padding: '1rem' }}>Simple Salary</th>
                <th style={{ padding: '1rem' }}>Advances</th>
                <th style={{ padding: '1rem' }}>Final Payable</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: any) => (
                <tr key={r.staffId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600' }}>{r.name}</div>
                    {r.warnings.highAdvance && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>⚠️ High Advance</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>₹{r.monthlySalary}</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>-₹{r.pfAmount}</td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#10b981' }}>₹{r.inHandBase}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Raw: ₹{r.strictRaw}</div>
                    <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>PF: -₹{r.strictPF}</div>
                    <div style={{ fontWeight: '600' }}>Net: ₹{r.strictFinal}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Raw: ₹{r.simpleRaw}</div>
                    <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>PF: -₹{r.simplePF}</div>
                    <div style={{ fontWeight: '600' }}>Net: ₹{r.simpleFinal}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--brand-secondary)' }}>-₹{r.totalAdvance}</td>
                  <td style={{ padding: '1rem' }}>
                    <select className="input-base" style={{ padding: '0.25rem' }}>
                      <option value="strict">Strict (₹{r.strictFinal})</option>
                      <option value="simple">Simple (₹{r.simpleFinal})</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Finalize</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
