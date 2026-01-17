import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMonthlyData } from '../../hooks/useMonthlyData';

interface MonthlyTableProps {
  year: number;
  month: number;
  currentMonth?: { year: number; month: number };
  monthNames?: string[];
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  showWeightEditor?: boolean;
  onToggleWeightEditor?: () => void;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ 
  year, 
  month,
  currentMonth,
  monthNames = [],
  onPreviousMonth,
  onNextMonth,
  showWeightEditor,
  onToggleWeightEditor
}) => {
  const { monthlyData, weights, updateDailyEntry, loading, error } = useMonthlyData(year, month);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  const daysInMonth = new Date(year, month, 0).getDate();
  const DAY_HEIGHT = 143; // Aumentado para acomodar a barra de progresso
  const VISIBLE_DAYS = 4;
  const CONTAINER_HEIGHT = DAY_HEIGHT * VISIBLE_DAYS;
  const PADDING_DAYS = 2;

  // Configurações do efeito 3D
  const MAX_ROTATION = 30;
  const MAX_TRANSLATE_Z = 60;
  const MAX_BLUR = 4;
  const MAX_SCALE = 1.1;
  const MIN_SCALE = 0.85;
  const MAX_OPACITY = 1;
  const MIN_OPACITY = 0.3;

  // Centralizar scroll inicial
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date().getDate();
      const centerScroll = (today - 3) * DAY_HEIGHT + DAY_HEIGHT * PADDING_DAYS;
      const maxScroll = (daysInMonth * DAY_HEIGHT + DAY_HEIGHT * PADDING_DAYS * 2) - CONTAINER_HEIGHT;
      scrollContainerRef.current.scrollTop = Math.max(0, Math.min(centerScroll, maxScroll));
    }
  }, [daysInMonth]);

  // Atualizar posição do scroll
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setScrollPosition(scrollTop);
      
      const startIndex = Math.floor((scrollTop - DAY_HEIGHT * PADDING_DAYS) / DAY_HEIGHT);
      setVisibleRange({
        start: Math.max(0, startIndex - 2),
        end: Math.min(daysInMonth - 1, startIndex + VISIBLE_DAYS + 2)
      });
    }
  }, [daysInMonth]);

  // Calcular transformações 3D para cada dia
  const getDayTransform = (dayIndex: number, scrollTop: number) => {
    const centerPosition = (scrollTop - DAY_HEIGHT * PADDING_DAYS) + CONTAINER_HEIGHT / 2;
    const dayCenter = dayIndex * DAY_HEIGHT + DAY_HEIGHT / 2;
    const distanceFromCenter = (dayCenter - centerPosition) / (CONTAINER_HEIGHT / 2);
    
    // Clamp entre -1 e 1
    const normalizedDistance = Math.max(-1, Math.min(1, distanceFromCenter));
    
    // Efeitos baseados na distância do centro
    const rotation = normalizedDistance * MAX_ROTATION;
    const translateZ = -Math.abs(normalizedDistance) * MAX_TRANSLATE_Z;
    const scale = 1 - Math.abs(normalizedDistance) * 0.15;
    const blur = Math.abs(normalizedDistance) * MAX_BLUR;
    const opacity = 1 - Math.abs(normalizedDistance) * 0.7;
    const brightness = 1 - Math.abs(normalizedDistance) * 0.3;
    
    return {
      transform: `perspective(1200px) rotateX(${rotation}deg) translateZ(${translateZ}px) scale(${scale})`,
      filter: `blur(${blur}px) brightness(${brightness})`,
      opacity: opacity,
      zIndex: Math.round(100 - Math.abs(normalizedDistance) * 50)
    };
  };

  // Verificar se é hoje
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
  };

  // Converter decimal para formato amigável
  const decimalToTimeString = (decimal: number): string => {
    if (!decimal || decimal === 0) return '-';
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  };

  // Converter HH:MM para decimal
  const timeStringToDecimal = (timeStr: string): number => {
    if (!timeStr || timeStr === '00:00' || timeStr === '-') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  };

  // Incrementar tempo
  const incrementTime = (decimal: number, increment: number = 0.5): number => {
    return Math.max(0, decimal + increment);
  };

  // Decrementar tempo
  const decrementTime = (decimal: number, decrement: number = 0.5): number => {
    return Math.max(0, decimal - decrement);
  };

  // Obter alvo do dia para uma atividade específica
  const getDailyTarget = (weight: any, day: number): number => {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const currentDay = dayNames[dayOfWeek];
    
    // Primeiro verifica targetsByDay, depois target padrão
    if (weight.targetsByDay && weight.targetsByDay[currentDay] !== undefined) {
      return weight.targetsByDay[currentDay];
    }
    return weight.target || 0;
  };

  // Calcular fator F para o mês
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

    // Evitar divisão por zero
    if (totalWeightedPlannedHours === 0) return 0;

    return (daysInMonth * 1000) / totalWeightedPlannedHours;
  };

  // Calcular pontuação diária CORRIGIDA
  const calculateDailyScore = (activities: Record<string, number>, day: number): number => {
    const factor = calculateMonthlyFactor();
    if (!factor) return 0;

    let score = 0;

    Object.entries(activities).forEach(([name, hoursRecorded]) => {
      const activity = weights.find(w => w.name === name);
      if (!activity || activity.hidden) return;

      const importance = activity.importance || 3;
      // Pontuação = fator × horas_registradas × importância
      score += factor * hoursRecorded * importance;
    });

    return Math.round(score);
  };

  // Calcular pontuação total do mês
  const calculateMonthlyScore = (): number => {
    if (!monthlyData?.entries) return 0;
    
    let totalScore = 0;
    monthlyData.entries.forEach((entry: any) => {
      const day = entry.date?.getDate();
      if (day && entry.activities) {
        totalScore += calculateDailyScore(entry.activities, day);
      }
    });
    
    return totalScore;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f8fafc'
      }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '12px', color: '#64748b' }}>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        background: '#fee', 
        textAlign: 'center',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <p style={{ color: '#dc2626', fontSize: '16px' }}>⚠️ {error}</p>
        <button onClick={() => window.location.reload()} style={{ 
          padding: '10px 20px', 
          marginTop: '15px', 
          background: '#dc2626', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Recarregar
        </button>
      </div>
    );
  }

  if (!monthlyData || weights.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px', 
        background: 'white',
        color: '#64748b',
        fontSize: '14px'
      }}>
        ⚠️ Nenhum dado disponível para este mês.
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      height: 'calc(100vh - 40px)',
      maxHeight: '800px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* TÍTULO FIXO NO TOPO */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 0 15px 0',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 40px'
        }}>
          {/* Título e Navegação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {onPreviousMonth && (
              <button
                onClick={onPreviousMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                title="Mês anterior"
              >
                ←
              </button>
            )}
            
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                letterSpacing: '-0.025em'
              }}>
                Controle Mensal
              </h1>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                {currentMonth ? `${monthNames[currentMonth.month - 1]} ${currentMonth.year}` : `${month.toString().padStart(2, '0')}/${year}`}
              </p>
            </div>
            
            {onNextMonth && (
              <button
                onClick={onNextMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                title="Próximo mês"
              >
                →
              </button>
            )}
          </div>

          {/* Botão de Atividades à direita */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {onToggleWeightEditor && (
              <button
                onClick={onToggleWeightEditor}
                style={{
                  background: showWeightEditor ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  border: '1px solid',
                  borderColor: showWeightEditor ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: showWeightEditor ? '#7c3aed' : '#64748b',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.color = '#7c3aed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = showWeightEditor ? 'rgba(139, 92, 246, 0.15)' : 'transparent';
                  e.currentTarget.style.color = showWeightEditor ? '#7c3aed' : '#64748b';
                }}
                title="Gerenciar atividades"
              >
                ⚙️
                {showWeightEditor && ' ✓'}
              </button>
            )}

            {/* Legenda de Atividades */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '16px'
            }}>
              {weights.filter(w => !w.hidden).map(weight => (
                <div key={weight.id || weight.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: weight.color,
                    boxShadow: `0 0 0 1px ${weight.color}40`
                  }} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#475569'
                  }}>{weight.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER DE ROLAGEM COM DIAS */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          height: `${CONTAINER_HEIGHT}px`,
          overflowY: 'scroll',
          position: 'relative',
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Linha invisível no topo para permitir rolagem até o primeiro dia */}
        <div style={{
          height: `${DAY_HEIGHT * PADDING_DAYS}px`,
          width: '100%',
        }} />
        
        {/* Container dos dias com altura total para rolagem */}
        <div style={{
          height: `${daysInMonth * DAY_HEIGHT}px`,
          position: 'relative'
        }}>
          {/* Renderizar apenas dias visíveis para performance */}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const isVisible = index >= visibleRange.start && index <= visibleRange.end;
            
            if (!isVisible) return null;
            
            const entry = monthlyData.entries.find((e: any) => {
              if (!e.date) return false;
              return e.date.getDate() === day;
            });
            
            const today = isToday(day);
            const transform = getDayTransform(index, scrollPosition);
            const score = entry ? calculateDailyScore(entry.activities, day) : 0;
            
            return (
              <div
                key={day}
                style={{
                  position: 'absolute',
                  top: `${index * DAY_HEIGHT}px`,
                  left: '40px',
                  right: '40px',
                  height: `${DAY_HEIGHT - 20}px`,
                  background: today 
                    ? 'linear-gradient(135deg, rgba(253, 230, 138, 0.15) 0%, rgba(254, 240, 199, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  border: today 
                    ? '2px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: today 
                    ? '0 8px 20px -5px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                    : '0 4px 12px -2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s ease-out',
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                  ...transform
                }}
              >
                {/* Informações do dia */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  minWidth: '120px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: today ? '32px' : '28px',
                      fontWeight: today ? '700' : '600',
                      color: today ? '#d97706' : '#1e293b',
                      lineHeight: '1',
                      textShadow: today ? '0 1px 2px rgba(251, 191, 36, 0.2)' : 'none'
                    }}>
                      {day}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: today ? '#92400e' : '#64748b',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      marginTop: '4px'
                    }}>
                      {new Date(year, month - 1, day).toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                  </div>
                  
                  <div style={{
                    height: '40px',
                    width: '1px',
                    background: 'linear-gradient(to bottom, transparent, #e2e8f0, transparent)'
                  }} />
                </div>
                
                {/* Atividades */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flex: 1,
                  justifyContent: 'center'
                }}>
                  {weights.filter(w => !w.hidden).map(weight => {
                    const value = entry?.activities[weight.name] || 0;
                    const timeDisplay = decimalToTimeString(value);
                    const dailyTarget = getDailyTarget(weight, day);
                    const targetDisplay = decimalToTimeString(dailyTarget);
                    const progress = dailyTarget > 0 ? (value / dailyTarget) * 100 : 0;
                    const progressCapped = Math.min(progress, 100);
                    
                    return (
                      <div
                        key={weight.id || weight.name}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minWidth: '100px',
                          gap: '8px'
                        }}
                      >
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '2px'
                        }}>
                          {weight.name}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <button
                            onClick={() => {
                              const newValue = decrementTime(value);
                              updateDailyEntry(day, {
                                activityName: weight.name,
                                activityValue: newValue
                              });
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              border: 'none',
                              background: 'rgba(255, 255, 255, 0.7)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: weight.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s',
                              backdropFilter: 'blur(4px)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = weight.color;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                              e.currentTarget.style.color = weight.color;
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            –
                          </button>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
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
                              style={{
                                width: '70px',
                                padding: '6px 8px',
                                border: `1px solid ${weight.color}40`,
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: value > 0 ? weight.color : '#94a3b8',
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(4px)'
                              }}
                              onFocus={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.boxShadow = `0 0 0 3px ${weight.color}20`;
                              }}
                              onBlur={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            {dailyTarget > 0 && (
                              <div style={{
                                fontSize: '10px',
                                color: '#94a3b8',
                                opacity: 0.7,
                                fontWeight: '500'
                              }}>
                                alvo: {targetDisplay}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              const newValue = incrementTime(value);
                              updateDailyEntry(day, {
                                activityName: weight.name,
                                activityValue: newValue
                              });
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              border: 'none',
                              background: 'rgba(255, 255, 255, 0.7)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: weight.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s',
                              backdropFilter: 'blur(4px)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = weight.color;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                              e.currentTarget.style.color = weight.color;
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Barra de progresso do alvo */}
                        {dailyTarget > 0 && (
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(226, 232, 240, 0.5)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            marginTop: '4px',
                            position: 'relative'
                          }}>
                            <div
                              style={{
                                width: `${progressCapped}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${weight.color}60, ${weight.color})`,
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                            {progressCapped >= 100 && (
                              <div style={{
                                position: 'absolute',
                                right: '4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '9px',
                                fontWeight: '600',
                                color: '#059669'
                              }}>
                                ✓
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Pontuação */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '100px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    Pontuação
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: score > 0 ? '#059669' : '#94a3b8',
                    background: score > 0 
                      ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                      : 'rgba(148, 163, 184, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: score > 0 
                      ? '1px solid rgba(5, 150, 105, 0.2)'
                      : '1px solid rgba(148, 163, 184, 0.2)',
                    backdropFilter: 'blur(4px)',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {score > 0 ? score.toLocaleString('pt-BR') : '-'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Linha invisível na base para permitir rolagem até o último dia */}
        <div style={{
          height: `${DAY_HEIGHT * PADDING_DAYS}px`,
          width: '100%',
        }} />
      </div>

      {/* TOTAL FIXO NA BASE */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(to top, #ffffff 0%, #f8fafc 100%)',
        borderTop: '1px solid #e2e8f0',
        padding: '20px 40px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#64748b'
          }}>
            {daysInMonth} dias • {monthlyData.entries.length} registrados
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            {weights.filter(w => !w.hidden).map(weight => {
              const totalHours = monthlyData.entries.reduce((sum: number, entry: any) => {
                return sum + (entry.activities[weight.name] || 0);
              }, 0);
              
              // Calcular total de alvo para o mês
              let totalTarget = 0;
              const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
              for (let d = 1; d <= daysInMonth; d++) {
                const dow = new Date(year, month - 1, d).getDay();
                const dayKey = dayNames[dow];
                const dailyTarget = weight.targetsByDay && weight.targetsByDay[dayKey] !== undefined
                  ? weight.targetsByDay[dayKey]
                  : (weight.target || 0);
                totalTarget += dailyTarget;
              }
              
              const totalProgress = totalTarget > 0 ? (totalHours / totalTarget) * 100 : 0;
              const totalProgressCapped = Math.min(totalProgress, 100);
              
              return (
                <div key={`total-${weight.id || weight.name}`} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '80px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {weight.name}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: weight.color
                  }}>
                    {decimalToTimeString(totalHours)}
                  </div>
                  {totalTarget > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#94a3b8'
                    }}>
                      <span>/ {decimalToTimeString(totalTarget)}</span>
                    </div>
                  )}
                  {totalTarget > 0 && (
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(226, 232, 240, 0.5)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${totalProgressCapped}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${weight.color}60, ${weight.color})`,
                          borderRadius: '2px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            <div style={{
              height: '40px',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, #e2e8f0, transparent)'
            }} />
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total do Mês
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#1e293b',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {calculateMonthlyScore().toLocaleString('pt-BR')}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Meta: {(daysInMonth * 1000).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};