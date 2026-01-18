import React, { useMemo, useState } from 'react';

interface ProgressChartProps {
  year: number;
  month: number;
  data: any[];
  weights: any[];
  daysInMonth: number;
  onClose: () => void;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ 
  year, month, data, weights, daysInMonth, onClose 
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  // Lista de atividades ativas
  const activeWeights = useMemo(() => weights.filter(w => !w.hidden), [weights]);

  // Processamento dos dados
  const chartData = useMemo(() => {
    const points: any[] = [];
    let maxHours = 0;
    let maxScore = 0;

    // Calcular fator F mensal (mesma lógica da tabela)
    const calculateFactor = () => {
       let totalWeighted = 0;
       const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
       for (let d = 1; d <= daysInMonth; d++) {
         const dow = new Date(year, month - 1, d).getDay();
         const key = dayNames[dow];
         activeWeights.forEach(w => {
            const target = w.targetsByDay?.[key] ?? w.target ?? 0;
            totalWeighted += target * (w.importance || 3);
         });
       }
       return totalWeighted === 0 ? 0 : (daysInMonth * 1000) / totalWeighted;
    };
    const factor = calculateFactor();

    for (let d = 1; d <= daysInMonth; d++) {
      const entry = data?.find((e: any) => new Date(e.date).getDate() === d);
      let totalDayHours = 0;
      let totalDayScore = 0;
      const activities: Record<string, number> = {};

      if (entry && entry.activities) {
        activeWeights.forEach(w => {
           const val = Number(entry.activities[w.name] || 0);
           activities[w.name] = val;
           totalDayHours += val;
           totalDayScore += factor * val * (w.importance || 3);
        });
      } else {
        activeWeights.forEach(w => activities[w.name] = 0);
      }

      totalDayScore = Math.round(totalDayScore);
      
      points.push({ 
        day: d, 
        totalHours: totalDayHours, 
        totalScore: totalDayScore,
        activities 
      });
      
      if (totalDayHours > maxHours) maxHours = totalDayHours;
      if (totalDayScore > maxScore) maxScore = totalDayScore;
    }

    // Adiciona margem de 10% no topo para não colar
    return { 
      points, 
      maxHours: Math.max(maxHours * 1.1, 1), 
      maxScore: Math.max(maxScore * 1.1, 100) 
    };
  }, [data, activeWeights, daysInMonth, year, month]);

