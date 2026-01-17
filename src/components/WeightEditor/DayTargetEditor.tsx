import React, { useState } from 'react';
import { ActivityWeights } from '../../core/models/types';

interface DayTargetEditorProps {
  weight: ActivityWeights;
  onSave: (targetsByDay: Record<string, number>) => void;
  onClose: () => void;
}

export const DayTargetEditor: React.FC<DayTargetEditorProps> = ({ weight, onSave, onClose }) => {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  const [targets, setTargets] = useState<Record<string, number>>(weight.targetsByDay || {});

  const decimalToTimeString = (decimal: number): string => {
    if (!decimal || decimal === 0) return '';
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  };

  const timeStringToDecimal = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)h?(\d*)/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    return hours + (minutes / 60);
  };

  const handleSave = () => {
    onSave(targets);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '500px'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          Metas de {weight.name} por Dia
        </h3>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {days.map(day => (
          <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              {day}
            </label>
            <input
              type="text"
              value={decimalToTimeString(targets[day] || 0)}
              onChange={(e) => {
                const value = timeStringToDecimal(e.target.value);
                setTargets(prev => ({
                  ...prev,
                  [day]: value
                }));
              }}
              placeholder="ex: 5h, 4h30"
              style={{
                padding: '8px 12px',
                border: `2px solid ${weight.color}40`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: weight.color || '#666'
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#e5e7eb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            background: weight.color || '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Salvar
        </button>
      </div>
    </div>
  );
};
