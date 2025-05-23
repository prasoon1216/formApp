import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import OEEMachineCard from "../components/OEEMachineCard";
import OEESummaryCard from "../components/OEESummaryCard";

function calculateOEE(entries) {
  if (!entries || entries.length === 0) return null;
  let totalTarget = 0, totalActual = 0;
  entries.forEach(e => {
    totalTarget += Number(e.targetProd) || 0;
    totalActual += Number(e.actualProd) || 0;
  });
  return totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : null;
}

// Helper to get financial year dates from a label like '2024-25'
function getCurrentFinancialYearDates() {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();
  let startYear, endYear;

  if (currentMonth >= 3) { // April (index 3) or later
    startYear = currentYear;
    endYear = currentYear + 1;
  } else { // Jan, Feb, March
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  const startDate = new Date(startYear, 3, 1); // April 1st
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endYear, 2, 31);   // March 31st
  endDate.setHours(23, 59, 59, 999);

  const yearLabel = `${startYear}-${endYear.toString().slice(-2)}`;

  return { startDate, endDate, yearLabel };
}

// Helper to convert label ('2024-25') to dates
function getFinancialYearDatesFromLabel(label) {
  if (!label || !label.includes('-')) return getCurrentFinancialYearDates(); // Fallback
  const startYear = parseInt(label.split('-')[0]);
  const endYear = startYear + 1;

  const startDate = new Date(startYear, 3, 1); // April 1st
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endYear, 2, 31);   // March 31st
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate, yearLabel: label };
}

// Helper to generate FY labels
function generateFYLabels(count = 5) {
  const { yearLabel: currentFYLabel } = getCurrentFinancialYearDates();
  const currentStartYear = parseInt(currentFYLabel.split('-')[0]);
  const labels = [];
  for (let i = 0; i < count; i++) {
    const startYear = currentStartYear - i;
    const endYearShort = (startYear + 1).toString().slice(-2);
    labels.push(`${startYear}-${endYearShort}`);
  }
  return labels;
}

