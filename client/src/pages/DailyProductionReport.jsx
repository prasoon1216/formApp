import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Set base URL for backend API
axios.defaults.baseURL = 'http://localhost:10000';

// Helper function to convert MM:SS to decimal format
const convertCycleTimeToDecimal = (cycleTime) => {
  if (!cycleTime) return '-';
  
  // Check if the format is MM:SS
  if (cycleTime && cycleTime.includes(':')) {
    const [minutes, seconds] = cycleTime.split(':').map(Number);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      const decimal = minutes + (seconds / 60);
      return decimal.toFixed(2);
    }
  }
  
  // If already a number, return it with 2 decimal places
  const num = parseFloat(cycleTime);
  if (!isNaN(num)) {
    return num.toFixed(2);
  }
  
  // If invalid format, return as is
  return cycleTime;
};

// Helper function to format any numeric value to 2 decimal places
const formatDecimal = (value) => {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // Format with 2 decimal places
  const formatted = num.toFixed(2);
  
  // If it ends with .00, remove the decimal part
  if (formatted.endsWith('.00')) {
    return parseInt(num).toString();
  }
  
  return formatted;
};

// Helper function to calculate Target Duration using the new formula
// Target Duration (In Hrs.) = {[(act. pro. qty * cycle time) + (M/C Ref. Time (Exer) + Tea & Lunch Break + Meeting & Training)]/60 + [TARGET SETTING TIME (HR.)]}
const calculateTargetDuration = (entry) => {
  const actualProdQty = parseFloat(entry.actualProdQty) || 0;
  
  // Convert cycle time to decimal minutes
  let cycleTimeMin = 0;
  if (entry.cycleTimeMin) {
    if (entry.cycleTimeMin.includes(':')) {
      const [minutes, seconds] = entry.cycleTimeMin.split(':').map(Number);
      cycleTimeMin = minutes + (seconds / 60);
    } else {
      cycleTimeMin = parseFloat(entry.cycleTimeMin) || 0;
    }
  }
  
  // Get other time values
  const mcRefTimeExer = parseFloat(entry.mcRefTimeExer) || 0;
  const teaLunchBreak = parseFloat(entry.teaLunchBreak) || 0;
  const meetingTraining = parseFloat(entry.meetingTraining) || 0;
  const targetSettingTime = parseFloat(entry.targetSettingTimeHr) || 0;
  
  // Calculate using the new formula
  return (((actualProdQty * cycleTimeMin) + (mcRefTimeExer + teaLunchBreak + meetingTraining)) / 60) + targetSettingTime;
};

// // Helper function to calculate Actual Duration
// const calculateActualDuration = (entry) => {
//   const actualProdQty = parseFloat(entry.actualProdQty) || 0;
//   const cycleTimeMin = parseFloat(entry.cycleTimeMin?.split(':')[0] || 0) + (parseFloat(entry.cycleTimeMin?.split(':')[1] || 0) / 60);
//   const mcRefTime = parseFloat(entry.mcRefTimeExer) || 0;
//   const teaLunchBreak = parseFloat(entry.teaLunchBreak) || 0;
//   const meetingTraining = parseFloat(entry.meetingTraining) || 0;
//   const targetSettingTime = parseFloat(entry.targetSettingTimeHr) || 0;

//   return ((actualProdQty * cycleTimeMin) + (mcRefTime + teaLunchBreak + meetingTraining)) / 60 + targetSettingTime;
// };

// Formula: {[Actual Duration (In Hrs.)] - [Tea & Lunch Break]/60}
const calculateActualDurationForOEE = (entry) => {
  const actualDurationForOEE = parseFloat(entry.actDurationHrs) || 0;
  const teaLunchBreak = parseFloat(entry.teaLunchBreak) || 0;
  return actualDurationForOEE - (teaLunchBreak / 60);
};