  // Dimensões
  const width = 900;
  const height = 400;
  const padding = { top: 40, right: 60, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Helpers de Escala
  const getX = (day: number) => padding.left + ((day - 1) / (daysInMonth - 1)) * graphWidth;
  const getYHours = (val: number) => height - padding.bottom - (val / chartData.maxHours) * graphHeight;
  const getYScore = (val: number) => height - padding.bottom - (val / chartData.maxScore) * graphHeight;

  // Gerar linhas SVG
  const generateLinePoints = (getValue: (p: any) => number, getScale: (v: number) => number) => {
    return chartData.points.map(p => `${getX(p.day)},${getScale(getValue(p))}`).join(' ');
  };

  // Linhas principais
  const totalHoursPoints = generateLinePoints(p => p.totalHours, getYHours);
  const totalScorePoints = generateLinePoints(p => p.totalScore, getYScore);

  // Tooltip
  const renderTooltip = () => {
    if (hoveredDay === null) return null;
    const point = chartData.points[hoveredDay - 1];
    if (!point) return null;

    const x = getX(hoveredDay);
    // Posiciona tooltip para não cortar na tela
    const tooltipX = x > width / 2 ? x - 220 : x + 20; 

    // Ordenar atividades por horas para mostrar as principais no topo
    const sortedActivities = activeWeights
      .map(w => ({ ...w, val: point.activities[w.name] || 0 }))
      .sort((a, b) => b.val - a.val);

    return (
      <g style={{ pointerEvents: 'none' }}>
        {/* Linha vertical indicadora */}
        <line 
          x1={x} y1={padding.top} 
          x2={x} y2={height - padding.bottom} 
          stroke="#94a3b8" 
          strokeDasharray="4 4" 
        />
        <circle cx={x} cy={getYHours(point.totalHours)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
        <circle cx={x} cy={getYScore(point.totalScore)} r="4" fill="#10b981" stroke="white" strokeWidth="2" />

        <foreignObject x={tooltipX} y={padding.top} width="200" height="300">
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.98)', 
            padding: '12px', 
            borderRadius: '8px', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            fontFamily: 'sans-serif'
          }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
              <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Dia {point.day}</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{point.totalHours.toFixed(1)}h Total</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{point.totalScore} XP</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sortedActivities.map(act => (
                <div key={act.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: act.val > 0 ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.color }} />
                    <span style={{ color: '#475569' }}>{act.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {act.val > 0 ? `${act.val.toFixed(1)}h` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      
      <div 
        style={{
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1000px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
              Análise de Desempenho
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
              Comparativo de horas e pontuação (Eixos sobrepostos)
            </p>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%',
            fontSize: '20px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}>×</button>
        </div>

        <div style={{ overflowX: 'auto', position: 'relative' }}>
          <svg width={width} height={height} style={{ minWidth: '700px', userSelect: 'none' }}>
            
            {/* Definições de Gradiente e Filtros */}
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* GUIDES / GRID */}
            {/* Linhas horizontais baseadas no eixo de Horas (5 linhas) */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = height - padding.bottom - (tick * graphHeight);
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  {/* Label Eixo Esquerdo (Horas) */}
                  <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                    {(chartData.maxHours * tick).toFixed(1)}h
                  </text>
                  {/* Label Eixo Direito (Pontos) */}
                  <text x={width - padding.right + 10} y={y + 4} textAnchor="start" fontSize="11" fill="#94a3b8">
                    {Math.round(chartData.maxScore * tick)}
                  </text>
                </g>
              );
            })}

            {/* Labels dos Eixos */}
            <text x={padding.left} y={20} fill="#3b82f6" fontWeight="bold" fontSize="12">HORAS (Eixo Esquerdo)</text>
            <text x={width - padding.right} y={20} fill="#10b981" fontWeight="bold" fontSize="12" textAnchor="end">PONTUAÇÃO (Eixo Direito)</text>

            {/* --- GRÁFICOS --- */}

            {/* 1. LINHAS INDIVIDUAIS (BACKGROUND) */}
            {activeWeights.map(w => {
              const points = generateLinePoints(p => p.activities[w.name] || 0, getYHours);
              return (
                <polyline
                  key={w.name}
                  points={points}
                  fill="none"
                  stroke={w.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* 2. TOTAL HORAS (ÁREA) */}
            <polygon 
              points={`${padding.left},${height-padding.bottom} ${totalHoursPoints} ${width-padding.right},${height-padding.bottom}`}
              fill="url(#gradientTotal)"
            />
            <polyline
              points={totalHoursPoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* 3. TOTAL PONTOS (LINHA TRACEJADA TOPO) */}
            <polyline
              points={totalScorePoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Eixo X (Dias) */}
            {chartData.points.map((p, i) => {
               if (i % 2 !== 0 && daysInMonth > 20) return null;
               return (
                 <text key={p.day} x={getX(p.day)} y={height - 15} textAnchor="middle" fontSize="11" fill="#64748b">
                   {p.day}
                 </text>
               );
            })}

            {/* Área de interação (Hover) */}
            {chartData.points.map((p) => (
              <rect
                key={p.day}
                x={getX(p.day) - (graphWidth / daysInMonth / 2)}
                y={padding.top}
                width={graphWidth / daysInMonth}
                height={graphHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredDay(p.day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{ cursor: 'crosshair' }}
              />
            ))}

            {renderTooltip()}
          </svg>
        </div>
        
        {/* LEGENDA */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginTop: '0px', 
          padding: '16px', 
          background: '#f8fafc', 
          borderRadius: '12px' 
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '3px', background: '#3b82f6' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Total Horas</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '3px', borderTop: '2px dashed #10b981' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Total XP</span>
           </div>
           <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 8px' }} />
           {activeWeights.map(w => (
             <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: w.color }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>{w.name}</span>
             </div>
           ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};