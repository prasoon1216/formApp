import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Calendar from "./Calendar";
import styles from "../MachinePlan.module.css";
import CalendarButton from "./CalendarButton";

export default function MachinePlan() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]); // State to store machine data
  const [filteredMachines, setFilteredMachines] = useState([]); // State for filtered machines
  const [loadUnloadSeconds, setLoadUnloadSeconds] = useState("");
  const [cncMinutes, setCncMinutes] = useState(0);
  const [cncSeconds, setCncSeconds] = useState(0);
  const [vmcMinutes, setVmcMinutes] = useState(0);
  const [vmcSeconds, setVmcSeconds] = useState(0);
  const [loadUnloadMinutes, setLoadUnloadMinutes] = useState(0);
  const [convMinutes, setConvMinutes] = useState(0);
  const [convSeconds, setConvSeconds] = useState(0);
  const [deburrMinutes, setDeburrMinutes] = useState(0);
  const [deburrSeconds, setDeburrSeconds] = useState(0);
  const [sandblastMinutes, setSandblastMinutes] = useState(0);
  const [sandblastSeconds, setSandblastSeconds] = useState(0);
  const [formData, setFormData] = useState({
    type: "CNC", // Default type
    mcNo: "",
    jobCardNo: "",
    partNo: "",
    partName: "",
    planQty: "",
    setupNo: "",
    cncTimePerPc: "",
    vmcTimePerPc: "",
    setupTime: "",
    loadUnloadTime: "",
    convTimePerPc: "",
    deburrTimePerPc: "",
    sandblastTimePerPc: "",
    startDate: "",
    totalTimeHrs: "",
    totalTimeOnlyMC: "",
    targetDateOnlyMC: "",
    targetDateWholePart: "",
    workingDays: "",
  });

  const [errors, setErrors] = useState({}); // Add state for errors
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [savedForms, setSavedForms] = useState([]); // State to store saved forms
  const [editingForm, setEditingForm] = useState(null); // State for editing form

  // Fetch machines from the backend when the component loads
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get("/machines");
        setMachines(response.data);
        // Filter machines by default type (CNC)
        setFilteredMachines(response.data.filter((machine) => machine.type && machine.type.toLowerCase() === "cnc"));
      } catch (error) {
        console.error("Error fetching machines:", error);
      }
    };
    fetchMachines();
  }, []);

  // Update filteredMachines when type changes
  useEffect(() => {
    setFilteredMachines(
      machines.filter(
        (machine) =>
          machine.type &&
          machine.type.toLowerCase() === formData.type.toLowerCase()
      )
    );
    // Also reset selected machine if type changes
    setFormData((prev) => ({ ...prev, mcNo: "" }));
  }, [formData.type, machines]);

  // Fetch saved forms from the backend
  const fetchSavedForms = async () => {
    try {
      const response = await axios.get("/form-submit");
      setSavedForms(response.data);
    } catch (error) {
      console.error("Error fetching saved forms:", error);
    }
  };

  // Fetch saved forms when the component loads
  useEffect(() => {
    fetchSavedForms();
  }, []);

  useEffect(() => {
    // Parse setupTime as minutes, default to 0 if not set
    const setupTimeMinutes = formData.setupTime ? parseFloat(formData.setupTime) : 0;

    const totalMinutes =
      (formData.cncTimePerPc && formData.planQty
        ? parseFloat(formData.cncTimePerPc) * parseFloat(formData.planQty)
        : 0) +
      (formData.vmcTimePerPc && formData.planQty
        ? parseFloat(formData.vmcTimePerPc) * parseFloat(formData.planQty)
        : 0) +
      (formData.convTimePerPc && formData.planQty
        ? parseFloat(formData.convTimePerPc) * parseFloat(formData.planQty)
        : 0) +
      (formData.deburrTimePerPc && formData.planQty
        ? parseFloat(formData.deburrTimePerPc) * parseFloat(formData.planQty)
        : 0) +
      (formData.sandblastTimePerPc && formData.planQty
        ? parseFloat(formData.sandblastTimePerPc) * parseFloat(formData.planQty)
        : 0) +
      (formData.loadUnloadTime && formData.planQty
        ? parseFloat(formData.loadUnloadTime) * parseFloat(formData.planQty)
        : 0) +
      setupTimeMinutes; // Include setup time

    const totalHours = (totalMinutes / 60).toFixed(2);
    // Calculate only M/C time (CNC + VMC + Load & Unload + Setup)
    const onlyMcMinutes =
      (formData.cncTimePerPc && formData.planQty ? parseFloat(formData.cncTimePerPc) * parseFloat(formData.planQty) : 0) +
      (formData.vmcTimePerPc && formData.planQty ? parseFloat(formData.vmcTimePerPc) * parseFloat(formData.planQty) : 0) +
      (formData.loadUnloadTime && formData.planQty ? parseFloat(formData.loadUnloadTime) * parseFloat(formData.planQty) : 0) +
      setupTimeMinutes; // Include setup time
    const onlyMcHours = (onlyMcMinutes / 60).toFixed(2);

    setFormData((prevFormData) => ({
      ...prevFormData,
      totalTimeHrs: totalHours,
      totalTimeOnlyMC: onlyMcHours,
    }));
    
    // Always update target dates with latest values
    updateTargetDates({
      ...formData,
      totalTimeHrs: totalHours,
      totalTimeOnlyMC: onlyMcHours,
    });
  }, [
    formData.cncTimePerPc,
    formData.vmcTimePerPc,
    formData.convTimePerPc,
    formData.deburrTimePerPc,
    formData.sandblastTimePerPc,
    formData.loadUnloadTime, // Add dependency for load and unload time
    formData.planQty,
    formData.startDate,
    formData.setupTime, // Add dependency for setup time
  ]);

  // --- UTILITY: Calculate overlap in minutes between two time ranges (HH:mm) ---
  function getOverlapMinutes(start1, end1, start2, end2) {
    // Convert to minutes
    const toMinutes = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    let s1 = toMinutes(start1), e1 = toMinutes(end1);
    let s2 = toMinutes(start2), e2 = toMinutes(end2);
    // Handle overnight
    if (e1 <= s1) e1 += 24 * 60;
    if (e2 <= s2) e2 += 24 * 60;
    const start = Math.max(s1, s2);
    const end = Math.min(e1, e2);
    return Math.max(0, end - start);
  }

  // --- Calculate available hours for a calendar entry (subtracting breaks) ---
  function calcAvailableHours(entry) {
    // Always recalculate using merged-interval logic, never trust stale value
    const shiftStart = entry.shiftStart || '08:00';
    const shiftEnd = entry.shiftEnd || '20:00';
    let shiftMinutes = getOverlapMinutes(shiftStart, shiftEnd, shiftStart, shiftEnd); // Total shift duration

    // Gather all break intervals (regular + special)
    let breakIntervals = [];
    if (Array.isArray(entry.regularBreaks)) {
      for (const b of entry.regularBreaks) {
        if (b.enabled && b.start && b.end) {
          let bs = timeToMinutes(b.start), be = timeToMinutes(b.end);
          breakIntervals.push([bs, be]);
        }
      }
    }
    if (entry.specialBreak && entry.specialBreak.enabled && entry.specialBreak.start && entry.specialBreak.end) {
      let bs = timeToMinutes(entry.specialBreak.start), be = timeToMinutes(entry.specialBreak.end);
      breakIntervals.push([bs, be]);
    }

    // Merge overlapping intervals
    breakIntervals.sort((a, b) => a[0] - b[0]);
    let merged = [];
    for (const [start, end] of breakIntervals) {
      if (merged.length === 0) {
        merged.push([start, end]);
      } else {
        const last = merged[merged.length - 1];
        if (start <= last[1]) {
          last[1] = Math.max(last[1], end);
        } else {
          merged.push([start, end]);
        }
      }
    }

    // Calculate overlap with shift hours
    const shiftStartMins = timeToMinutes(shiftStart);
    const shiftEndMins = timeToMinutes(shiftEnd);
    const isOvernightShift = shiftEndMins <= shiftStartMins;
    const adjustedShiftEndMins = isOvernightShift ? shiftEndMins + 24*60 : shiftEndMins;

    let breakMinutes = 0;
    for (const [breakStart, breakEnd] of merged) {
      let overlapStart = Math.max(breakStart, shiftStartMins);
      let overlapEnd = Math.min(breakEnd, adjustedShiftEndMins);
      if (overlapEnd > overlapStart) {
        breakMinutes += (overlapEnd - overlapStart);
      }
    }

    return parseFloat(((shiftMinutes - breakMinutes) / 60).toFixed(2));
  }

  // Helper to convert HH:MM to minutes
  function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  // --- Walk forward from a custom start time, skipping breaks, to find finish time ---
  function getFinishTimeWithBreaksCustomStart(startTime, shiftEnd, breaks, requiredMinutes) {
    const toMinutes = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const toTimeStr = mins => {
      let h = Math.floor(mins / 60) % 24;
      let m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    let t = toMinutes(startTime);
    let end = toMinutes(shiftEnd);
    if (end <= t) end += 24 * 60; // Overnight
    // Prepare all breaks as [start, end) in minutes
    const allBreaks = breaks.map(b => {
      let bs = toMinutes(b.start), be = toMinutes(b.end);
      if (be <= bs) be += 24 * 60;
      return [bs, be];
    }).sort((a, b) => a[0] - b[0]);
    let workDone = 0;
    let bIdx = 0;
    while (t < end && workDone < requiredMinutes) {
      // If next break is now or has passed, skip it
      if (bIdx < allBreaks.length && t >= allBreaks[bIdx][1]) bIdx++;
      // If in a break, jump to end of break
      if (bIdx < allBreaks.length && t >= allBreaks[bIdx][0] && t < allBreaks[bIdx][1]) {
        t = allBreaks[bIdx][1];
        continue;
      }
      // Work one minute
      workDone++;
      t++;
    }
    return toTimeStr(t);
  }

  // --- Merge overlapping break intervals, returns array of [start, end] in minutes
  function mergeBreakIntervals(breaks) {
    const intervals = breaks
      .filter(b => b.start && b.end)
      .map(b => {
        let bs = timeToMinutes(b.start), be = timeToMinutes(b.end);
        if (be <= bs) be += 24 * 60;
        return [bs, be];
      })
      .sort((a, b) => a[0] - b[0]);
    let merged = [];
    for (const [start, end] of intervals) {
      if (!merged.length) merged.push([start, end]);
      else {
        const last = merged[merged.length - 1];
        if (start <= last[1]) last[1] = Math.max(last[1], end);
        else merged.push([start, end]);
      }
    }
    return merged;
  }

  // Helper function to find the next working day and time
  const findNextWorkingTime = (initialStartDate, calendarData) => {
    let currentDate = new Date(initialStartDate);
    let isStillOriginalDay = true; // Flag to track if we are still on the initial start day
    let guard = 0;
    const maxGuard = 365; // Max 1 year to prevent infinite loops

    const toMinutes = t => {
      if (!t) return 0;
      const [h, m] = String(t).split(":").map(Number);
      return h * 60 + m;
    };

    const toDateWithTime = (date, minutes) => {
      const newDate = new Date(date);
      newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return newDate;
    };

    while (guard < maxGuard) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-indexed
      const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayOfMonth}`;
      const calendarEntry = calendarData.find(e => e.date === dateStr);

      const isSunday = calendarEntry?.day === 'Sun' || currentDate.getDay() === 0;
      const isSundayWork = calendarEntry?.sundayWork === true || String(calendarEntry?.sundayWork).toLowerCase() === 'true';

      if (isSunday && !isSundayWork) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        isStillOriginalDay = false;
        guard++;
        continue;
      }

      const shiftStartStr = calendarEntry?.shiftStart || '08:00';
      const shiftEndStr = calendarEntry?.shiftEnd || '20:00';
      const shiftStartMin = toMinutes(shiftStartStr);
      const shiftEndMin = toMinutes(shiftEndStr);

      let currentProcessingTimeMin;

      if (isStillOriginalDay) {
        currentProcessingTimeMin = initialStartDate.getHours() * 60 + initialStartDate.getMinutes();
      } else {
        currentProcessingTimeMin = shiftStartMin;
      }
      
      // If day is not in calendar and not a Sunday, it defaults to 08:00-20:00 shift.
      // If it's a non-working day (e.g. no shift times defined and not a default working day type), skip.
      // This check is simplified: if shiftStartMin and shiftEndMin are effectively 0 (or equal), assume non-working unless explicitly SundayWork.
      if (shiftStartMin === shiftEndMin && !(isSunday && isSundayWork)) { // A crude check for no defined shift
         // Only advance if there's no calendar entry to provide defaults, or entry explicitly has no hours
         if (!calendarEntry || (!calendarEntry.shiftStart && !calendarEntry.shiftEnd)) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
            isStillOriginalDay = false;
            guard++;
            continue;
         }
      }

      if (currentProcessingTimeMin < shiftStartMin) {
        return { date: toDateWithTime(currentDate, shiftStartMin), isFirstDay: isStillOriginalDay };
      } else if (currentProcessingTimeMin >= shiftStartMin && currentProcessingTimeMin < shiftEndMin) {
        return { date: toDateWithTime(currentDate, currentProcessingTimeMin), isFirstDay: isStillOriginalDay };
      } else { // currentProcessingTimeMin >= shiftEndMin
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        isStillOriginalDay = false;
        guard++;
      }
    }
    console.warn("findNextWorkingTime: Fallback. Could not find a suitable working time within maxGuard limit.");
    return { date: new Date(initialStartDate), isFirstDay: true };
  };

  const calculateTargetDate = async (startDate, totalTimeHrs) => {
  try {
    const response = await axios.get("http://localhost:10000/api/calendar");  
    const calendarData = response.data;

    const { date: adjustedStartDate, isFirstDay: initialIsFirstDayFlag } = findNextWorkingTime(new Date(startDate), calendarData);
    
    let remainingHours = totalTimeHrs;
    let currentDate = new Date(adjustedStartDate);
    let finishDate = null;
    let guard = 0;
    const maxGuard = 1000;
    const startTimeStr = adjustedStartDate.toTimeString().slice(0,5);
    let isFirstDay = initialIsFirstDayFlag;

    while (remainingHours > 0 && guard < maxGuard) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${day}`;
      const entry = calendarData.find(e => e.date === dateStr);

        // --- SUNDAY SKIP LOGIC ---
      const isSunday = entry && (entry.day === 'Sun' || new Date(dateStr).getDay() === 0);
      const isSundayWork = entry && entry.sundayWork;
      if (isSunday && !isSundayWork) {
          // Skip this day if it's a Sunday and not marked as working
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0,0,0,0);
        isFirstDay = false;
        guard++;
        continue;
      }

      let availableEntry = entry && entry.availableHours ? parseFloat(entry.availableHours) : 0; // Renamed to avoid conflict
      if (availableEntry > 0) {
        // Corrected logic starts here
        let shiftStart = entry.shiftStart || '08:00';
        let shiftEnd = entry.shiftEnd || '20:00';
        const toMinutes = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
        let shiftStartMin = toMinutes(shiftStart);
        let shiftEndMin = toMinutes(shiftEnd);
        let actualStartMin = isFirstDay ? Math.max(toMinutes(startTimeStr), shiftStartMin) : shiftStartMin;
        let workStartTime = `${String(Math.floor(actualStartMin / 60)).padStart(2, '0')}:${String(actualStartMin % 60).padStart(2, '0')}`;

        if (shiftEndMin <= actualStartMin) shiftEndMin += 24 * 60;
        let workWindow = shiftEndMin - actualStartMin;
        let breaks = [];
        let special = entry.specialBreak && entry.specialBreak.enabled && entry.specialBreak.start && entry.specialBreak.end
          ? { start: entry.specialBreak.start, end: entry.specialBreak.end } : null;

        if (special) {
          const specialStartMin = toMinutes(special.start);
          let specialEndMin = toMinutes(special.end);
          if (specialEndMin <= specialStartMin) specialEndMin += 24 * 60;
          if (Array.isArray(entry.regularBreaks)) {
            for (const b of entry.regularBreaks) {
              if (b.enabled && b.start && b.end) {
                let bStartMin = toMinutes(b.start);
                let bEndMin = toMinutes(b.end);
                if (bEndMin <= bStartMin) bEndMin += 24 * 60;
                if (bEndMin <= specialStartMin || bStartMin >= specialEndMin) {
                  breaks.push({ start: b.start, end: b.end });
                }
              }
            }
          }
          breaks.push(special);
        } else {
          if (Array.isArray(entry.regularBreaks)) {
            for (const b of entry.regularBreaks) {
              if (b.enabled && b.start && b.end) breaks.push({ start: b.start, end: b.end });
            }
          }
        }
        const merged = mergeBreakIntervals(breaks);
        let overlap = 0;
        for (const [bs, be] of merged) {
          let overlapStart = Math.max(bs, actualStartMin);
          let overlapEnd = Math.min(be, shiftEndMin);
          if (overlapEnd > overlapStart) overlap += (overlapEnd - overlapStart);
        }
        let availableMinutes = Math.max(0, workWindow - overlap);
        const functionContext = '[WP]';
        let availableToday = availableMinutes / 60;
        // Corrected logic ends here

        if (remainingHours <= availableToday) {
          // Convert merged breaks back to {start, end} format for getFinishTimeWithBreaksCustomStart
          const formattedBreaks = merged.map(([startMin, endMin]) => ({
            start: `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`,
            end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
          }));
          const finishTime = getFinishTimeWithBreaksCustomStart(workStartTime, shiftEnd, formattedBreaks, Math.round(remainingHours * 60));
          const finish = new Date(currentDate);
          const [fh, fm] = finishTime.split(":").map(Number);
          finish.setHours(fh, fm, 0, 0);
          finishDate = finish;
          break;
        } else {
          remainingHours -= availableToday;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0,0,0,0);
      isFirstDay = false;
      guard++;
    }
    if (guard >= maxGuard) {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 3);
      return farFuture.toISOString();
    }
    return finishDate ? finishDate.toISOString() : null;
  } catch (error) {
    console.error("Error fetching calendar data in calculateTargetDate:", error);
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + Math.ceil(totalTimeHrs / 8));
    return fallbackDate.toISOString();
  }
};

  const calculateTargetDateOnlyMC = async (startDate, totalTimeOnlyMC) => {
  try {
    const response = await axios.get("http://localhost:10000/api/calendar");
    const calendarData = response.data;

    const { date: adjustedStartDate, isFirstDay: initialIsFirstDayFlag } = findNextWorkingTime(new Date(startDate), calendarData);
    
    let remainingHours = totalTimeOnlyMC;
    let currentDate = new Date(adjustedStartDate);
    let finishDate = null;
    let guard = 0;
    const maxGuard = 1000;
    const startTimeStr = adjustedStartDate.toTimeString().slice(0,5);
    let isFirstDay = initialIsFirstDayFlag;

    while (remainingHours > 0 && guard < maxGuard) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${day}`;
      const entry = calendarData.find(e => e.date === dateStr);

      const isSunday = entry && (entry.day === 'Sun' || new Date(dateStr).getDay() === 0);
      const isSundayWork = entry && entry.sundayWork;
      if (isSunday && !isSundayWork) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0,0,0,0);
        isFirstDay = false;
        guard++;
        continue;
      }

      let availableEntry = entry && entry.availableHours ? parseFloat(entry.availableHours) : 0; // Renamed to avoid conflict
      if (availableEntry > 0) {
        // Corrected logic starts here
        let shiftStart = entry.shiftStart || '08:00';
        let shiftEnd = entry.shiftEnd || '20:00';
        const toMinutes = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
        let shiftStartMin = toMinutes(shiftStart);
        let shiftEndMin = toMinutes(shiftEnd);
        let actualStartMin = isFirstDay ? Math.max(toMinutes(startTimeStr), shiftStartMin) : shiftStartMin;
        let workStartTime = `${String(Math.floor(actualStartMin / 60)).padStart(2, '0')}:${String(actualStartMin % 60).padStart(2, '0')}`;

        if (shiftEndMin <= actualStartMin) shiftEndMin += 24 * 60;
        let workWindow = shiftEndMin - actualStartMin;
        let breaks = [];
        let special = entry.specialBreak && entry.specialBreak.enabled && entry.specialBreak.start && entry.specialBreak.end
          ? { start: entry.specialBreak.start, end: entry.specialBreak.end } : null;

        if (special) {
          const specialStartMin = toMinutes(special.start);
          let specialEndMin = toMinutes(special.end);
          if (specialEndMin <= specialStartMin) specialEndMin += 24 * 60;
          if (Array.isArray(entry.regularBreaks)) {
            for (const b of entry.regularBreaks) {
              if (b.enabled && b.start && b.end) {
                let bStartMin = toMinutes(b.start);
                let bEndMin = toMinutes(b.end);
                if (bEndMin <= bStartMin) bEndMin += 24 * 60;
                if (bEndMin <= specialStartMin || bStartMin >= specialEndMin) {
                  breaks.push({ start: b.start, end: b.end });
                }
              }
            }
          }
          breaks.push(special);
        } else {
          if (Array.isArray(entry.regularBreaks)) {
            for (const b of entry.regularBreaks) {
              if (b.enabled && b.start && b.end) breaks.push({ start: b.start, end: b.end });
            }
          }
        }
        const merged = mergeBreakIntervals(breaks);
        let overlap = 0;
        for (const [bs, be] of merged) {
          let overlapStart = Math.max(bs, actualStartMin);
          let overlapEnd = Math.min(be, shiftEndMin);
          if (overlapEnd > overlapStart) overlap += (overlapEnd - overlapStart);
        }
        let availableMinutes = Math.max(0, workWindow - overlap);
        const functionContext = '[MC]';
        let availableToday = availableMinutes / 60;
        // Corrected logic ends here

        if (remainingHours <= availableToday) {
          // Convert merged breaks back to {start, end} format for getFinishTimeWithBreaksCustomStart
          const formattedBreaks = merged.map(([startMin, endMin]) => ({
            start: `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`,
            end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
          }));
          const finishTime = getFinishTimeWithBreaksCustomStart(workStartTime, shiftEnd, formattedBreaks, Math.round(remainingHours * 60));
          const finish = new Date(currentDate);
          const [fh, fm] = finishTime.split(":").map(Number);
          finish.setHours(fh, fm, 0, 0);
          finishDate = finish;
          break;
        } else {
          remainingHours -= availableToday;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0,0,0,0);
      isFirstDay = false;
      guard++;
    }
    if (guard >= maxGuard) {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 3);
      return farFuture.toISOString();
    }
    return finishDate ? finishDate.toISOString() : null;
  } catch (error) {
    console.error("Error fetching calendar data in calculateTargetDateOnlyMC:", error);
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + Math.ceil(totalTimeOnlyMC / 8));
    return fallbackDate.toISOString();
  }
};

  const updateTargetDates = async (customFormData) => {
    const data = customFormData || formData;
    if (data.startDate) {
      const startDate = new Date(data.startDate);
      const totalTimeOnlyMC = parseFloat(data.totalTimeOnlyMC);
      const totalTimeHrs = parseFloat(data.totalTimeHrs);

      let targetDateOnlyMC = "";
      let targetDateWholePart = "";

      if (!isNaN(totalTimeOnlyMC) && totalTimeOnlyMC > 0) {
        const result = await calculateTargetDateOnlyMC(startDate, totalTimeOnlyMC);
        if (result) {
          const dt = new Date(result);
          const year = dt.getFullYear();
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          const hours = String(dt.getHours()).padStart(2, '0');
          const minutes = String(dt.getMinutes()).padStart(2, '0');
          targetDateOnlyMC = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
      }

      if (!isNaN(totalTimeHrs) && totalTimeHrs > 0) {
        const result = await calculateTargetDate(startDate, totalTimeHrs);
        if (result) {
          const dt = new Date(result);
          const year = dt.getFullYear();
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          const hours = String(dt.getHours()).padStart(2, '0');
          const minutes = String(dt.getMinutes()).padStart(2, '0');
          targetDateWholePart = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
      }

      setFormData((prevFormData) => ({
        ...prevFormData,
        targetDateOnlyMC,
        targetDateWholePart,
      }));
    }
  };

  useEffect(() => {
    // If we have startDate and totalTimeHrs, calculate target dates
    if (formData.startDate && formData.totalTimeHrs) {
      updateTargetDates();
    }
  }, [formData.startDate, formData.totalTimeHrs, formData.setupTime]);

  // --- Calculate working days between start and end date (inclusive) ---
  function calculateWorkingDays(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    // Zero out the time part for both dates
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    // Calculate the difference in days (inclusive)
    const diffMs = end - start;
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  useEffect(() => {
    // Update target dates with the latest values
    updateTargetDates({
      ...formData,
      totalTimeHrs: formData.totalTimeHrs,
      totalTimeOnlyMC: formData.totalTimeOnlyMC,
    });
    // Calculate working days if both start and end dates are present
    if (formData.startDate && formData.targetDateWholePart) {
      const days = calculateWorkingDays(formData.startDate, formData.targetDateWholePart);
      setFormData((prev) => ({ ...prev, workingDays: days }));
    }
  }, [formData.startDate, formData.targetDateWholePart]);

  useEffect(() => {
    // When target dates are updated, also update working days
    if (formData.startDate && formData.targetDateWholePart) {
      const days = calculateWorkingDays(formData.startDate, formData.targetDateWholePart);
      setFormData((prev) => ({ ...prev, workingDays: days }));
    }
  }, [formData.startDate, formData.targetDateWholePart]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Use nextFormData to ensure latest value is used for calculations
    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);

    // Filter machines when the type changes
    if (name === "type") {
      const filtered = machines.filter((machine) => machine.type === value);
      setFilteredMachines(filtered);
      nextFormData.mcNo = "";
      setFormData({ ...nextFormData });
    }

    // If user changes startDate, fetch calendar info for that date
    if (name === "startDate" && value) {
      try {
        const dateObj = new Date(value);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${day}`;
        const res = await axios.get("http://localhost:10000/api/calendar", { params: { month, year } });
        const entry = res.data.find((e) => e.date === dateStr);
        if (entry) {
          nextFormData.shiftStart = entry.shiftStart || '';
          nextFormData.shiftEnd = entry.shiftEnd || '';
          nextFormData.availableHours = entry.availableHours || '';
          setFormData({ ...nextFormData });
        }
      } catch (err) {
        // fallback: clear shift info
        nextFormData.shiftStart = '';
        nextFormData.shiftEnd = '';
        nextFormData.availableHours = '';
        setFormData({ ...nextFormData });
      }
    }

    // Calculate total times when relevant fields change
    if (
      name === "cncTimePerPc" ||
      name === "vmcTimePerPc" ||
      name === "convTimePerPc" ||
      name === "deburrTimePerPc" ||
      name === "sandblastTimePerPc" ||
      name === "planQty" ||
      name === "setupTime" ||
      name === "loadUnloadTime"
    ) {
      const cncTime = parseFloat(nextFormData.cncTimePerPc) || 0;
      const vmcTime = parseFloat(nextFormData.vmcTimePerPc) || 0;
      const convTime = parseFloat(nextFormData.convTimePerPc) || 0;
      const deburrTime = parseFloat(nextFormData.deburrTimePerPc) || 0;
      const sandblastTime = parseFloat(nextFormData.sandblastTimePerPc) || 0;
      const planQty = parseFloat(nextFormData.planQty) || 0;
      const setupTime = parseFloat(nextFormData.setupTime) || 0;
      const loadUnloadTime = parseFloat(nextFormData.loadUnloadTime) || 0;

      let totalMinutesOnlyMC = 0;
      if (nextFormData.type === "CNC") {
        totalMinutesOnlyMC = (cncTime + loadUnloadTime) * planQty;
      } else if (nextFormData.type === "VMC") {
        totalMinutesOnlyMC = (vmcTime + loadUnloadTime) * planQty;
      }

      // Whole part time: all operations
      const totalMinutesWholePart = 
        (cncTime * planQty) +
        (vmcTime * planQty) +
        (convTime * planQty) +
        (deburrTime * planQty) +
        (sandblastTime * planQty) +
        (loadUnloadTime * planQty) +
        setupTime;

      nextFormData.totalTimeOnlyMC = (totalMinutesOnlyMC / 60).toFixed(2);
      nextFormData.totalTimeHrs = (totalMinutesWholePart / 60).toFixed(2);
      setFormData({ ...nextFormData });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mcNo.trim()) {
      newErrors.mcNo = "M/C No. is required";
    }
    if (!formData.jobCardNo.trim()) {
      newErrors.jobCardNo = "Job Card No. is required";
    } else {
      // Check if job card number already exists (excluding current form if editing)
      const jobCardExists = savedForms.some(form => 
        form.jobCardNo === formData.jobCardNo && 
        (!editingForm || form._id !== editingForm)
      );
      if (jobCardExists) {
        newErrors.jobCardNo = "Job Card No. already exists";
      }
    }
    if (!formData.partName.trim()) {
      newErrors.partName = "Part Name is required";
    }
    if (!formData.partNo.trim()) {
      newErrors.partNo = "Part No. is required";
    }
    if (!formData.planQty.trim()) {
      newErrors.planQty = "Plan Qty. is required";
    }
    if (!formData.cncTimePerPc.trim()) {
      newErrors.cncTimePerPc = "Enter time in seconds";
    }
    if (!formData.setupNo.trim()) {
      newErrors.setupNo = "Setup No. is required";
    }
    if (!formData.startDate.trim()) {
      newErrors.startDate = "Start Date and Time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClear = () => {
    setFormData({
      type: "CNC",
      mcNo: "",
      jobCardNo: "",
      partNo: "",
      partName: "",
      planQty: "",
      setupNo: "",
      setupTime: "",
      loadUnloadTime: "",
      convTimePerPc: "",
      deburrTimePerPc: "",
      sandblastTimePerPc: "",
      startDate: "",
      totalTimeHrs: "",
      totalTimeOnlyMC: "",
      targetDateOnlyMC: "",
      targetDateWholePart: "",
      workingDays: "",
    });
    setErrors({});
    setEditingForm(null); // Reset editing form state

    // Reset all time input states
    setCncMinutes(0);
    setCncSeconds(0);
    setVmcMinutes(0);
    setVmcSeconds(0);
    setLoadUnloadMinutes(0);
    setLoadUnloadSeconds(0);
    setConvMinutes(0);
    setConvSeconds(0);
    setDeburrMinutes(0);
    setDeburrSeconds(0);
    setSandblastMinutes(0);
    setSandblastSeconds(0);
  };

  const handleCalendarClick = () => {
    setShowCalendarPopup(true);
  };

  const handleShiftSelect = (shiftData) => {
    const updated = {
      ...formData,
      startDate: shiftData.date + (shiftData.shiftStart ? 'T' + shiftData.shiftStart : ''),
      shiftStart: shiftData.shiftStart || '',
      shiftEnd: shiftData.shiftEnd || '',
      availableHours: shiftData.availableHours || '',
    };
    setFormData(updated);
    setShowCalendarPopup(false); // Close the calendar popup after selecting a shift
    // Update target dates after selecting shift
    setTimeout(() => updateTargetDates(updated), 0);
  };


  const closeCalendar = () => {
    setShowCalendarPopup(false); // Close the calendar popup when "Cancel" is clicked
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      let response;

      if (editingForm) {
        // Update existing form
        response = await axios.put(`/form-submit/${editingForm}`, formData);
        if (response.status === 200) {
          alert("Form updated successfully!");
          setEditingForm(null);
        }
      } else {
        // Create new form
        response = await axios.post("/form-submit", formData);
        if (response.status === 201) {
          alert("Form data saved successfully!");
        }
      }
      handleClear();
      await fetchSavedForms();
    } catch (error) {
      console.error("Error saving form data:", error);
      if (error.response?.status === 400) {
        alert(error.response.data.error);
      } else {
        alert("Failed to save form data. Please try again.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await axios.delete(`/form-submit/${id}`);
        await fetchSavedForms();
      } catch (error) {
        console.error("Error deleting form:", error);
        alert("Failed to delete form");
      }
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form._id);
    setFormData(form);

    // Reset all time input states
    setCncMinutes(0);
    setCncSeconds(0);
    setVmcMinutes(0);
    setVmcSeconds(0);
    setLoadUnloadMinutes(0);
    setLoadUnloadSeconds(0);
    setConvMinutes(0);
    setConvSeconds(0);
    setDeburrMinutes(0);
    setDeburrSeconds(0);
    setSandblastMinutes(0);
    setSandblastSeconds(0);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.formContainer}>
      <div style={{ display: '-ms-flexbox', flexDirection: 'column', alignItems: 'center', marginBottom: 8, }}>
  <h1 className={styles.formTitle}>Production Plan</h1>
  <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
    <CalendarButton onClick={handleCalendarClick} />
  </div>
