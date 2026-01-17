import React, { useMemo } from 'react';
import { useMonthlyData } from '../../hooks/useMonthlyData';

interface MonthlyTableProps {
  year: number;
  month: number;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ year, month }) => {
  const {
    monthlyData,
    weights,
    updateDailyEntry,
    loading,
    error
  } = useMonthlyData(year, month);
  
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);
  
  const getDayName = (day: number) => {
    const date = new Date(year, month - 1, day);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() + 1 && 
           year === today.getFullYear();
  };
  
  // Função simples para calcular pontuação
  const calculateSimpleScore = (activities: Record<string, number>) => {
    let total = 0;
    Object.entries(activities).forEach(([name, hours]) => {
      const weight = weights.find(w => w.name === name)?.weight || 1;
      total += hours * weight;
    });
    return Math.round(total * 100);
  };
  
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: 'white'
      }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Carregando dados do mês...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        background: '#fee', 
        textAlign: 'center'
      }}>
        <p style={{ color: '#c00', fontSize: '16px' }}>⚠️ {error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '10px 20px', 
            marginTop: '15px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Recarregar Página
        </button>
      </div>
    );
  }
  
  if (!monthlyData || weights.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: 'white'
      }}>
        <p style={{ color: '#666', fontSize: '16px' }}>⚠️ Nenhum dado disponível para este mês.</p>
        <p style={{ color: '#999', marginTop: '10px' }}>
          Banco: {monthlyData ? 'Carregado' : 'Não carregado'}, 
          Pesos: {weights.length}
        </p>
      </div>
    );
  }
  
  console.log('📊 Tabela renderizando com:', {
    diasNoMes: daysInMonth,
    entradas: monthlyData.entries.length,
    pesos: weights.length,
    primeirasEntradas: monthlyData.entries.slice(0, 3)
  });
  
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        background: 'white'
      }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Dia</th>
            {weights.map(weight => (
              <th key={weight.id || weight.name} style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                <div>{weight.name}</div>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                  peso: {weight.weight}
                </div>
              </th>
            ))}
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Dormir</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Acordar</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Bônus</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Pontuação</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const entry = monthlyData.entries.find(e => {
              if (!e.date) return false;
              return e.date.getDate() === day;
            });
            
            const today = isToday(day);
            const score = entry ? calculateSimpleScore(entry.activities) : null;
            
            return (
              <tr key={day} style={{ 
                borderBottom: '1px solid #eee',
                background: today ? '#e6f7ff' : 'white'
              }}>
                <td style={{ 
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: today ? 'bold' : 'normal'
                }}>
                  <div style={{ fontSize: today ? '16px' : '14px' }}>
                    {day}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                    {getDayName(day)}
                  </div>
                </td>
                
                {weights.map(weight => {
                  const value = entry?.activities[weight.name] || 0;
                  
                  return (
                    <td key={weight.id || weight.name} style={{ padding: '10px', textAlign: 'center' }}>
                      <input
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          console.log(`Atualizando ${weight.name} dia ${day}: ${newValue}`);
                          updateDailyEntry(day, {
                            activityName: weight.name,
                            activityValue: newValue
                          });
                        }}
                        style={{
                          width: '70px',
                          padding: '8px',
                          border: `2px solid ${weight.color}30`,
                          borderRadius: '6px',
                          background: '#f8f9fa',
                          textAlign: 'center',
                          fontSize: '14px'
                        }}
                      />
                    </td>
                  );
                })}
                
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={entry?.sleepTime || ''}
                    onChange={(e) => updateDailyEntry(day, {
                      sleepTime: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="--:--"
                    style={{
                      width: '70px',
                      padding: '8px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8f9fa',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}
                  />
                </td>
                
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={entry?.wakeUpTime || ''}
                    onChange={(e) => updateDailyEntry(day, {
                      wakeUpTime: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="--:--"
                    style={{
                      width: '70px',
                      padding: '8px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8f9fa',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}
                  />
                </td>
                
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={entry?.bonus || ''}
                    onChange={(e) => updateDailyEntry(day, {
                      bonus: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0.0"
                    style={{
                      width: '70px',
                      padding: '8px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      background: '#f8f9fa',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}
                  />
                </td>
                
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  {score !== null && score > 0 ? (
                    <div style={{ 
                      fontSize: '16px',
                      color: score >= 1000 ? '#10b981' : 
                             score >= 500 ? '#f59e0b' : '#4a5568'
                    }}>
                      {score.toLocaleString('pt-BR')}
                    </div>
                  ) : (
                    <span style={{ color: '#a0aec0' }}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div style={{
        padding: '15px',
        background: '#f8f9fa',
        borderTop: '1px solid #eee',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        Total de dias no mês: {daysInMonth} • Entradas carregadas: {monthlyData.entries.length}
      </div>
    </div>
  );
};