export default function OEEDashboard() {
  // View State
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detail'
  const [selectedMachineKeyForDetail, setSelectedMachineKeyForDetail] = useState(null);

  const [machines, setMachines] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Selected Financial Year
  const [selectedFYLabel, setSelectedFYLabel] = useState(() => getCurrentFinancialYearDates().yearLabel);

  // Generate FY options
  const fyOptions = useMemo(() => generateFYLabels(5), []);

  useEffect(() => {
    let pollingInterval;
    async function fetchMachines() {
      try {
        const res = await axios.get("/machines");
        // Sort by type, then by name
        const sorted = [...res.data].sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type.localeCompare(b.type);
        });
        setMachines(sorted);
      } catch (err) {
        setError("Failed to fetch machines");
      }
    }
    fetchMachines();
    // Poll every 10 seconds for new/removed machines
    pollingInterval = setInterval(fetchMachines, 10000);
    return () => clearInterval(pollingInterval);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/job/all-reports");
        setReports(res.data || []);
      } catch (err) {
        setError("Failed to fetch reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // --- Calculate data based on selected FY using useMemo --- 
  const machineDataFY = useMemo(() => {
    if (loading || !machines.length || !reports.length) return []; // Don't calculate if loading or no data

    // Get dates for the *selected* financial year
    const { startDate: fyStartDate, endDate: fyEndDate } = getFinancialYearDatesFromLabel(selectedFYLabel);

    // Filter reports for the selected Financial Year
    const fyReports = reports.filter(r => {
      if (!r.date) return false;
      const reportDate = new Date(r.date);
      return reportDate >= fyStartDate && reportDate <= fyEndDate;
    });

    // Calculate OEE for each machine for the selected Financial Year
    const machineData = machines.map(machine => {
      // Find all reports for this machine
      const mcReports = reports.filter(r => r.mcNo === machine.name);
      
      // Filter for selected financial year
      const mcReportsFY = mcReports.filter(r => {
        if (!r.date) return false;
        const reportDate = new Date(r.date);
        return reportDate >= fyStartDate && reportDate <= fyEndDate;
      });

      // Calculate OEE if there are reports
      const targetOEE = Number(machine.targetOEE) || null;
      const actualOEE = mcReportsFY.length > 0 ? calculateOEE(mcReportsFY) : null;
      const overallOEE = actualOEE; // Assuming Overall = Actual for now

      return {
        key: `${machine.type}-${machine.name}`,
        machineName: `${machine.type}-${machine.name}`,
        targetOEE: targetOEE,
        actualOEE: actualOEE,
        overallOEE: overallOEE,
        reportsForFY: mcReportsFY,
        machine: machine
      };
    });

    // Sort machines by name
    return machineData.sort((a, b) => {
      const aName = a.machineName.toLowerCase();
      const bName = b.machineName.toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [selectedFYLabel, machines, reports, loading]); // Recalculate when FY, machines, or reports change

  // Data for the selected machine in detail view
  const detailedMachineData = viewMode === 'detail'
    ? machineDataFY.find(m => m.key === selectedMachineKeyForDetail)
    : null;

  const handleSummaryCardClick = (machineKey) => {
    setSelectedMachineKeyForDetail(machineKey);
    setViewMode('detail');
  };

  const handleBackToSummary = () => {
    setSelectedMachineKeyForDetail(null);
    setViewMode('summary');
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {viewMode === 'detail' && (
            <button onClick={handleBackToSummary} title="Back to Summary"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
              <FaArrowLeft size={24} color="#4b5563" />
            </button>
          )}
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            {viewMode === 'summary' ? 'OEE Dashboard' : `OEE Details - ${detailedMachineData?.machineName || ''}`}
          </h2>
        </div>
        <div style={{
          background: '#f3f4f6', color: '#1f2937', borderRadius: 8,
          padding: '0.4rem 0.8rem', // Adjusted padding
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <FaCalendarAlt />
          <span style={{ marginRight: '5px', fontWeight: 500 }}>Financial Year:</span>
          <select
            value={selectedFYLabel}
            onChange={(e) => setSelectedFYLabel(e.target.value)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '4px 8px',
              fontWeight: 600,
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            {fyOptions.map(label => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- CONDITIONAL RENDERING --- */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : viewMode === 'summary' ? (
        // --- SUMMARY VIEW --- 
        <div>
          {/* Group machines by type and render each group */}
          {Object.entries(
            machines.reduce((acc, machine) => {
              acc[machine.type] = acc[machine.type] || [];
              acc[machine.type].push(machine);
              return acc;
            }, {})
          ).map(([type, groupMachines]) => (
            <div key={type} style={{ marginBottom: '36px' }}>
              <h3 style={{
                fontSize: '1.4em',
                fontWeight: 700,
                color: '#2563eb',
                marginBottom: '16px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>{type} Machines</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '28px',
              }}>
                {groupMachines.map(machine => {
                  const machineKey = `${machine.type}-${machine.name}`;
                  const machineData = machineDataFY.find(m => m.key === machineKey);
                  return (
                    <OEESummaryCard
                      key={machineKey}
                      machineName={machineKey}
                      targetOEE={machineData ? machineData.targetOEE : Number(machine.targetOEE) || null}
                      actualOEE={machineData ? machineData.actualOEE : null}
                      onClick={() => handleSummaryCardClick(machineKey)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'detail' && detailedMachineData ? (
        // --- DETAIL VIEW --- 
        <div style={{ maxWidth: 700, margin: '0 auto' }}> { /* Center the detailed card */ }
          <OEEMachineCard
            machine={detailedMachineData.machine} // Pass original machine info
            // Pass pre-calculated FY values and FY reports
            targetOEE_FY={detailedMachineData.targetOEE}
            overallOEE_FY={detailedMachineData.overallOEE}
            actualOEE_FY={detailedMachineData.actualOEE}
            reports_FY={detailedMachineData.reportsForFY}
          />
        </div>
      ) : (
        // Handle case where detail view is selected but data not found (shouldn't happen ideally)
        <div>Machine details not found. <button onClick={handleBackToSummary}>Go Back</button></div>
      )}
    </div>
  );
}