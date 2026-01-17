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
  
  // Converter decimal para formato amigável (ex: 1.5 -> "1h30", 1.0 -> "1h")
  const decimalToTimeString = (decimal: number): string => {
    if (!decimal || decimal === 0) return '-';
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  };
  
  // Converter HH:MM para decimal (ex: "01:30" -> 1.5)
  const timeStringToDecimal = (timeStr: string): number => {
    if (!timeStr || timeStr === '00:00' || timeStr === '-') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  };
  
  // Incrementar em 30 minutos
  const incrementTime = (decimal: number, increment: 0.5 = 0.5): number => {
    return Math.max(0, decimal + increment);
  };
  
  // Decrementar em 30 minutos
  const decrementTime = (decimal: number, decrement: 0.5 = 0.5): number => {
    return Math.max(0, decimal - decrement);
  };
  
  // Calcular fator F uma vez para o mês
  // F = (dias_do_mês × 1000) / Σ(Hi × Ii)
  // onde Hi = horas planejadas (soma por dia do mês usando targetsByDay ou target)
  // e Ii = importância da atividade i
  const calculateMonthlyFactor = (): number => {
    let totalWeightedPlannedHours = 0;

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    // Para cada dia do mês, somar as horas planejadas de cada atividade naquele dia
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      const dayKey = dayNames[dow];

      weights.forEach(weight => {
        if (weight.hidden) return;
        const importance = weight.importance || 3;
        const plannedForDay = weight.targetsByDay && weight.targetsByDay[dayKey] !== undefined
          ? weight.targetsByDay[dayKey]
          : (weight.target || 0);

        totalWeightedPlannedHours += plannedForDay * importance;
      });
    }

    // Evitar divisão por zero: se não há horas planejadas, retornar 0 (nenhuma pontuação será distribuída)
    if (totalWeightedPlannedHours === 0) return 0;

    return (daysInMonth * 1000) / totalWeightedPlannedHours;
  };

  // Calcular pontuação diária
  // Pontuação do dia = F × horas_registradas_naquele_dia × Ii
  const calculateDailyScore = (activities: Record<string, number>): number => {
    const factor = calculateMonthlyFactor();
    if (!factor) return 0;

    let score = 0;

    Object.entries(activities).forEach(([name, hoursRecorded]) => {
      const activity = weights.find(w => w.name === name);
      if (!activity || activity.hidden) return;

      const importance = activity.importance || 3;
      // pontuacao = fator × horas_registradas × importancia
      score += factor * hoursRecorded * importance;
    });

    return Math.round(score);
  };
  
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: 'white',overflow: 'auto', maxHeight: '80vh'
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0 15px' }}>
      <div style={{ width: '100%', maxWidth: '700px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          background: 'white'
        }}>
        <thead>
          <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
            <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', fontSize: '12px', minWidth: '50px', position: 'sticky', top: 0, zIndex: 999, background: '#f3f4f6', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>Dia</th>
            {weights.filter(w => !w.hidden).map(weight => (
              <th key={weight.id || weight.name} style={{ 
                padding: '10px 4px',
                textAlign: 'center',
                fontWeight: '700',
                fontSize: '11px',
                background: '#f9fafb',
                borderLeft: `3px solid ${weight.color}`,
                position: 'sticky',
                top: 0,
                zIndex: 999,
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>{weight.name}</div>
                <div style={{ fontSize: '16px', letterSpacing: '1px' }}>
                  {Array(weight.importance || 3).fill('★').join('')}
                </div>
              </th>
            ))}
            <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', fontSize: '12px', background: '#ecfdf5', borderLeft: '3px solid #10b981', position: 'sticky', top: 0, zIndex: 999, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>Pontuação</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const entry = monthlyData.entries.find((e: any) => {
              if (!e.date) return false;
              return e.date.getDate() === day;
            });
            
            const today = isToday(day);
            const score = entry ? calculateDailyScore(entry.activities) : null;
            
            return (
              <tr key={day} style={{ 
                borderBottom: '4px solid #cbd5e1',
                background: today ? '#fef3c7' : (day % 2 === 0 ? '#e8edf1' : 'white'),
                transition: 'background 0.2s',
                boxShadow: index % 3 === 0 ? 'inset 0 1px 0 #323334' : 'none'
              }}>
                <td style={{ 
                  padding: '8px 6px',
                  textAlign: 'center',
                  fontWeight: today ? '700' : '500',
                  fontSize: '12px',
                  color: today ? '#92400e' : '#374151',
                  borderRight: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: today ? '14px' : '13px', fontWeight: 'bold' }}>
                    {day}
                  </div>
                  <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>
                    {getDayName(day)}
                  </div>
                </td>
                
                {weights.filter(w => !w.hidden).map(weight => {
                  const value = entry?.activities[weight.name] || 0;
                  const dayOfWeek = new Date(year, month - 1, day).getDay();
                  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
                  const currentDay = dayNames[dayOfWeek];
                  const dailyTarget = weight.targetsByDay?.[currentDay] || entry?.targets?.[weight.name] || weight.target || 0;
                  const progress = dailyTarget > 0 ? (value / dailyTarget) * 100 : 0;
                  const progressCapped = Math.min(progress, 100);
                  const timeDisplay = decimalToTimeString(value);
                  const targetDisplay = decimalToTimeString(dailyTarget);
                  
                  return (
                    <td key={weight.id || weight.name} style={{ 
                      padding: '6px 3px', 
                      textAlign: 'center',
                      background: `${weight.color}15`,
                      borderLeft: `3px solid ${weight.color}`,
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              const newValue = decrementTime(value);
                              updateDailyEntry(day, {
                                activityName: weight.name,
                                activityValue: newValue
                              });
                            }}
                            style={{
                              width: '20px',
                              height: '20px',
                              padding: '0',
                              border: 'none',
                              background: 'transparent',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: weight.color,
                              opacity: '0.4',
                              transition: 'opacity 0.2s, background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.background = `${weight.color}20`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.4';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            −
                          </button>
                          
                          <input
                            type="text"
                            value={timeDisplay}
                            onChange={(e) => {
                              const timeStr = e.target.value;
                              const newValue = timeStringToDecimal(timeStr);
                              if (newValue >= 0) {
                                updateDailyEntry(day, {
                                  activityName: weight.name,
                                  activityValue: newValue
                                });
                              }
                            }}
                            placeholder="-"
                            style={{
                              width: '42px',
                              padding: '4px 6px',
                              border: 'none',
                              borderRadius: '3px',
                              background: 'transparent',
                              textAlign: 'center',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: value > 0 ? weight.color : '#d1d5db',
                              transition: 'all 0.2s'
                            }}
                          />
                          
                          <button
                            onClick={() => {
                              const newValue = incrementTime(value);
                              updateDailyEntry(day, {
                                activityName: weight.name,
                                activityValue: newValue
                              });
                            }}
                            style={{
                              width: '20px',
                              height: '20px',
                              padding: '0',
                              border: 'none',
                              background: 'transparent',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: weight.color,
                              opacity: '0.4',
                              transition: 'opacity 0.2s, background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.background = `${weight.color}20`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.4';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            +
                          </button>
                        </div>

                        {dailyTarget > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#9ca3af'
                            }}>
                              {timeDisplay}
                            </span>
                            <span style={{ fontSize: '10px', color: '#d1d5db' }}>
                              / {targetDisplay}
                            </span>
                          </div>
                        )}
                        
                        {dailyTarget > 0 && (
                          <div style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${progressCapped}%`,
                                height: '100%',
                                background: progressCapped >= 100 ? '#10b981' : progressCapped >= 50 ? '#f59e0b' : '#ef4444',
                                transition: 'width 0.2s ease'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                
                <td style={{ 
                  padding: '8px 6px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  background: '#ecfdf5',
                  borderLeft: '3px solid #10b981'
                }}>
                  {score !== null && score > 0 ? (
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: '700',
                      color: score >= 1000 ? '#047857' : 
                             score >= 500 ? '#d97706' : '#6b7280'
                    }}>
                      {score.toLocaleString('pt-BR')}
                    </div>
                  ) : (
                    <span style={{ color: '#d1d5db', fontSize: '13px' }}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
          
          {/* Linha de Totais */}
          {(() => {
            const monthlyHours: Record<string, number> = {};
            const monthlyTargets: Record<string, number> = {};
            let totalScore = 0;

            // Somar todas as horas registradas e calcular totais
            weights.forEach(weight => {
              if (weight.hidden) return;
              monthlyHours[weight.name] = 0;
              
              // Calcular total de horas registradas
              monthlyData.entries.forEach((entry: any) => {
                if (entry.activities[weight.name]) {
                  monthlyHours[weight.name] += entry.activities[weight.name];
                }
              });
              
              // Calcular total de horas alvo (targetsByDay * dias)
              const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
              let targetSum = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                const dow = new Date(year, month - 1, d).getDay();
                const dayKey = dayNames[dow];
                const plannedForDay = weight.targetsByDay && weight.targetsByDay[dayKey] !== undefined
                  ? weight.targetsByDay[dayKey]
                  : (weight.target || 0);
                targetSum += plannedForDay;
              }
              monthlyTargets[weight.name] = targetSum;
            });

            // Calcular pontuação total do mês
            monthlyData.entries.forEach((entry: any) => {
              const score = calculateDailyScore(entry.activities);
              if (score) totalScore += score;
            });

            return (
              <tr style={{
                borderBottom: '4px solid #1f2937',
                background: '#f3f4f6',
                fontWeight: 'bold'
              }}>
                <td style={{
                  padding: '10px 6px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#1f2937',
                  borderRight: '1px solid #e2e8f0'
                }}>
                  TOTAL
                </td>

                {weights.filter(w => !w.hidden).map(weight => {
                  const total = monthlyHours[weight.name] || 0;
                  const target = monthlyTargets[weight.name] || 0;
                  const progress = target > 0 ? (total / target) * 100 : 0;
                  const progressCapped = Math.min(progress, 100);
                  const timeDisplay = decimalToTimeString(total);
                  const targetDisplay = decimalToTimeString(target);

                  return (
                    <td key={`total-${weight.id || weight.name}`} style={{
                      padding: '6px 3px',
                      textAlign: 'center',
                      background: `${weight.color}20`,
                      borderLeft: `3px solid ${weight.color}`,
                      borderRight: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: weight.color
                          }}>
                            {timeDisplay}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            / {targetDisplay}
                          </span>
                        </div>

                        {target > 0 && (
                          <div style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${progressCapped}%`,
                                height: '100%',
                                background: progressCapped >= 100 ? '#10b981' : progressCapped >= 50 ? '#f59e0b' : '#ef4444',
                                transition: 'width 0.2s ease'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td style={{
                  padding: '10px 6px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  background: '#ecfdf5',
                  borderLeft: '3px solid #10b981',
                  borderRight: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: totalScore >= daysInMonth * 1000 ? '#047857' : '#d97706'
                  }}>
                    {totalScore.toLocaleString('pt-BR')}
                  </div>
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
      
      <div style={{
        padding: '12px 15px',
        background: '#f9fafb',
        borderTop: '2px solid #d1d5db',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        📊 {daysInMonth} dias • 📁 {monthlyData.entries.length} preenchido(s)
      </div>
      </div>
    </div>
  );
};