// Calculate Total Loss (In Hrs) by adding specified time fields and dividing by 60
const calculateTotalLossInHrs = (entry) => {
  // Add all the specified time loss fields
  const timeLosses = [
    parseFloat(entry.extraSettTime) || 0,
    parseFloat(entry.chipDispTime) || 0,
    parseFloat(entry.toolChangeSettingTime) || 0,
    parseFloat(entry.insertChangeTime) || 0,
    parseFloat(entry.drillChangeTime) || 0,
    parseFloat(entry.tapChangeTime) || 0,
    parseFloat(entry.diamenProbTime) || 0,
    parseFloat(entry.qcCheckTime) || 0,
    parseFloat(entry.operatorProbTime) || 0,
    parseFloat(entry.powerCutTime) || 0,
    parseFloat(entry.airPressureLowTime) || 0,
    parseFloat(entry.ctReduceTime) || 0,
    parseFloat(entry.mcHoldTime) || 0,
    parseFloat(entry.prodLossTime) || 0,
    parseFloat(entry.progEditMakeTime) || 0,
    parseFloat(entry.rawMtlShortageTime) || 0,
    parseFloat(entry.reworkEndPcsMachiningTime) || 0,
    parseFloat(entry.mcAlarmTime) || 0,
    parseFloat(entry.mcMaintTime) || 0
  ].reduce((sum, time) => sum + time, 0);

  // Convert from minutes to hours
  return timeLosses / 60;
};

// Formula: {[(Actual Duration For OEE)*60] - sum[M/C Ref. Time (Exer) to M/C Maint. Time]}/cycle time
const calculateTargetProdQty = (entry) => {
  // Get Actual Duration For OEE in hours and convert to minutes
  const actualDurationForOEE = parseFloat(entry.actDurationForOEE) || calculateActualDurationForOEE(entry);
  const actualDurationForOEEMinutes = actualDurationForOEE * 60;
  
  // Calculate sum of all time losses
  const timeLosses = [
    parseFloat(entry.mcRefTimeExer) || 0,
    parseFloat(entry.teaLunchBreak) || 0,
    parseFloat(entry.meetingTraining) || 0,
    parseFloat(entry.extraSettTime) || 0,
    parseFloat(entry.chipDispTime) || 0,
    parseFloat(entry.toolChangeSettingTime) || 0,
    parseFloat(entry.insertChangeTime) || 0,
    parseFloat(entry.drillChangeTime) || 0,
    parseFloat(entry.tapChangeTime) || 0,
    parseFloat(entry.diamenProbTime) || 0,
    parseFloat(entry.qcCheckTime) || 0,
    parseFloat(entry.operatorProbTime) || 0,
    parseFloat(entry.powerCutTime) || 0,
    parseFloat(entry.airPressureLowTime) || 0,
    parseFloat(entry.ctReduceTime) || 0,
    parseFloat(entry.mcHoldTime) || 0,
    parseFloat(entry.prodLossTime) || 0,
    parseFloat(entry.progEditMakeTime) || 0,
    parseFloat(entry.rawMtlShortageTime) || 0,
    parseFloat(entry.reworkEndPcsMachiningTime) || 0,
    parseFloat(entry.mcAlarmTime) || 0,
    parseFloat(entry.mcMaintTime) || 0
  ].reduce((sum, time) => sum + time, 0);
  
  // Get cycle time in minutes
  let cycleTimeMin = 0;
  if (entry.cycleTimeMin) {
    if (entry.cycleTimeMin.includes(':')) {
      const [minutes, seconds] = entry.cycleTimeMin.split(':').map(Number);
      cycleTimeMin = minutes + (seconds / 60);
    } else {
      cycleTimeMin = parseFloat(entry.cycleTimeMin) || 0;
    }
  }
  
  // Avoid division by zero
  if (cycleTimeMin === 0) return 0;
  
  // Calculate target production quantity
  return (actualDurationForOEEMinutes - timeLosses) / cycleTimeMin;
};

// Helper function to calculate Actual OEE
// Formula: Actual OEE (%) = {[Actual Prod Qty * Cycle Time (In Min)]/[Actual Duration For OEE * 60]}
const calculateActualOEE = (entry) => {
  // Get values needed for calculation
  const actualDurationForOEE = parseFloat(entry.actDurationForOEE) || 0;
  const actualProdQty = parseFloat(entry.actualProdQty) || 0;
  
  // Convert cycle time to decimal minutes
  let cycleTimeMin = 0;
  if (entry.cycleTimeMin) {
    if (entry.cycleTimeMin.includes(':')) {
      const [minutes, seconds] = entry.cycleTimeMin.split(':').map(Number);
      cycleTimeMin = minutes + (seconds / 60);
    } else {
      cycleTimeMin = parseFloat(entry.cycleTimeMin) || 0;
    }
  }

  // Check if we have all required values
  if (actualDurationForOEE > 0 && actualProdQty > 0 && cycleTimeMin > 0) {
    // Simple formula: Actual OEE (%) = {[Actual Prod Qty * Cycle Time (In Min)]/[Actual Duration For OEE * 60]}
    const oeeValue = (actualProdQty * cycleTimeMin) / (actualDurationForOEE * 60);
    // Convert to percentage and format to 2 decimal places
    return (oeeValue * 100).toFixed(2);
  }
  return null;
};

