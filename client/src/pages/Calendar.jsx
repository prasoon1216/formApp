import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

function formatDisplayDate(dateStr) {
  // Expects dateStr in 'YYYY-MM-DD' format
  const [year, month, day] = dateStr.split('-');
  const monthName = new Date(dateStr).toLocaleString('default', { month: 'long' });
  // Capitalize the first letter, lowercase the rest
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
  return `${day}-${formattedMonth}-${year}`;
}

// Format decimal hours as 'X hrs Y min'
function formatHoursAndMinutes(decimalHours) {
  if (!decimalHours) return '0 hrs 0 min';
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  if (minutes === 60) {
    return `${hours + 1} hrs 0 min`;
  }
  
  return `${hours} hrs ${minutes} min`;
}

export default function Calendar({ onShiftSelect, closeCalendar }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [calendarData, setCalendarData] = useState([]);

  // Memoize static data to avoid recalculation on re-renders
  const months = useMemo(() => [...Array(12)].map((_, i) => 
    new Date(0, i).toLocaleString("default", { month: "long" })
  ), []);
  const years = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => today.getFullYear() + i), 
    [today]
  );

  // --- Reliable weekday mapping (0=Sun ... 6=Sat)
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getWeekdayFromDateStr(dateStr) {
    // dateStr: 'YYYY-MM-DD', always parse as UTC
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(yyyy, mm - 1, dd));
    return WEEKDAYS[dateObj.getUTCDay()];
  }

  function getDateAndWeekday(year, month, day) {
    // Always use UTC to avoid timezone issues
    const dateObj = new Date(Date.UTC(year, month, day));
    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const weekday = WEEKDAYS[dateObj.getUTCDay()];
    return { dateStr, weekday };
  }

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // Default break configuration
  const defaultBreakTemplates = [
    { name: 'Morning Tea', start: '10:00', end: '10:15', enabled: true },
    { name: 'Lunch', start: '13:00', end: '13:30', enabled: true },
    { name: 'Evening Tea', start: '16:45', end: '17:00', enabled: true }
  ];

  function ensureAllBreaksPresent(breaks) {
    // For each template break, ensure there's a break with the same name;
    // always force enabled:true unless explicitly disabled, and set default times if missing or empty
    const result = [];
    for (const tpl of defaultBreakTemplates) {
      const found = breaks.find(b => b.name === tpl.name);
      let enabled = found ? (found.enabled === false ? false : true) : true;
      // If enabled, force start/end to default if missing or empty string
      let start = (enabled && (!found || !found.start)) ? tpl.start : (found && found.start ? found.start : tpl.start);
      let end = (enabled && (!found || !found.end)) ? tpl.end : (found && found.end ? found.end : tpl.end);
      result.push({ ...tpl, ...found, enabled, start, end });
    }
    return result;
  }

  const initializeCalendarData = (year, month) => {
    const numDays = getDaysInMonth(year, month);
    return Array.from({ length: numDays }, (_, i) => {
      const { dateStr, weekday } = getDateAndWeekday(year, month, i + 1);
      const entry = {
        date: dateStr,
        day: weekday,
        shiftStart: '08:00', // default start time
        shiftEnd: '20:00',   // default end time for 12-hour shift
        regularBreaks: defaultBreakTemplates.map(b => ({ ...b, enabled: true })),
        specialBreak: { description: '', start: '', end: '', enabled: false },
        sundayWork: false,
        isExpanded: false, // For UI expandable rows
        rowHighlight: false // For row hover effect
      };
      
      // Pre-calculate available hours
      entry.availableHours = parseFloat(
        (calculateTimeDiff(entry.shiftStart, entry.shiftEnd) - calculateBreakTime(entry)).toFixed(2)
      );
      
      return entry;
    });
  };

  const fetchCalendar = async () => {
    const defaultData = initializeCalendarData(selectedYear, selectedMonth);
    try {
      // Filter calendar entries by month and year
      const res = await axios.get("http://localhost:3000/api/calendar", {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      
      const merged = defaultData.map((d) => {
        const match = res.data.find((e) => e.date === d.date);
        let mergedEntry = match ? { ...d, ...match } : d;
        // --- Always recalculate weekday from date string (source of truth)
        mergedEntry.day = getWeekdayFromDateStr(mergedEntry.date);
        // Ensure all three breaks are present and recalculate available hours EVERY time
        mergedEntry.regularBreaks = ensureAllBreaksPresent(mergedEntry.regularBreaks || []);
        // Always recalculate available hours, do not trust saved value
        const totalHours = calculateTimeDiff(mergedEntry.shiftStart, mergedEntry.shiftEnd);
        const breakHours = calculateBreakTime(mergedEntry);
        mergedEntry.availableHours = parseFloat((totalHours - breakHours).toFixed(2));
        return mergedEntry;
      });
      // --- Validation: ensure dates are unique and in order
      const dateSet = new Set();
      let lastDate = '';
      for (const entry of merged) {
        if (dateSet.has(entry.date)) {
          console.error('Duplicate date found:', entry.date);
        }
        if (lastDate && entry.date < lastDate) {
          console.error('Dates out of order:', entry.date, '<', lastDate);
        }
        dateSet.add(entry.date);
        lastDate = entry.date;
      }
      setCalendarData(merged);
    } catch (err) {
      console.error("Error fetching data:", err);
      setCalendarData(defaultData);
    }
  };

  useEffect(() => { fetchCalendar(); }, [selectedMonth, selectedYear]);

  const handleInputChange = (index, field, value) => {
    setCalendarData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      
      // Recalculate available hours when shift times change
      if (field === 'shiftStart' || field === 'shiftEnd') {
        newData[index] = calculateAvailableHours(newData[index]);
      }
      
      return newData;
    });
  };
  
  // Reset a row to default values
  const resetRow = (index) => {
    const currentEntry = calendarData[index];
    
    // Create a default entry with the same date
    const defaultEntry = {
      ...currentEntry,
      shiftStart: '08:00',
      shiftEnd: '20:00',
      regularBreaks: defaultBreakTemplates.map(b => ({ ...b, enabled: true })),
      specialBreak: { description: '', start: '', end: '', enabled: false },
      sundayWork: false
    };
    
    // Update the calendar data with recalculated hours
    setCalendarData(prev => {
      const newData = [...prev];
      newData[index] = calculateAvailableHours(defaultEntry);
      return newData;
    });
  };

  // Generic break change handler
  const handleBreakChange = (i, type, index, field, val) => {
    setCalendarData((prev) =>
      prev.map((entry, idx) => {
        if (idx !== i) return entry;
        
        let updatedEntry;
        
        if (type === 'regular') {
          const updatedBreaks = [...entry.regularBreaks];
          updatedBreaks[index] = { ...updatedBreaks[index], [field]: val };
          updatedEntry = { ...entry, regularBreaks: updatedBreaks };
        } else {
          const updatedSpecialBreak = { ...entry.specialBreak, [field]: val };
          updatedEntry = { ...entry, specialBreak: updatedSpecialBreak };
        }
        // Always recalculate available hours using merged-interval logic
        return calculateAvailableHours(updatedEntry);
      })
    );
  };
  
  // Convenience methods that call the generic handler
  const handleRegularBreakChange = (i, breakIndex, field, val) => 
    handleBreakChange(i, 'regular', breakIndex, field, val);
    
  const handleSpecialBreakChange = (i, field, val) => 
    handleBreakChange(i, 'special', null, field, val);
  
  const toggleExpand = (i) => {
    setCalendarData((prev) =>
      prev.map((entry, idx) =>
        idx === i ? { ...entry, isExpanded: !entry.isExpanded } : entry
      )
    );
  };
  
  const setRowHighlight = (i, highlight) => {
    setCalendarData((prev) =>
      prev.map((entry, idx) =>
        idx === i ? { ...entry, rowHighlight: highlight } : entry
      )
    );
  };
  
  // Calculate time difference in hours between two time strings ('HH:MM')
  const calculateTimeDiff = (start, end) => {
    if (!start || !end) return 0;
    
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Handle cases where end time is on the next day
    const diffMinutes = endTotalMinutes >= startTotalMinutes 
      ? endTotalMinutes - startTotalMinutes 
      : (24 * 60 - startTotalMinutes) + endTotalMinutes;
    
    return parseFloat((diffMinutes / 60).toFixed(2));
  };
  
  // Convert time string (HH:MM) to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Calculate the overlap between a break and shift hours (in hours)
  const calculateBreakOverlap = (breakStart, breakEnd, shiftStart, shiftEnd) => {
    // Convert all times to minutes for easier comparison
    const breakStartMins = timeToMinutes(breakStart);
    const breakEndMins = timeToMinutes(breakEnd);
    const shiftStartMins = timeToMinutes(shiftStart);
    const shiftEndMins = timeToMinutes(shiftEnd);
    
    // Handle overnight shifts (where shift end is earlier than shift start)
    const isOvernightShift = shiftEndMins <= shiftStartMins;
    const adjustedShiftEndMins = isOvernightShift ? shiftEndMins + 24*60 : shiftEndMins;
    
    // Handle overnight breaks
    const isOvernightBreak = breakEndMins <= breakStartMins;
    const adjustedBreakEndMins = isOvernightBreak ? breakEndMins + 24*60 : breakEndMins;
    
    // Find the overlap start and end times
    const overlapStart = Math.max(breakStartMins, shiftStartMins);
    const overlapEnd = Math.min(adjustedBreakEndMins, adjustedShiftEndMins);
    
    // Calculate overlap in minutes (if any)
    const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
    
    // Convert back to hours
    return parseFloat((overlapMinutes / 60).toFixed(2));
  };
  
  // Calculate total break time in hours (only counting portions within shift hours)
  const calculateBreakTime = (entry) => {
    const { shiftStart, shiftEnd } = entry;
    if (!shiftStart || !shiftEnd) return 0;
    
    let breakIntervals = [];
    // Add all enabled regular breaks
    entry.regularBreaks.forEach(breakItem => {
      if (breakItem.enabled && breakItem.start && breakItem.end) {
        const startMins = timeToMinutes(breakItem.start);
        const endMins = timeToMinutes(breakItem.end);
        breakIntervals.push([startMins, endMins]);
      }
    });
    // Add special break if enabled
    if (entry.specialBreak.enabled && entry.specialBreak.start && entry.specialBreak.end) {
      const startMins = timeToMinutes(entry.specialBreak.start);
      const endMins = timeToMinutes(entry.specialBreak.end);
      breakIntervals.push([startMins, endMins]);
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
    let totalBreakHours = 0;
    for (const [breakStart, breakEnd] of merged) {
      let overlapStart = Math.max(breakStart, shiftStartMins);
      let overlapEnd = Math.min(breakEnd, adjustedShiftEndMins);
      if (overlapEnd > overlapStart) {
        totalBreakHours += (overlapEnd - overlapStart) / 60;
      }
    }
    return parseFloat(totalBreakHours.toFixed(2));
  };
  
  // Calculate available hours (total shift time minus breaks)
  const calculateAvailableHours = (entry) => {
    const { shiftStart, shiftEnd } = entry;
    
    if (!shiftStart || !shiftEnd) {
      return { ...entry, availableHours: 0 };
    }
    
    const totalShiftHours = calculateTimeDiff(shiftStart, shiftEnd);
    const totalBreakHours = calculateBreakTime(entry);
    const available = Math.max(0, totalShiftHours - totalBreakHours);
    
    return { ...entry, availableHours: parseFloat(available.toFixed(2)) };
  };

  const handleConfirm = async () => {
    const entries = calendarData.filter((e) => e.shiftStart && e.shiftEnd);
    if (!entries.length) return alert("Enter shift times for at least one day.");

    try {
      // Save each entry with the new simplified API
      for (const e of entries) {
        // Create a clean payload
        const payload = {
          date: e.date,
          day: e.day,
          shiftStart: e.shiftStart || '',
          shiftEnd: e.shiftEnd || '',
          regularBreaks: Array.isArray(e.regularBreaks) ? e.regularBreaks : [],
          specialBreak: e.specialBreak || { description: '', start: '', end: '', enabled: false },
          availableHours: typeof e.availableHours === 'number' ? e.availableHours : 0,
          sundayWork: !!e.sundayWork
        };
        
        console.log('Saving entry for date:', e.date);

        // The new API endpoint handles create/update logic based on date
        await axios.post("http://localhost:3000/api/calendar", payload);
      }
      
      onShiftSelect(entries[0]);
      alert("Entries saved successfully!");
      closeCalendar();
    } catch (err) {
      console.error("Save error:", err);
      console.log('Error response:', err.response?.data);
      alert(`Failed to save entries. Please try again.`);
    }
  };

  // Reusable selector component
  const Selector = ({ label, value, setValue, options }) => (
    <div>
      <label className="font-medium">{label}:</label>
      <select
        className="ml-2 border p-1 rounded"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={idx}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={closeCalendar}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-[900px]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-blue-700">Production Calendar</h2>

        <div className="flex gap-4 mb-4">
          <Selector label="Month" value={selectedMonth} setValue={setSelectedMonth} options={months} />
          <Selector label="Year" value={selectedYear} setValue={setSelectedYear} options={years} />
        </div>

        <div className="overflow-y-auto max-h-96">
          <table className="table-auto border-collapse border border-gray-300 text-sm w-full rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-200">
              <tr className="bg-blue-600 text-white">
                <th className="border border-blue-500 px-4 py-3 font-semibold">Date</th>
                <th className="border border-blue-500 px-4 py-3 font-semibold">Day</th>
                <th className="border border-blue-500 px-4 py-3 font-semibold">Shift Start</th>
                <th className="border border-blue-500 px-4 py-3 font-semibold">Shift End</th>
                <th className="border border-blue-500 px-4 py-3 font-semibold">Breaks</th>
                <th className="border border-blue-500 px-4 py-3 font-semibold">Available Hours</th>
                <th className="border border-blue-500 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calendarData.map((entry, i) => (
                <React.Fragment key={entry.date}>
                  <tr 
                    className={`text-center transition-colors duration-200 
                    ${entry.specialBreak.enabled ? 'bg-yellow-50 hover:bg-yellow-100' : 
                      entry.rowHighlight ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'} 
                    ${entry.isExpanded ? 'border-b-0 border-blue-300 bg-blue-50' : ''}`}
                    onMouseEnter={() => setRowHighlight(i, true)}
                    onMouseLeave={() => setRowHighlight(i, false)}
                  >
                    <td className="border px-4 py-2">
                      <div className="font-medium">{formatDisplayDate(entry.date)}</div>
                    </td>
                    <td className="border px-4 py-2">
                      <div className="font-medium">{entry.day}</div>
                      {entry.day === 'Sun' && (
                        <div className="mt-2 flex items-center justify-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-blue-600"
                              checked={!!entry.sundayWork}
                              onChange={e => handleInputChange(i, 'sundayWork', e.target.checked)}
                            />
                            <span className="ml-2 text-xs text-blue-700 font-semibold">Work on Sunday</span>
                          </label>
                        </div>
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="time"
                        className="w-[120px] text-center border rounded-md p-1.5 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
                        value={entry.shiftStart}
                        onChange={e => handleInputChange(i, 'shiftStart', e.target.value)}
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="time"
                        className="w-[120px] text-center border rounded-md p-1.5 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
                        value={entry.shiftEnd}
                        onChange={e => handleInputChange(i, 'shiftEnd', e.target.value)}
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <div className="font-medium">{formatHoursAndMinutes(calculateBreakTime(entry))}</div>
                      {entry.specialBreak.enabled && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 font-medium mt-1 py-0.5 px-1.5 rounded inline-block">
                          {entry.specialBreak.description || 'Special Event'}
                        </div>
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="text-lg font-medium text-blue-700">{formatHoursAndMinutes(entry.availableHours)}</div>
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex space-x-2">
                        <button 
                          className={`px-3 py-1.5 rounded-md transition-all duration-150 
                            ${entry.isExpanded 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}
                          onClick={() => toggleExpand(i)}
                        >
                          {entry.isExpanded ? '✕ Hide' : '✎ Edit'}
                        </button>
                        {entry.isExpanded && (
                          <button 
                            className="px-3 py-1.5 rounded-md transition-all duration-150 bg-red-100 text-red-600 hover:bg-red-200"
                            onClick={() => resetRow(i)}
                            title="Reset to default values"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {entry.isExpanded && (
                    <tr className="bg-blue-50">
                      <td colSpan="7" className="border border-t-0 border-blue-200 p-0 overflow-hidden transition-all duration-500 ease-in-out">
                        <div className="p-5 bg-gradient-to-b from-blue-50 to-white rounded-b-lg shadow-inner">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-blue-700">Breaks for {formatDisplayDate(entry.date)}</h3>
                            <div className="text-sm text-gray-500">Total break time: {formatHoursAndMinutes(calculateBreakTime(entry))}</div>
                          </div>
                          
                          <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">📅 Regular Daily Breaks</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {entry.regularBreaks.map((breakItem, breakIndex) => (
                                <div key={breakIndex} className="p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-gray-700">{breakItem.name}</span>
                                    <label className="inline-flex items-center cursor-pointer">
                                      <span className="mr-2 text-sm text-gray-600">{breakItem.enabled ? 'Enabled' : 'Disabled'}</span>
                                      <div className="relative">
                                        <input 
                                          type="checkbox" 
                                          className="sr-only" 
                                          checked={breakItem.enabled}
                                          onChange={e => handleRegularBreakChange(i, breakIndex, 'enabled', e.target.checked)}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ${breakItem.enabled ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${breakItem.enabled ? 'transform translate-x-4' : ''}`}></div>
                                      </div>
                                    </label>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs block">Start</label>
                                      <input
                                        type="time"
                                        className="w-full border rounded text-sm"
                                        value={breakItem.start}
                                        disabled={!breakItem.enabled}
                                        onChange={e => handleRegularBreakChange(i, breakIndex, 'start', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs block">End</label>
                                      <input
                                        type="time"
                                        className="w-full border rounded text-sm"
                                        value={breakItem.end}
                                        disabled={!breakItem.enabled}
                                        onChange={e => handleRegularBreakChange(i, breakIndex, 'end', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">🎭 Special Event/Break</h4>
                            <div className="p-3 rounded-lg bg-white">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <div className="flex-grow">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
                                  <input
                                    type="text"
                                    className={`border rounded-md p-2 w-full ${!entry.specialBreak.enabled ? 'bg-gray-100' : 'bg-white'}`}
                                    placeholder="Event Description (e.g., Holi Celebration)"
                                    value={entry.specialBreak.description}
                                    disabled={!entry.specialBreak.enabled}
                                    onChange={e => handleSpecialBreakChange(i, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <span className="mr-3 text-sm font-medium text-gray-700">Enable Special Event</span>
                                    <div className="relative">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={entry.specialBreak.enabled}
                                        onChange={e => handleSpecialBreakChange(i, 'enabled', e.target.checked)}
                                      />
                                      <div className={`block w-14 h-7 rounded-full transition-colors duration-200 ${entry.specialBreak.enabled ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
                                      <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${entry.specialBreak.enabled ? 'transform translate-x-7' : ''}`}></div>
                                    </div>
                                  </label>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                  <input
                                    type="time"
                                    className={`w-full border rounded-md p-2 ${!entry.specialBreak.enabled ? 'bg-gray-100' : 'bg-white'}`}
                                    value={entry.specialBreak.start}
                                    disabled={!entry.specialBreak.enabled}
                                    onChange={e => handleSpecialBreakChange(i, 'start', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                  <input
                                    type="time"
                                    className={`w-full border rounded-md p-2 ${!entry.specialBreak.enabled ? 'bg-gray-100' : 'bg-white'}`}
                                    value={entry.specialBreak.end}
                                    disabled={!entry.specialBreak.enabled}
                                    onChange={e => handleSpecialBreakChange(i, 'end', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-5 flex justify-end">
                            <button 
                              onClick={() => toggleExpand(i)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button 
            onClick={closeCalendar} 
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-200 border border-gray-300 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 font-medium"
          >
            Save Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
