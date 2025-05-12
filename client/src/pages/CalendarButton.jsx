import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

export default function CalendarButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(90deg, #6366f1 0%, #22d3ee 100%)',
        color: '#fff', border: 'none', borderRadius: 8,
        padding: '0.7rem 1.5rem', fontSize: '1.1rem', fontWeight: 600,
        cursor: 'pointer', boxShadow: '0 2px 6px rgba(99,102,241,0.07)'
      }}
    >
      <FaCalendarAlt style={{ fontSize: 20 }} />
      Calendar
    </button>
  );
}