// Helper to cluster and aggregate production entries by consecutive Opr. No. in timeline
function clusterProductionEntries(entries) {
  if (!entries || entries.length === 0) return [];
  
  // First, sort all entries by date (ascending)
  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate) - new Date(b.startDate);
  });
  
  // Fields to sum for each group
  const sumFields = [
    'actualProdQty', 'targetProdQty', 'rejectionQty', 'targetSettingTimeHr', 'trgDurationHrs',
    'actDurationHrs', 'extraMeal', 'actDurationForOEE', 'diffHrs', 'mcRefTimeExer', 'teaLunchBreak',
    'meetingTraining', 'extraSettTime', 'chipDispTime', 'toolChangeSettingTime', 'insertChangeTime',
    'drillChangeTime', 'tapChangeTime', 'diamenProbTime', 'qcCheckTime', 'operatorProbTime', 'powerCutTime',
    'airPressureLowTime', 'ctReduceTime', 'mcHoldTime', 'prodLossTime', 'progEditMakeTime',
    'rawMtlShortageTime', 'reworkEndPcsMachiningTime', 'mcAlarmTime', 'mcMaintTime', 'totalLossInHrs'
  ];
  
  // Group entries by consecutive operation numbers in the timeline
  const result = [];
  let currentGroup = [];
  let lastOprNo = null;
  
  // Process entries in chronological order
  for (const entry of sortedEntries) {
    // If this is a new operation number, start a new group
    if (lastOprNo !== null && entry.oprNo !== lastOprNo) {
      // Process the current group if it exists
      if (currentGroup.length > 0) {
        // Create an aggregated entry for this group
        const first = currentGroup[0];
        const aggregated = { ...first };
        
        // Sum all numeric fields
        sumFields.forEach(field => {
          aggregated[field] = currentGroup.reduce((sum, e) => sum + (parseFloat(e[field]) || 0), 0);
        });
        
        // Find the earliest startDate in the group
        let earliestStartDate = null;
        for (const groupEntry of currentGroup) {
          if (groupEntry.startDate && (!earliestStartDate || new Date(groupEntry.startDate) < new Date(earliestStartDate))) {
            earliestStartDate = groupEntry.startDate;
          }
        }
        
        // Find the latest actualDate in the group
        let latestActualDate = null;
        for (const groupEntry of currentGroup) {
          if (groupEntry.actualDate && (!latestActualDate || new Date(groupEntry.actualDate) > new Date(latestActualDate))) {
            latestActualDate = groupEntry.actualDate;
          }
        }
        
        // Set the dates
        aggregated.startDate = earliestStartDate;
        aggregated.actualDate = latestActualDate;
        
        // Combine remarks from all entries
        aggregated.remarks = currentGroup.map(e => e.remarks).filter(Boolean).join(' | ');
        
        // Calculate OEE for the aggregated entry
        const actualProdQty = parseFloat(aggregated.actualProdQty) || 0;
        const rejectionQty = parseFloat(aggregated.rejectionQty) || 0;
        const actualDurationForOEE = parseFloat(aggregated.actDurationForOEE) || 0;
        const cycleTime = parseFloat(convertCycleTimeToDecimal(aggregated.cycleTimeMin)) || 0;
        
        aggregated.oee = (actualDurationForOEE > 0 && actualProdQty > 0)
          ? (((cycleTime * (actualProdQty - rejectionQty)) / (actualDurationForOEE * 60)) * 100).toFixed(2)
          : '0.00';
        
        // Add the aggregated entry to results
        result.push(aggregated);
      }
      
      // Start a new group with the current entry
      currentGroup = [entry];
    } else {
      // Add to the current group
      currentGroup.push(entry);
    }
    
    // Update the last operation number
    lastOprNo = entry.oprNo;
  }
  
  // Process the final group
  if (currentGroup.length > 0) {
    // Create an aggregated entry for this group
    const first = currentGroup[0];
    const aggregated = { ...first };
    
    // Sum all numeric fields
    sumFields.forEach(field => {
      aggregated[field] = currentGroup.reduce((sum, e) => sum + (parseFloat(e[field]) || 0), 0);
    });
    
    // Find the earliest startDate in the group
    let earliestStartDate = null;
    for (const groupEntry of currentGroup) {
      if (groupEntry.startDate && (!earliestStartDate || new Date(groupEntry.startDate) < new Date(earliestStartDate))) {
        earliestStartDate = groupEntry.startDate;
      }
    }
    
    // Find the latest actualDate in the group
    let latestActualDate = null;
    for (const groupEntry of currentGroup) {
      if (groupEntry.actualDate && (!latestActualDate || new Date(groupEntry.actualDate) > new Date(latestActualDate))) {
        latestActualDate = groupEntry.actualDate;
      }
    }
    
    // Set the dates
    aggregated.startDate = earliestStartDate;
    aggregated.actualDate = latestActualDate;
    
    // Combine remarks from all entries
    aggregated.remarks = currentGroup.map(e => e.remarks).filter(Boolean).join(' | ');
    
    // Calculate OEE for the aggregated entry
    const actualProdQty = parseFloat(aggregated.actualProdQty) || 0;
    const rejectionQty = parseFloat(aggregated.rejectionQty) || 0;
    const actualDurationForOEE = parseFloat(aggregated.actDurationForOEE) || 0;
    const cycleTime = parseFloat(convertCycleTimeToDecimal(aggregated.cycleTimeMin)) || 0;
    
    aggregated.oee = (actualDurationForOEE > 0 && actualProdQty > 0)
      ? (((cycleTime * (actualProdQty - rejectionQty)) / (actualDurationForOEE * 60)) * 100).toFixed(2)
      : '0.00';
    
    // Add the aggregated entry to results
    result.push(aggregated);
  }
  
  // Add serial numbers
  return result.map((entry, idx) => ({ ...entry, sNo: idx + 1 }));
}

