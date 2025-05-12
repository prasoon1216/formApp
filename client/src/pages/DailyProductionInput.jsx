import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import AlliedLogo from '../assets/images/AlliedLogo.jpg';
import axios from 'axios';

// Helper function for date formatting
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DailyProductionInput() {
  const [formData, setFormData] = useState({
    jobNo: "1",
    mcNo: "",
    jobCardNo: "", 
    partName: "",
    partNo: "",
    opNo: "",
    targetPHrs: "",
    targetProd: "",
    actualProd: "",
    cycleTime: "",
    setter: "",
    targetSettingTime: "",
    lotQty: "",
  })

  const [savedJobs, setSavedJobs] = useState([])
  const [isLoading, setIsLoading] = useState(false) 
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()))
  const [errors, setErrors] = useState({})
  const [editingJobId, setEditingJobId] = useState(null) 
  const [machines, setMachines] = useState([])

  const generateUniqueId = () => `entry_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const defaultEntry = {
    sNo: 1,
    id: generateUniqueId(), // Add unique ID
    jobCardNo: "",
    partNameNo: "",
    oprNo: "",
    planLotQty: "",
    startDate: "",
    actualDate: "",
    target90OEE: "",
    actualProdQty: "",
    targetProdQty: "",
    rejectionQty: "",
    cycleTimeMin: "", // Will store in MM:SS format
    targetSettingTimeHr: "",
    trgDurationHrs: "",
    actDurationHrs: "",
    extraMeal: "",
    actDurationForOEE: "",
    diffHrs: "",
    mcRefTimeExer: "",
    teaLunchBreak: "",
    meetingTraining: "",
    extraSettTime: "",
    chipDispTime: "",
    toolChangeSettingTime: "",
    insertChangeTime: "",
    drillChangeTime: "",
    tapChangeTime: "",
    diamenProbTime: "",
    qcCheckTime: "",
    operatorProbTime: "",
    powerCutTime: "",
    airPressureLowTime: "",
    ctReduceTime: "",
    mcHoldTime: "",
    prodLossTime: "",
    progEditMakeTime: "",
    rawMtlShortageTime: "",
    reworkEndPcsMachiningTime: "",
    mcAlarmTime: "",
    mcMaintTime: "",
    totalLossInHrs: "",
    remarks: ""
  };
  
  const [productionEntries, setProductionEntries] = useState([
    { ...defaultEntry, jobCardNo: "" }
  ]);
  
  // Table columns and corresponding keys for production entries
  const productionTableHeaders = [
    { label: "S.No.", key: "sNo" },
    { label: "Job Card No.", key: "jobCardNo" },
    { label: "Part Name (No.)", key: "partNameNo" },
    { label: "Opr. No.", key: "oprNo" },
    { label: "Plan (Lot) Qty", key: "planLotQty" },
    { label: "Start Datetime", key: "startDate" },
    { label: "Actual Datetime", key: "actualDate" },
    { label: "Actual OEE (%)", key: "target90OEE" },
    { label: "Actual Prod Qty", key: "actualProdQty" },
    { label: "Target Prod. Qty", key: "targetProdQty" },
    { label: "Rejection (Qty)", key: "rejectionQty" },
    { label: "Cycle Time (In Min)", key: "cycleTimeMin" },
    { label: "Target Setting Time (Hr.)", key: "targetSettingTimeHr" },
    { label: "Target Duration (In Hrs.)", key: "trgDurationHrs" },
    { label: "Actual Duration (In Hrs.)", key: "actDurationHrs" },
    { label: "Extra Meal", key: "extraMeal" },
    { label: "Actual Duration For OEE", key: "actDurationForOEE" },
    { label: "Difference (Hrs.)", key: "diffHrs" },
    { label: "M/C Ref. Time (Exer)", key: "mcRefTimeExer" },
    { label: "Tea & Lunch Break", key: "teaLunchBreak" },
    { label: "Meeting & Training", key: "meetingTraining" },
    { label: "Extra Sett. Time", key: "extraSettTime" },
    { label: "Chip Disp. Time", key: "chipDispTime" },
    { label: "Tool Change/Setting Time", key: "toolChangeSettingTime" },
    { label: "Insert Change Time", key: "insertChangeTime" },
    { label: "Drill Change Time", key: "drillChangeTime" },
    { label: "Tap Change Time", key: "tapChangeTime" },
    { label: "Diamen. Prob. Time", key: "diamenProbTime" },
    { label: "Q.C. Check Time", key: "qcCheckTime" },
    { label: "Operator Prob. Time", key: "operatorProbTime" },
    { label: "Power Cut Time", key: "powerCutTime" },
    { label: "Air Pressure Low Time", key: "airPressureLowTime" },
    { label: "CT. Reduce Time", key: "ctReduceTime" },
    { label: "M/C Hold Time", key: "mcHoldTime" },
    { label: "Prod. Loss. Time", key: "prodLossTime" },
    { label: "Prog. Edit/ Make Time", key: "progEditMakeTime" },
    { label: "Raw Mtl. Shortage Time", key: "rawMtlShortageTime" },
    { label: "Rework /End PCS. Machining Time", key: "reworkEndPcsMachiningTime" },
    { label: "M/C Alarm Time", key: "mcAlarmTime" },
    { label: "M/C Maint. Time", key: "mcMaintTime" },
    { label: "Total Loss (In Hrs)", key: "totalLossInHrs" },
    { label: "Remarks", key: "remarks" }
  ];
  
  // Delete a production entry row by index
  const handleDeleteRow = (index) => {
    setProductionEntries(prevEntries => {
      // Get the entry being deleted to get its ID
      const entryToDelete = prevEntries[index];
      
      // First, preserve all entries except the one to be deleted
      const remainingEntries = prevEntries.filter((_, i) => i !== index);
      
      // Now update only the sNo, keeping all other data including jobCardNo intact
      const newEntries = remainingEntries.map((entry, i) => ({
        ...entry,           // Preserve all existing data
        sNo: i + 1          // Only update the sNo
      }));
      
      // Remove localStorage item for the deleted entry by its ID (not index)
      if (entryToDelete?.id) {
        localStorage.removeItem(`jobCardNo_${entryToDelete.id}`);
      }
      
      // No need to update other localStorage entries as they're keyed by ID, not index
      
      return newEntries.length > 0 ? newEntries : [{ ...defaultEntry, sNo: 1, jobCardNo: '' }];
    });
  };

  // Helper: Get all job card numbers from saved jobs and production entries (for dropdown)
  const getAllJobCardNumbers = () => {
    // Only include job card numbers that are actually present in saved jobs (source of truth)
    const jobNumbersFromJobs = savedJobs.map(job => job.jobCardNo.trim());
    // Allow duplicates if present in jobs (user requested this)
    return jobNumbersFromJobs.filter(Boolean);
  };

  const fetchDailyProduction = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/daily-production/${currentDate}`);
      setSavedJobs(response.data.jobs || []);
      // Only update production entries if they are fetched for the first time, not on job deletion
      if (response.data.independentProductionEntries && response.data.independentProductionEntries.length > 0) {
        const entries = response.data.independentProductionEntries.map((entry, i) => ({
          ...defaultEntry,
          ...entry,
          id: entry.id || generateUniqueId(), // Ensure all entries have an ID
          sNo: entry.sNo || i + 1,
          jobCardNo: entry.jobCardNo !== undefined ? entry.jobCardNo : '',
          partNameNo: entry.partNameNo || '',
          oprNo: entry.oprNo || ''
        }));
        setProductionEntries(entries);
      } else {
        setProductionEntries([{ ...defaultEntry, sNo: 1, id: generateUniqueId(), jobCardNo: '' }]);
      }

      if (!editingJobId && (!response.data.jobs || response.data.jobs.length === 0)) {
        setFormData(prev => ({ ...prev, jobNo: '1' }));
      }
    } catch (error) {
      console.error('Error fetching daily production:', error);
      setSavedJobs([]);
      setProductionEntries([{ ...defaultEntry, sNo: 1, id: generateUniqueId(), jobCardNo: '' }]);
      if (!editingJobId) {
        setFormData(prev => ({ ...prev, jobNo: '1' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = async () => {
    // Validate required fields
    const requiredFields = ['jobNo', 'mcNo', 'jobCardNo', 'partName'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.map(field => {
        switch(field) {
          case 'jobNo': return 'Job No.';
          case 'mcNo': return 'Machine No.';
          case 'jobCardNo': return 'Job Card No.';
          case 'partName': return 'Part Name';
          default: return field;
        }
      }).join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Save job with all formData fields (including jobCardNo, do not clear it)
      const payload = { ...formData, currentDate };
      let response;
      if (editingJobId) {
        response = await axios.put(`http://localhost:3000/daily-production/job/${editingJobId}`, payload);
      } else {
        response = await axios.post('http://localhost:3000/daily-production/job', payload);
      }
      fetchDailyProduction();
      setIsLoading(false);
      if (!editingJobId) {
        setFormData({
          jobNo: "1", // Will be updated after fetching jobs for the new date
          mcNo: machines.length > 0 ? `${machines[0].type}-${machines[0].name}` : '',
          jobCardNo: "",
          partName: "",
          partNo: "",
          opNo: "",
          targetPHrs: "",
          targetProd: "",
          actualProd: "",
          cycleTime: "",
          setter: "",
          targetSettingTime: "",
          lotQty: "",
        });
        setEditingJobId(null);
      }
    } catch (error) {
      setIsLoading(false);
      alert('Error saving job: ' + (error.response?.data?.error || error.message));
    }
  };
  
  const handleProductionSave = async () => {
    try {
      setIsLoading(true);
      // Preserve all entry data including jobCardNo
      const entriesToSave = productionEntries.map((entry, index) => ({
        ...entry,
        sNo: index + 1,
        jobCardNo: entry.jobCardNo // Explicitly include jobCardNo
      }));

      const response = await axios.put(
        `http://localhost:3000/daily-production/production-independent`,
        {
          date: currentDate,
          productionEntries: entriesToSave
        }
      );

      setIsLoading(false);
      if (response.data) {
        if (response.data.productionEntries && response.data.productionEntries.length > 0) {
          // Use the exact data returned from the server
          setProductionEntries(response.data.productionEntries);
        } else {
          // If no entries returned, keep the current entries
          setProductionEntries(entriesToSave);
        }
        alert('Production entries saved successfully!');
      }
    } catch (error) {
      setIsLoading(false);
      alert(error.response?.data?.error || 'Failed to save production entries');
    }
  };

  const handleAddRow = () => {
    setProductionEntries(prev => [
      ...prev,
      {
        ...defaultEntry,
        id: generateUniqueId(), // Create a new ID for this entry
        sNo: prev.length + 1,
        jobCardNo: "" // Always start with empty jobCardNo for new rows; user must select
      }
    ]);
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setCurrentDate(newDate);
    setEditingJobId(null);
    setIsLoading(true);
    
    try {
      // Get machines first to ensure we can set a default machine
      const machinesResponse = await axios.get('http://localhost:3000/machines');
      const machinesList = machinesResponse.data || [];
      
      // Set a default machine if available
      const defaultMachine = machinesList.length > 0 ? `${machinesList[0].type}-${machinesList[0].name}` : '';
      
      // Reset form with default machine
      setFormData({
        jobNo: "1", // Will be updated after fetching jobs for the new date
        mcNo: defaultMachine,
        jobCardNo: "",
        partName: "",
        partNo: "",
        opNo: "",
        targetPHrs: "",
        targetProd: "",
        actualProd: "",
        cycleTime: "",
        setter: "",
        targetSettingTime: "",
        lotQty: "",
      });
      setProductionEntries([]);
      setEditingJobId(null);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error changing date:', error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:3000/daily-production/job/${jobId}`);
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
      // Do not touch production entries at all. Only jobs are affected.
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      alert('Error deleting job: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCopyJob = (job) => {
    // Generate a new job number
    const newJobNo = (parseInt(savedJobs[savedJobs.length - 1]?.jobNo || "0") + 1).toString();
    setFormData({
      ...job,
      jobNo: newJobNo,
      _id: undefined // Clear _id to ensure it's treated as a new job
    });
    setEditingJobId(null); // Ensure we're in "add new" mode
    // Do NOT reset production entries when copying a job; jobs and production entries are independent
    // setProductionEntries([defaultEntry]);
  };

  const handleEditJob = (jobId) => {
    const job = savedJobs.find(job => job._id === jobId);
    
    if (!job) {
      console.error('Job not found with ID:', jobId);
      return;
    }
    
    setFormData({
      ...job,
      _id: job._id // Ensure we preserve the _id
    });
    setEditingJobId(job._id);
    // Do NOT set productionEntries from job.productionEntries; jobs and production entries are independent
    // setProductionEntries(job.productionEntries?.length > 0 ? job.productionEntries : [defaultEntry]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  }

  // Function to handle production entry changes - only calculate Total Loss (In Hrs)
  const handleProductionEntryChange = (index, field, value) => {
    setProductionEntries(prevEntries => {
      const updatedEntries = [...prevEntries];
      updatedEntries[index] = { 
        ...updatedEntries[index], 
        [field]: value 
      };

      const entry = updatedEntries[index];

      // Store jobCardNo in localStorage when that field changes
      if (field === 'jobCardNo' && entry.id) {
        const trimmedValue = value.trim();
        localStorage.setItem(`jobCardNo_${entry.id}`, trimmedValue);
        
        if (trimmedValue) {
          const selectedJob = savedJobs.find(job => job.jobCardNo.trim() === trimmedValue);
          if (selectedJob) {
            updatedEntries[index] = {
              ...updatedEntries[index],
              partNameNo: `${selectedJob.partName}${selectedJob.partNo ? ` (${selectedJob.partNo})` : ''}`,
              oprNo: selectedJob.opNo || '',
              cycleTimeMin: selectedJob.cycleTime || ''
            };
          }
        }
      }

      // Calculate sum of time losses
      const timeLosses = [
        entry.mcRefTimeExer, entry.teaLunchBreak, entry.meetingTraining,
        entry.extraSettTime, entry.chipDispTime, entry.toolChangeSettingTime,
        entry.insertChangeTime, entry.drillChangeTime, entry.tapChangeTime,
        entry.diamenProbTime, entry.qcCheckTime, entry.operatorProbTime,
        entry.powerCutTime, entry.airPressureLowTime, entry.ctReduceTime,
        entry.mcHoldTime, entry.prodLossTime, entry.progEditMakeTime,
        entry.rawMtlShortageTime, entry.reworkEndPcsMachiningTime,
        entry.mcAlarmTime, entry.mcMaintTime
      ].reduce((sum, time) => sum + (parseFloat(time) || 0), 0);

      // Update total loss in hours
      entry.totalLossInHrs = (timeLosses / 60).toFixed(2);

      // Leave target90OEE empty
      entry.target90OEE = "";

      return updatedEntries;
    });
  };

  // Reset the form fields, errors, and editing state
  const handleClear = () => {
    setFormData({
      jobNo: "1",
      mcNo: machines.length > 0 ? `${machines[0].type}-${machines[0].name}` : '', // Keep default machine
      jobCardNo: "",
      partName: "",
      partNo: "",
      opNo: "",
      targetPHrs: "",
      targetProd: "",
      actualProd: "",
      cycleTime: "",
      setter: "",
      targetSettingTime: "",
      lotQty: "",
    });
    setErrors({});
    setEditingJobId(null);
  };

  // Enhanced: Add warning if duplicate jobCardNo exists for the same date and machine
  const isDuplicateJob = (job) => savedJobs.filter(j => j.jobCardNo === job.jobCardNo && j.mcNo === job.mcNo).length > 1;

  useEffect(() => {
    fetchDailyProduction();
  }, [currentDate]);

  useEffect(() => {
    // Fetch machines initially
    const fetchInitialData = async () => {
      try {
        // Get machines list
        const machinesResponse = await axios.get('http://localhost:3000/machines');
        if (machinesResponse.data && machinesResponse.data.length > 0) {
          const machinesList = machinesResponse.data;
          setMachines(machinesList);
          // Set default machine
          const defaultMachine = `${machinesList[0].type}-${machinesList[0].name}`;
          setFormData(prev => ({
            ...prev,
            mcNo: defaultMachine
          }));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);  // Run only once on component mount

  useEffect(() => {
    if (productionEntries.length === 0) {
      setProductionEntries([{ ...defaultEntry, sNo: 1, id: generateUniqueId() }]);
    }
  }, [productionEntries]);

  useEffect(() => {
    const restoreJobCardSelections = () => {
      setProductionEntries(prevEntries => {
        return prevEntries.map((entry) => {
          // Get job card by entry's ID, not by index
          const savedJobCardNo = entry.id ? localStorage.getItem(`jobCardNo_${entry.id}`) : null;
          if (savedJobCardNo) {
            return {
              ...entry,
              jobCardNo: savedJobCardNo
            };
          }
          return entry;
        });
      });
    };
    if (savedJobs.length > 0) {
      restoreJobCardSelections();
    }
  }, [savedJobs]);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center justify-between w-[75%]">
          <div className="border border-gray-300 p-2 text-center mr-4">
            <img src={AlliedLogo} alt="allied_logo" className="w-[150px] h-[150px]" />
          </div>
          <div className="text-5xl text-center font-bold underline">Daily Production Input</div>
        </div>
        <div className="text-sm gap-4 mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center justify-between gap-4 ">
              <div className="flex items-center gap-2 bg-white border-2 border-blue-400 rounded-2xl px-3 py-2 shadow-md">
                <Calendar size={25} className="text-blue-600 mr-2" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={handleDateChange}
                  className="text-xl font-bold text-blue-900 bg-transparent outline-none border-none w-44 cursor-pointer focus:ring-2 focus:ring-blue-300 rounded-lg transition-all duration-200"
                  style={{ letterSpacing: '2px' }}
                />
              </div>
              <button 
                onClick={() => fetchDailyProduction()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center"
                title="Refresh data without changing date"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="ml-1">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-[25%]">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveJob(); }} className="border border-gray-300 p-4 rounded">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="font-bold">Job {formData.jobNo}</h3>
            </div>

            {[
              { label: "Machine Number (M/C No.)", name: "mcNo", type: "select", options: machines.slice().sort((a, b) => `${a.type}-${b.name}`.localeCompare(`${b.type}-${b.name}`)).map(machine => `${machine.type}-${machine.name}`) },
              { label: "Job Card No.", name: "jobCardNo", type: "text", placeholder: "Enter job card number" },
              { label: "Part Name", name: "partName", type: "text", placeholder: "Enter part name" },
              { label: "Part No.", name: "partNo", type: "text", placeholder: "Enter part number" },
              { label: "Op. No.", name: "opNo", type: "text", placeholder: "Enter operation number" },
              { label: "Target Production per Hr", name: "targetPHrs", type: "text", placeholder: "Enter target production per hour" },
              { label: "Target Production", name: "targetProd", type: "text", placeholder: "Enter target production" },
              { label: "Actual Production", name: "actualProd", type: "text", placeholder: "Enter actual production" },
              // Custom MM:SS input for cycle time
              { label: "Cycle Time (MM:SS)", name: "cycleTime", type: "custom-time" },
              { label: "Setter", name: "setter", type: "text" },
              { label: "Lot Qty", name: "lotQty", type: "number" }
            ].map(({ label, name, type, options, placeholder }) => (
              <div key={name} className="mb-3">
                <label className="block text-sm mb-1">{label}</label>
                {type === "select" ? (
                  <select
                    name={name}
                    value={formData[name]}
                    onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1 rounded"
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : type === "custom-time" ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      name="cycleTimeMin"
                      value={formData.cycleTime ? formData.cycleTime.split(":")[0] : ""}
                      onChange={e => {
                        const min = e.target.value.padStart(2, '0');
                        const sec = formData.cycleTime && formData.cycleTime.includes(":") ? formData.cycleTime.split(":")[1] : "00";
                        handleInputChange({ target: { name: "cycleTime", value: `${min}:${sec}` } });
                      }}
                      className="w-1/2 border border-gray-300 px-2 py-1 rounded"
                      placeholder="MM"
                    />
                    <span className="self-center">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      name="cycleTimeSec"
                      value={formData.cycleTime ? formData.cycleTime.split(":")[1] : ""}
                      onChange={e => {
                        const sec = e.target.value.padStart(2, '0');
                        const min = formData.cycleTime && formData.cycleTime.includes(":") ? formData.cycleTime.split(":")[0] : "00";
                        handleInputChange({ target: { name: "cycleTime", value: `${min}:${sec}` } });
                      }}
                      className="w-1/2 border border-gray-300 px-2 py-1 rounded"
                      placeholder="SS"
                    />
                  </div>
                ) : (
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    className={`w-full border ${errors[name] ? "border-red-500" : "border-gray-300"} px-2 py-1 rounded`}
                    placeholder={placeholder}
                  />
                )}
                {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
              </div>
            ))}
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-1/2" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={handleClear} className="bg-gray-300 px-4 py-2 rounded w-1/2" disabled={isLoading}>
                Clear
              </button>
            </div>
          </form>
        </div>
        <div className="w-full md:w-[75%]">
          <div className="relative">
            <div className="flex justify-between items-center mb-4 bg-white sticky top-9 z-10 border-gray-300">
              <button
                onClick={handleAddRow}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Add Row
              </button>
              <button
                onClick={handleProductionSave}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save Production Table
              </button>
            </div>
            <div className="bg-gray-100 p-2 mb-4 rounded-md text-sm">
              Production entries are saved for this date and will remain until deleted.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-wrap text-slate-950">
                    {productionTableHeaders.map((header, index) => (
                      <th
                        key={index}
                        className={`border border-gray-300 p-1 text-center ${
                          header.label.includes("Part Name") ? "w-[300px]" : ""
                        }`}
                      >
                        {header.label}
                      </th>
                    ))}
                    <th className="border border-gray-300 p-1 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productionEntries.map((entry, index) => (
                    <tr key={index}>
                      {productionTableHeaders.map((header) => (
                        <td key={header.key} className="border border-gray-300 p-1 text-center">
                          {header.key === "jobCardNo" ? (
                            <select
                              value={entry.jobCardNo}
                              onChange={(e) => handleProductionEntryChange(index, 'jobCardNo', e.target.value)}
                              className="w-[200px] border border-gray-300 px-2 py-1 rounded"
                            >
                              <option value="">Select Job Card No.</option>
                              {getAllJobCardNumbers().map((jcNo) => (
                                <option key={jcNo} value={jcNo}>{jcNo}</option>
                              ))}
                            </select>
                          ) : header.key === "cycleTimeMin" ? (
                            <div className="flex gap-2 justify-center">
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={entry.cycleTimeMin ? entry.cycleTimeMin.split(":")[0] : ""}
                                onChange={e => {
                                  const min = e.target.value.padStart(2, '0');
                                  const sec = entry.cycleTimeMin && entry.cycleTimeMin.includes(":") ? entry.cycleTimeMin.split(":")[1] : "00";
                                  handleProductionEntryChange(index, 'cycleTimeMin', `${min}:${sec}`);
                                }}
                                className="w-[60px] border border-gray-300 px-2 py-1 rounded"
                                placeholder="MM"
                              />
                              <span className="self-center">:</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={entry.cycleTimeMin ? entry.cycleTimeMin.split(":")[1] : ""}
                                onChange={e => {
                                  const sec = e.target.value.padStart(2, '0');
                                  const min = entry.cycleTimeMin && entry.cycleTimeMin.includes(":") ? entry.cycleTimeMin.split(":")[0] : "00";
                                  handleProductionEntryChange(index, 'cycleTimeMin', `${min}:${sec}`);
                                }}
                                className="w-[60px] border border-gray-300 px-2 py-1 rounded"
                                placeholder="SS"
                              />
                            </div>
                          ) : (
                            <input
                              type={header.key === "startDate" || header.key === "actualDate" ? "datetime-local" : "text"}
                              value={entry[header.key] || ""}
                              onChange={(e) => handleProductionEntryChange(index, header.key, e.target.value)}
                              className={`border-none p-0 text-center ${
                                header.key.includes("Qty") || header.key.includes("Time") || header.key.includes("Hrs") 
                                  ? "w-[70px]" 
                                  : ""
                              } ${
                                header.key === "partNameNo" 
                                  ? "w-[260px]" 
                                  : ""
                              } ${
                                header.key === "oprNo" 
                                  ? "w-[65px]" 
                                  : ""
                              }`}
                            />
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-1 text-center">
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className="bg-red-400 text-white px-3 rounded-lg p-1 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8">
              <h3 className="font-bold mb-2">Saved Jobs</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-center">M/C No.</th>
                      <th className="border border-gray-300 p-2 text-center">Job Card No.</th>
                      <th className="border border-gray-300 p-2 text-center">Part Name</th>
                      <th className="border border-gray-300 p-2 text-center">Part No.</th>
                      <th className="border border-gray-300 p-2 text-center">Op. No.</th>
                      <th className="border border-gray-300 p-2 text-center">Trg. PROD P/Hrs</th>
                      <th className="border border-gray-300 p-2 text-center">Trg. PROD</th>
                      <th className="border border-gray-300 p-2 text-center">ACTUAL PROD.</th>
                      <th className="border border-gray-300 p-2 text-center">Cycle Time</th>
                      <th className="border border-gray-300 p-2 text-center">Setter</th>
                      <th className="border border-gray-300 p-2 text-center">Lot Qty</th>
                      <th className="border border-gray-300 p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedJobs.map((job) => (
                      <tr key={job._id} className="bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center">{job.mcNo}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.jobCardNo}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.partName}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.partNo}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.opNo}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.targetPHrs}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.targetProd}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.actualProd}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.cycleTime}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.setter}</td>
                        <td className="border border-gray-300 p-2 text-center">{job.lotQty}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditJob(job._id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCopyJob(job)}
                              className="bg-green-500 text-white px-3 py-1 rounded"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded"
                            >
                              Delete
                            </button>
                            {isDuplicateJob(job) && (
                              <span style={{color: 'orange', fontWeight: 'bold'}}>Duplicate!</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {savedJobs.length === 0 && (
                      <tr>
                        <td colSpan={12} className="border border-gray-300 p-4 text-center">
                          No saved jobs found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}