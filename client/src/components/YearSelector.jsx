import React from 'react';
import { Calendar, Filter, Sparkles } from 'lucide-react';

export default function YearSelector({ selectedYear, onSelectYear, firstYearCount, secondYearCount }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      backgroundColor: '#ffffff',
      border: '1px solid #e2dfd7',
      borderRadius: '10px',
      padding: '12px 18px',
      marginBottom: '24px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          backgroundColor: '#0d2847',
          color: '#ffffff',
          padding: '6px 10px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <Filter size={14} /> Batch / Year Filter
        </div>
        <span style={{ fontSize: '13px', color: '#555', fontWeight: 600 }}>
          Select Academic Year Division:
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onSelectYear(0)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s ease',
            backgroundColor: selectedYear === 0 ? '#0d2847' : '#faf9f6',
            color: selectedYear === 0 ? '#ffffff' : '#444444',
            borderColor: selectedYear === 0 ? '#0d2847' : '#dcd9d0'
          }}
        >
          🎓 All Years
        </button>

        <button
          type="button"
          onClick={() => onSelectYear(1)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s ease',
            backgroundColor: selectedYear === 1 ? '#0f4c81' : '#faf9f6',
            color: selectedYear === 1 ? '#ffffff' : '#0f4c81',
            borderColor: selectedYear === 1 ? '#0f4c81' : '#dcd9d0'
          }}
        >
          🥇 1st Year {firstYearCount !== undefined && `(${firstYearCount})`}
        </button>

        <button
          type="button"
          onClick={() => onSelectYear(2)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s ease',
            backgroundColor: selectedYear === 2 ? '#c5a059' : '#faf9f6',
            color: selectedYear === 2 ? '#ffffff' : '#8c6b27',
            borderColor: selectedYear === 2 ? '#c5a059' : '#dcd9d0'
          }}
        >
          🥈 2nd Year {secondYearCount !== undefined && `(${secondYearCount})`}
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Sparkles size={12} color="#c5a059" /> 3rd & 4th Years coming next semester
      </div>
    </div>
  );
}
