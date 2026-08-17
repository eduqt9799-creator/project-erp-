import React from 'react';
import { Filter, Sparkles } from 'lucide-react';

export default function YearSelector({ selectedYear, onSelectYear, firstYearCount, secondYearCount, title = "Academic Batch Division" }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      backgroundColor: '#ffffff',
      border: '1px solid #e2dfd7',
      borderRadius: '8px',
      padding: '10px 16px',
      marginBottom: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
      flexWrap: 'wrap',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          backgroundColor: '#0d2847',
          color: '#ffffff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Filter size={12} /> {title}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onSelectYear(0)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s ease',
            backgroundColor: selectedYear === 0 ? '#0d2847' : '#faf9f6',
            color: selectedYear === 0 ? '#ffffff' : '#444444',
            borderColor: selectedYear === 0 ? '#0d2847' : '#dcd9d0'
          }}
        >
          🎓 All Batches
        </button>

        <button
          type="button"
          onClick={() => onSelectYear(1)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s ease',
            backgroundColor: selectedYear === 1 ? '#0f4c81' : '#faf9f6',
            color: selectedYear === 1 ? '#ffffff' : '#0f4c81',
            borderColor: selectedYear === 1 ? '#0f4c81' : '#dcd9d0'
          }}
        >
          🥇 First Year {firstYearCount !== undefined && `(${firstYearCount})`}
        </button>

        <button
          type="button"
          onClick={() => onSelectYear(2)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s ease',
            backgroundColor: selectedYear === 2 ? '#c5a059' : '#faf9f6',
            color: selectedYear === 2 ? '#ffffff' : '#8c6b27',
            borderColor: selectedYear === 2 ? '#c5a059' : '#dcd9d0'
          }}
        >
          🥈 Second Year {secondYearCount !== undefined && `(${secondYearCount})`}
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Sparkles size={12} color="#c5a059" /> +3rd & 4th Years coming soon
      </div>
    </div>
  );
}