</div>

      {/* Calendar Popup */}
      {showCalendarPopup && (
  <Calendar
    onShiftSelect={handleShiftSelect}
    closeCalendar={closeCalendar}
  />
) }

      <div className="border border-gray-300 p-4 rounded mb-4 bg-white shadow-sm">
        <div className="grid grid-cols-5 gap-x-6 gap-y-4">
          {/* Type and M/C No. */}
          {["type", "mcNo"].map((field) => (
            <div key={field} className="mb-3">
              <label className={styles.label}>{field === "type" ? "Type" : "M/C No."}</label>
              <select
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                className={styles.input}
              >
                {field === "type" ? (
                  <>
                    <option value="CNC">CNC</option>
                    <option value="VMC">VMC</option>
                  </>
                ) : (
                  <>
                    <option value="">Select Machine</option>
                    {filteredMachines.map((machine) => {
  // Prefer fullName or displayName if available, else fallback to name
  const display = machine.fullName || machine.displayName || machine.name;
  // Optionally, show type prefix for clarity
  // const display = `${machine.type} - ${machine.fullName || machine.displayName || machine.name}`;
  return (
    <option key={machine._id || machine.id || machine.name} value={machine.name}>
      {`${machine.type} - ${machine.name}`}
    </option>
  );
})}
                  </>
                )}
              </select>
              {errors[field] && <p className={styles.error}>{errors[field]}</p>}
            </div>
          ))}

          {/* Text/Number Inputs */}
          {[
            { name: "jobCardNo", label: "Job Card No" },
            { name: "partNo", label: "Part No" },
            { name: "partName", label: "Part Name" },
            { name: "planQty", label: "Plan Qty" },
            { name: "setupNo", label: "Setup No" },
            { name: "setupTime", label: "Setup Time (in Min)" },
          ].map(({ name, label }) => (
            <div key={name} className="mb-3">
              <label className={styles.label}>{label}</label>
              <input
                type={name === "planQty" || name === "setupTime" ? "number" : "text"}
                min={name === "planQty" || name === "setupTime" ? "0" : undefined}
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors[name] && <p className={styles.error}>{errors[name]}</p>}
            </div>
          ))}

          {/* Time Inputs (MM:SS) and Corresponding Totals */}
          {[ /* Time input pairs (MM:SS + Total) */
            formData.type === "CNC"
              ? { name: "cncTimePerPc", label: "CNC Time Per Pc (MM:SS)", minutes: cncMinutes, seconds: cncSeconds, setMinutes: setCncMinutes, setSeconds: setCncSeconds, totalLabel: "Total CNC Time (in Minutes)", totalValue: formData.cncTimePerPc }
              : { name: "vmcTimePerPc", label: "VMC Time Per Pc (MM:SS)", minutes: vmcMinutes, seconds: vmcSeconds, setMinutes: setVmcMinutes, setSeconds: setVmcSeconds, totalLabel: "Total VMC Time (in Minutes)", totalValue: formData.vmcTimePerPc },
            { name: "loadUnloadTime", label: "Load & Unload Time (MM:SS)", minutes: loadUnloadMinutes, seconds: loadUnloadSeconds, setMinutes: setLoadUnloadMinutes, setSeconds: setLoadUnloadSeconds, totalLabel: "Total L & UL Time (in Min)", totalValue: formData.loadUnloadTime },
            { name: "convTimePerPc", label: "Conv. Time Per Pc (MM:SS)", minutes: convMinutes, seconds: convSeconds, setMinutes: setConvMinutes, setSeconds: setConvSeconds, totalLabel: "Total Conv. Time (in Minutes)", totalValue: formData.convTimePerPc },
            { name: "deburrTimePerPc", label: "Deburring Time Per Pc (MM:SS)", minutes: deburrMinutes, seconds: deburrSeconds, setMinutes: setDeburrMinutes, setSeconds: setDeburrSeconds, totalLabel: "Total Deburring Time (in Min)", totalValue: formData.deburrTimePerPc },
            { name: "sandblastTimePerPc", label: "Sandblast Time Per Pc (MM:SS)", minutes: sandblastMinutes, seconds: sandblastSeconds, setMinutes: setSandblastMinutes, setSeconds: setSandblastSeconds, totalLabel: "Total Sandblast Time (in Min)", totalValue: formData.sandblastTimePerPc },
          ].map(({ name, label, minutes, seconds, setMinutes, setSeconds, totalLabel, totalValue }) => (
            <React.Fragment key={name}>
              {/* MM:SS Input */}
              <div className="mb-3"> 
                <label className={styles.label}>{label}</label>
                <div className={`flex border ${errors[name] ? "border-red-500" : "border-gray-300"} px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="MM"
                    value={minutes}
                    onChange={(e) => {
                      const min = parseInt(e.target.value, 10) || 0;
                      setMinutes(min);
                      const total = (min + (seconds / 60)).toFixed(2);
                      setFormData({ ...formData, [name]: total });
                    }}
                    className="w-1/2 outline-none text-center bg-white"
                  />
                  <span className="px-1 text-gray-500 self-center">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="SS"
                    value={seconds}
                    onChange={(e) => {
                      const sec = parseInt(e.target.value, 10) || 0;
                      setSeconds(sec);
                      const total = (minutes + (sec / 60)).toFixed(2);
                      setFormData({ ...formData, [name]: total });
                    }}
                    className="w-1/2 outline-none text-center bg-white"
                  />
                </div>
                {errors[name] && <p className={styles.error}>{errors[name]}</p>}
              </div>
              {/* Corresponding Total Time Field */}
              <div className="mb-3">
                <label className={styles.label}>{totalLabel}</label>
                <input
                  type="number"
                  value={totalValue && formData.planQty ? (parseFloat(totalValue) * parseFloat(formData.planQty)).toFixed(2) : ""}
                  readOnly
                  className="w-full border border-gray-300 px-3 py-2 rounded bg-gray-100"
                  placeholder="Auto-calculated"
                />
              </div>
            </React.Fragment>
          ))}
          
          {/* DateTime Inputs */}
          {["startDate", "targetDateOnlyMC", "targetDateWholePart"].map((field) => (
            <div key={field} className="mb-3">
              <label className={styles.label}>{field === 'startDate' ? 'Start Date and Time' : field === 'targetDateOnlyMC' ? 'Target Date (Only M/C)' : field === 'targetDateWholePart' ? 'Target Date (Whole Part)' : field}</label>
              <input
                type="datetime-local"
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors[field] && <p className={styles.error}>{errors[field]}</p>}
            </div>
          ))}
          
          {/* Readonly Calculated Fields */}
          {["totalTimeHrs", "totalTimeOnlyMC", "workingDays"].map((field) => (
            <div key={field} className="mb-3">
              <label className={styles.label}>
                {field === 'totalTimeHrs'
                  ? 'Total Time (Hrs) Whole Part'
                  : field === 'totalTimeOnlyMC'
                  ? 'Total Time (Hrs) only M/C'
                  : field === 'workingDays'
                  ? 'Working Days (Start to End, Inclusive)'
                  : field}
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData[field] || ''}
                readOnly
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-center py-2 gap-6"> 
          <button onClick={handleSave} className={styles.buttonPrimary}>
            {editingForm ? "Update" : "Save"}
          </button>
          <button onClick={handleClear} className={styles.buttonSecondary}>Clear</button>
        </div>
      </div>

      {/* Saved Forms Table */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Saved Forms</h2>
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead>
              <tr className="bg-gray-200 text-center ">
                <th className="border border-gray-300 px-4 py-2">Type</th>
                <th className="border border-gray-300 px-4 py-2">M/C No</th>
                <th className="border border-gray-300 px-4 py-2">Job Card No</th>
                <th className="border border-gray-300 px-4 py-2">Part No</th>
                <th className="border border-gray-300 px-4 py-2">Part Name</th>
                <th className="border border-gray-300 px-4 py-2">Plan Qty</th>
                <th className="border border-gray-300 px-4 py-2">Start Date</th>
                <th className="border border-gray-300 px-4 py-2">Total Time (Hrs) whole part</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedForms.length > 0 ? (
                savedForms.map((form, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{form.type}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.mcNo}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.jobCardNo}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.partNo}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.partName}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.planQty}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.startDate}</td>
                    <td className="border border-gray-300 px-4 py-2">{form.totalTimeHrs}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => handleEdit(form)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(form._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="border border-gray-300 px-4 py-2 text-center">
                    No saved forms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}