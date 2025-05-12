import React from "react";

// Helper to calculate OEE for a subset of entries (e.g., monthly)
function calculateOEEForSubset(entries) {
  if (!entries || entries.length === 0) return null;
  let totalTarget = 0;
  let totalActual = 0;
  entries.forEach(entry => {
    totalTarget += Number(entry.targetProd) || 0;
    totalActual += Number(entry.actualProd) || 0;
  });
  return totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : null;
}

export default function OEEMachineCard({
  machine,
  targetOEE_FY,
  overallOEE_FY,
  actualOEE_FY,
  reports_FY
}) {

  const targetOEE = targetOEE_FY;
  const overallOEE = overallOEE_FY;
  const actualOEEForGauge = actualOEE_FY;

  let fyStartDate, fyEndDate;
  if (reports_FY && reports_FY.length > 0) {
    const dates = reports_FY.map(r => new Date(r.date));
    fyStartDate = new Date(Math.min.apply(null, dates));
    fyEndDate = new Date(Math.max.apply(null, dates));
  } else {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    fyStartDate = new Date(currentMonth >= 3 ? currentYear : currentYear - 1, 3, 1);
    fyEndDate = new Date(currentMonth >= 3 ? currentYear + 1 : currentYear, 2, 31);
  }

  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#1f2937' }}>{machine.type}-{machine.name}</span>
      </div>

      {/* --- OEE Progress Bars Section (Uses FY props directly) --- START */}
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        {[ 
          { label: 'Target', value: targetOEE, color: '#fd7e14' },
          { label: 'Overall', value: overallOEE, color: '#ffc107' },
          { label: 'Actual', value: actualOEEForGauge, color: '#28a745' },
        ].map((bar, index) => (
          <div key={index} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{bar.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{bar.value !== null ? `${bar.value}%` : '--'}</span>
            </div>
            <div style={{ height: 12, backgroundColor: '#e9ecef', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${bar.value !== null ? bar.value : 0}%`,
                backgroundColor: bar.color,
                borderRadius: 6,
                transition: 'width 0.5s ease-in-out'
              }}></div>
            </div>
          </div>
        ))}
      </div>
      {/* --- OEE Progress Bars Section --- END */}

      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 12, fontSize: 16 }}>Monthly OEE (Financial Year)</div>
        <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 10 }}> 
          {
            Array.from({ length: 12 }, (_, i) => {
              const d = new Date(fyStartDate.getFullYear(), fyStartDate.getMonth() + i, 1);
              const month = d.getMonth();
              const year = d.getFullYear();

              const monthReports = reports_FY.filter(r => {
                if (!r.date) return false;
                const reportDate = new Date(r.date);
                return reportDate.getMonth() === month && reportDate.getFullYear() === year;
              });

              let actualOEE = calculateOEEForSubset(monthReports);
              let tgt = Number(machine.targetOEE) || null; 

              let barColor = actualOEE !== null ? '#6366f1' : '#d1d5db';
              let barWidth = actualOEE !== null ? `${Math.min(100, actualOEE)}%` : '5%'; 
              let tgtLeft = tgt !== null ? `${Math.min(100, tgt)}%` : null;

              return (
                <div key={`${year}-${month}`} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <span style={{ width: 70, fontSize: 13, textAlign: 'left', color: '#4b5563' }}>{d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  <div style={{ flex: 1, background: '#e0e7ff', borderRadius: 4, height: 16, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: barWidth, background: barColor, height: '100%', borderRadius: 4, transition: 'width 0.3s' }}></div>
                    {tgt !== null && <div style={{ position: 'absolute', left: tgtLeft, top: 0, bottom: 0, width: 2, background: '#f59e42', borderRadius: 1 }} title={`Target: ${tgt}%`}></div>}
                  </div>
                  <span style={{ minWidth: 38, fontSize: 13, textAlign: 'right', fontWeight: 500, color: '#374151' }}>{actualOEE !== null ? `${actualOEE}%` : '--'}</span>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}