// Cluster jobs table by consecutive jobCardNo and oprNo
function clusterJobs(jobs) {
  if (!jobs || jobs.length === 0) return [];
  const clusters = [];
  let current = null;
  let group = [];
  const sumFields = [
    'targetProd', 'actualProd', 'targetPHrs', 'lotQty'
  ];
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!current || job.opNo !== current.opNo || job.jobCardNo !== current.jobCardNo) {
      if (group.length > 0) {
        const first = group[0];
        const aggregated = { ...first };
        sumFields.forEach(f => {
          aggregated[f] = group.reduce((sum, e) => sum + (parseFloat(e[f]) || 0), 0);
        });
        aggregated.date = first.date;
        clusters.push(aggregated);
      }
      current = job;
      group = [job];
    } else {
      group.push(job);
    }
  }
  if (group.length > 0) {
    const first = group[0];
    const aggregated = { ...first };
    sumFields.forEach(f => {
      aggregated[f] = group.reduce((sum, e) => sum + (parseFloat(e[f]) || 0), 0);
    });
    aggregated.date = first.date;
    clusters.push(aggregated);
  }
  return clusters.map((c, idx) => ({ ...c, sNo: idx + 1 }));
}

export default function DailyProductionReport() {
  const [jobCardNo, setJobCardNo] = useState('');
  // Removed searchType state as we only have jobCardNo search now
  const [jobs, setJobs] = useState([]);
  const [productionEntries, setProductionEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allJobCardNumbers, setAllJobCardNumbers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  
  // Fetch all job card numbers for suggestions
  useEffect(() => {
    async function fetchAllJobCardNumbers() {
      try {
        const response = await axios.get('/job/all-job-card-numbers');
        if (response.data && Array.isArray(response.data)) {
          setAllJobCardNumbers(response.data);
        }
      } catch (err) {
        console.error('Error fetching job card numbers:', err);
      }
    }
    
    fetchAllJobCardNumbers();
  }, []);

  // Handle input change and update suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setJobCardNo(value);
    
    if (value.trim()) {
      const filteredSuggestions = allJobCardNumbers.filter(
        number => number.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setJobCardNo(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    

  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    setJobs([]);
    setProductionEntries([]);
    
    try {
      let jobsRes, entriesRes;
      
      if (jobCardNo) {
        // Search by job card number
        const encodedJobCardNo = encodeURIComponent(jobCardNo);
        jobsRes = await axios.get(`/job/report/${encodedJobCardNo}`);
        entriesRes = await axios.get(`/daily-production/entries/${encodedJobCardNo}`);
      } else {
        setError('Please enter a Job Card Number');
        setLoading(false);
        return;
      }
      
      // Sort jobs by date (newest first)
      const sortedJobs = [...(jobsRes?.data?.jobs || [])].sort((a, b) => {
        return new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01');
      });
      
      // Process production entries to calculate Target Duration, Actual Duration For OEE, Target Production Quantity, Difference (Hrs.), Total Loss (In Hrs), and OEE
      const processedEntries = (entriesRes?.data?.entries || []).map(entry => {
        // Calculate values first
        const targetDuration = calculateTargetDuration(entry);
        const actualDurationForOEE = calculateActualDurationForOEE(entry);
        const targetProdQty = calculateTargetProdQty(entry);
        const actualOEE = calculateActualOEE(entry);
        const totalLossInHrs = calculateTotalLossInHrs(entry);
        
        // For difference calculation, use the raw values without any intermediate rounding
        // This ensures we get the exact mathematical difference
        const actualDuration = parseFloat(entry.actDurationHrs) || 0;
        const differenceHrs = Math.round((actualDuration - targetDuration) * 100) / 100;
        
        return {
          ...entry,
          trgDurationHrs: targetDuration.toFixed(2),
          actDurationForOEE: actualDurationForOEE.toFixed(2),
          targetProdQty: targetProdQty.toFixed(0), // Rounded to whole number
          diffHrs: differenceHrs.toFixed(2),
          totalLossInHrs: totalLossInHrs.toFixed(2),
          target90OEE: actualOEE
        };
      });

      setJobs(sortedJobs);
      setProductionEntries(processedEntries);
      
      // Show error if neither jobs nor entries were found
      if ((sortedJobs.length === 0) && (processedEntries.length === 0)) {
        setError('No data found.');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFetch();
    }
  };

  const clustered = clusterProductionEntries(productionEntries);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-2 sm:px-6 lg:px-12 print:bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-6 text-blue-900 tracking-tight drop-shadow print:text-black print:drop-shadow-none">Daily Production Report</h2>
        
        {/* Search Options */}
        <div className="bg-white/80 shadow-lg rounded-xl p-6 mb-8 border border-blue-100 print:border-none print:shadow-none">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-80" ref={suggestionsRef}>
                <input
                  ref={inputRef}
                  className="border border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 px-4 py-2 rounded-lg w-full text-lg transition print:border-gray-400"
                  type="text"
                  placeholder="Enter Job Card No."
                  value={jobCardNo}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            
            <button
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-2 rounded-lg font-semibold text-lg shadow print:bg-gray-800 print:text-white"
              onClick={handleFetch}
              disabled={loading || !jobCardNo}
            >
              {loading ? 'Fetching...' : 'Fetch Report'}
            </button>
          </div>
        </div>
        {error && <div className="text-red-600 mb-4 font-semibold text-center">{error}</div>}
      {jobs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-2xl font-bold mb-4 text-blue-800">Jobs ({jobs.length})</h3>
          <div className="overflow-x-auto rounded-xl shadow border border-blue-100 print:shadow-none print:border-gray-400">
            <table className="min-w-full bg-white print:bg-white text-sm">
              <thead className="sticky top-0 z-10 print:static">
                <tr className="bg-blue-200/70 text-blue-900">
                  <th className="border px-3 py-2">S.No</th>
                  <th className="border px-3 py-2">Date</th>
                  <th className="border px-3 py-2">Job Card No.</th>
                  <th className="border px-3 py-2">M/C No.</th>
                  <th className="border px-3 py-2">Part Name</th>
                  <th className="border px-3 py-2">Part No.</th>
                  <th className="border px-3 py-2">Op. No.</th>
                  <th className="border px-3 py-2">Target PROD/Hrs</th>
                  <th className="border px-3 py-2">Target PROD</th>
                  <th className="border px-3 py-2">Actual PROD</th>
                  <th className="border px-3 py-2">Cycle Time</th>
                  <th className="border px-3 py-2">Setter</th>
                  <th className="border px-3 py-2">Lot Qty</th>
                </tr>
              </thead>
              <tbody>
                {clusterJobs(jobs).map((job, idx) => (
                  <tr key={job._id || idx} className={"hover:bg-blue-50 transition border-t border-blue-100 print:bg-white" + (idx % 2 === 1 ? ' bg-blue-50/50 print:bg-white' : '')}>
                    <td className="border px-3 py-2 text-center font-semibold">{idx + 1}</td>
                    <td className="border px-3 py-2">{job.date ? new Date(job.date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '-'}</td>
                    <td className="border px-3 py-2 font-bold text-blue-700">{job.jobCardNo}</td>
                    <td className="border px-3 py-2">{job.mcNo}</td>
                    <td className="border px-3 py-2">{job.partName}</td>
                    <td className="border px-3 py-2">{job.partNo}</td>
                    <td className="border px-3 py-2">{job.opNo}</td>
                    <td className="border px-3 py-2">{formatDecimal(job.targetPHrs)}</td>
                    <td className="border px-3 py-2">{formatDecimal(job.targetProd)}</td>
                    <td className="border px-3 py-2">{formatDecimal(job.actualProd)}</td>
                    <td className="border px-3 py-2">{convertCycleTimeToDecimal(job.cycleTime)}</td>
                    <td className="border px-3 py-2">{job.setter}</td>
                    <td className="border px-3 py-2">{job.lotQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Production Entries Section */}
      {productionEntries.length > 0 && (
        <div className="mt-10">
          <h3 className="text-2xl font-bold mb-4 text-green-800">Production Entries ({productionEntries.length})</h3> 
          
          <div className="overflow-x-auto rounded-lg shadow border border-green-100 print:shadow-none print:border-gray-400">
            <table className="min-w-full bg-white print:bg-white text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 print:static">
                <tr className="bg-green-200/70 text-green-900">
                  <th className="border px-3 py-2">S.No</th>
                  <th className="border px-3 py-2">Date</th>
                  <th className="border px-3 py-2">Job Card No.</th>
                  <th className="border px-3 py-2">Part Name (No.)</th>
                  <th className="border px-3 py-2">Opr. No.</th>
                  <th className="border px-3 py-2">Plan (Lot) Qty</th>
                  <th className="border px-3 py-2">Start Datetime</th>
                  <th className="border px-3 py-2">Actual Datetime</th>
                  <th className="border px-3 py-2">Actual OEE (%)</th>
                  <th className="border px-3 py-2">Actual Prod Qty</th>
                  <th className="border px-3 py-2">Target Prod. Qty</th>
                  <th className="border px-3 py-2">Rejection (Qty)</th>
                  <th className="border px-3 py-2">Cycle Time (In Min)</th>
                  <th className="border px-3 py-2">Targe-t Setting Time (Hr.)</th>
                  <th className="border px-3 py-2">Target Duration (In Hrs.)</th>
                  <th className="border px-3 py-2">Actual Duration (In Hrs.)</th>
                  <th className="border px-3 py-2">Extra Meal</th>
                  <th className="border px-3 py-2">Actual Duration For OEE</th>
                  <th className="border px-3 py-2">Difference (Hrs.)</th>
                  <th className="border px-3 py-2">M/C Ref. Time (Exer)</th>
                  <th className="border px-3 py-2">Tea & Lunch Break</th>
                  <th className="border px-3 py-2">Meeting & Training</th>
                  <th className="border px-3 py-2">Extra Sett. Time</th>
                  <th className="border px-3 py-2">Chip Disp. Time</th>
                  <th className="border px-3 py-2">Tool Change/Setting Time</th>
                  <th className="border px-3 py-2">Insert Change Time</th>
                  <th className="border px-3 py-2">Drill Change Time</th>
                  <th className="border px-3 py-2">Tap Change Time</th>
                  <th className="border px-3 py-2">Diamen. Prob. Time</th>
                  <th className="border px-3 py-2">Q.C. Check Time</th>
                  <th className="border px-3 py-2">Operator Prob. Time</th>
                  <th className="border px-3 py-2">Power Cut Time</th>
                  <th className="border px-3 py-2">Air Pressure Low Time</th>
                  <th className="border px-3 py-2">CT. Reduce Time</th>
                  <th className="border px-3 py-2">M/C Hold Time</th>
                  <th className="border px-3 py-2">Prod. Loss. Time</th>
                  <th className="border px-3 py-2">Prog. Edit/ Make Time</th>
                  <th className="border px-3 py-2">Raw Mtl. Shortage Time</th>
                  <th className="border px-3 py-2">Rework /End PCS. Machining Time</th>
                  <th className="border px-3 py-2">M/C Alarm Time</th>
                  <th className="border px-3 py-2">M/C Maint. Time</th>
                  <th className="border px-3 py-2">Total Loss (In Hrs)</th>
                  <th className="border px-52 py-5 w-[600px]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {clustered.map((entry, idx) => (
                  <tr key={entry.id || idx} className={"hover:bg-green-50 transition border-t border-green-100 print:bg-white" + (idx % 2 === 1 ? ' bg-green-50/50 print:bg-white' : '')}>
                    <td className="border px-3 py-2 text-center font-semibold">{idx + 1}</td>
                    <td className="border px-3 py-2">{entry.startDate ? new Date(entry.startDate).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '-'}</td>
                    <td className="border px-3 py-2 font-bold text-green-700">{entry.jobCardNo || '-'}</td>
                    <td className="border px-3 py-2">{entry.partNameNo || '-'}</td>
                    <td className="border px-3 py-2">{entry.oprNo || '-'}</td>
                    <td className="border px-3 py-2">{entry.planLotQty || '-'}</td>
                    <td className="border px-3 py-2">{entry.startDate ? new Date(entry.startDate).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : '-'}</td>
                    <td className="border px-3 py-2">{entry.actualDate ? new Date(entry.actualDate).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : '-'}</td>
                    <td className="border px-3 py-2">{entry.oee}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.actualProdQty) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.targetProdQty) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.rejectionQty) || '-'}</td>
                    <td className="border px-3 py-2">{convertCycleTimeToDecimal(entry.cycleTimeMin)}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.targetSettingTimeHr) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.trgDurationHrs) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.actDurationHrs) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.extraMeal) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.actDurationForOEE) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.diffHrs) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.mcRefTimeExer) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.teaLunchBreak) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.meetingTraining) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.extraSettTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.chipDispTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.toolChangeSettingTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.insertChangeTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.drillChangeTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.tapChangeTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.diamenProbTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.qcCheckTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.operatorProbTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.powerCutTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.airPressureLowTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.ctReduceTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.mcHoldTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.prodLossTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.progEditMakeTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.rawMtlShortageTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.reworkEndPcsMachiningTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.mcAlarmTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.mcMaintTime) || '-'}</td>
                    <td className="border px-3 py-2">{formatDecimal(entry.totalLossInHrs) || '-'}</td>
                    <td className="border px-3 py-2 w-[600px]">
                      <div className="whitespace-pre-line break-words scale-y-95 stroke-2 text-sm">
                        {entry.remarks || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                {productionEntries.length > 0 && (() => {
                  // Helper to sum a field
                  const sum = (field) => productionEntries.reduce((acc, entry) => acc + (parseFloat(entry[field]) || 0), 0);
                  // Helper to average a field, skipping zero/empty
                  const avgNonZero = (field) => {
                    if (field === 'cycleTimeMin') {
                      const validValues = productionEntries
                        .map(e => {
                          const decimal = convertCycleTimeToDecimal(e[field]);
                          return decimal === '-' ? null : parseFloat(decimal);
                        })
                        .filter(v => v !== null && v !== 0);
                      if (validValues.length === 0) return 0;
                      return validValues.reduce((a, b) => a + b, 0) / validValues.length;
                    }
                    const vals = productionEntries
                      .map(e => parseFloat(e[field]))
                      .filter(v => !isNaN(v) && v !== 0);
                    if (vals.length === 0) return 0;
                    return vals.reduce((a, b) => a + b, 0) / vals.length;
                  };
                  // Fields
                  const totalActualProdQty = sum('actualProdQty');
                  const totalTargetProdQty = sum('targetProdQty');
                  const totalRejectionQty = sum('rejectionQty');
                  const avgCycleTime = avgNonZero('cycleTimeMin');
                  const totalTargetSettingTime = sum('targetSettingTimeHr');
                  const totalActualDuration = sum('actDurationHrs');
                  const totalDiffHrs = sum('diffHrs');
                  const totalLossInHrs = sum('totalLossInHrs');
                  
                  // Weighted average cycle time (in minutes)
                  const totalCycleTimeNumerator = productionEntries.reduce(
                    (acc, e) => acc + ((parseFloat(e.actualProdQty) || 0) * (parseFloat(convertCycleTimeToDecimal(e.cycleTimeMin)) || 0)),
                    0
                  );
                  const totalCycleTimeDenominator = productionEntries.reduce(
                    (acc, e) => acc + (parseFloat(e.actualProdQty) || 0),
                    0
                  );
                  const weightedAvgCycleTime = totalCycleTimeDenominator > 0
                    ? totalCycleTimeNumerator / totalCycleTimeDenominator
                    : 0;
                  
                  // --- OEE Calculations ---
                  // Weighted (correct) OEE: sum(Good Output * Cycle Time) / sum(Actual Duration * 60)
                  const totalGoodOutputCycleTime = productionEntries.reduce((acc, e) => {
                    const goodOutput = (parseFloat(e.actualProdQty) || 0) - (parseFloat(e.rejectionQty) || 0);
                    const cycleTime = parseFloat(convertCycleTimeToDecimal(e.cycleTimeMin)) || 0;
                    return acc + (goodOutput * cycleTime);
                  }, 0);
                  const totalActualDurationMins = productionEntries.reduce((acc, e) => acc + ((parseFloat(e.actDurationHrs) || 0) * 60), 0);
                  const weightedOEE = (totalActualDurationMins > 0)
                    ? totalGoodOutputCycleTime / totalActualDurationMins
                    : null;
                  
                  // All time loss fields
                  const timeLossFields = [
                    'mcRefTimeExer','teaLunchBreak','meetingTraining','extraSettTime','chipDispTime','toolChangeSettingTime','insertChangeTime','drillChangeTime','tapChangeTime','diamenProbTime','qcCheckTime','operatorProbTime','powerCutTime','airPressureLowTime','ctReduceTime','mcHoldTime','prodLossTime','progEditMakeTime','rawMtlShortageTime','reworkEndPcsMachiningTime','mcAlarmTime','mcMaintTime','totalLossInHrs'
                  ];
                  const timeLossSums = timeLossFields.map(f => sum(f));
                  // Target Duration (In Hrs.) = (Actual Prod Qty * Avg Cycle Time)/60 + Target Setting Time (Hr.)
                  const totalTargetDuration = ((totalActualProdQty * avgCycleTime) / 60) + totalTargetSettingTime;

                  return (
                    <tr className="bg-green-300/60 font-bold text-green-900">
                      <td className="border px-3 py-2 text-center">Total</td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2"></td>
                      <td className="border px-3 py-2">-</td>
                      <td className="border px-3 py-2">
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '4px'
                        }}>
                          <div style={{
                            background: '#dbeafe',
                            color: '#1e293b',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            fontWeight: 'bold',
                            border: '1px solid #1e293b',
                            fontSize: '12px',
                            lineHeight: '1.2',
                            textAlign: 'left',
                            minWidth: '70px'
                          }}>
                            <div>Total OEE (weighted):</div>
                            <div>{weightedOEE !== null ? (weightedOEE * 100).toFixed(2) : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border px-3 py-2">{totalActualProdQty}</td>
                      <td className="border px-3 py-2">{totalTargetProdQty}</td>
                      <td className="border px-3 py-2">{totalRejectionQty}</td>
                      <td className="border px-3 py-2">{weightedAvgCycleTime.toFixed(2)}</td>
                      <td className="border px-3 py-2">{totalTargetSettingTime.toFixed(2)}</td>
                      <td className="border px-3 py-2">{totalTargetDuration.toFixed(2)}</td>
                      <td className="border px-3 py-2">{totalActualDuration.toFixed(2)}</td>
                      <td className="border px-3 py-2">-</td>
                      <td className="border px-3 py-2">{totalLossInHrs.toFixed(2)}</td>
                      <td className="border px-3 py-2">{totalDiffHrs.toFixed(2)}</td>
                      {timeLossSums.map((val, i) => (
                        <td key={i} className="border px-3 py-2">{val.toFixed(2)}</td>
                      ))}
                      <td className="border px-3 py-2 w-[600px]">-</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}