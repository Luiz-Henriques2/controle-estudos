import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../core/data/database';

interface MonthlyHistoryModalProps {
  weights: any[];
  onClose: () => void;
}

// Interface para o detalhe de cada atividade dentro do mês
interface ActivitySummary {
  name: string;
  color: string;
  hours: number;
  target: number; // Meta específica daquele mês para essa atividade
  percentage: number;
}

interface MonthSummary {
  id: string;
  label: string;
  year: number;
  month: number;
  totalHours: number;
  totalXP: number;
  percentage: number;
  daysCount: number;
  entriesCount: number;
  activities: ActivitySummary[]; // <--- Adicionado aqui
}

export const MonthlyHistoryModal: React.FC<MonthlyHistoryModalProps> = ({ weights, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        const allData = await db.getAllHistory();
        setHistory(allData);
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Processar dados
  const { monthlyStats, grandTotals } = useMemo(() => {
    if (!history.length) return { monthlyStats: [], grandTotals: null };

    const activeWeights = weights.filter(w => !w.hidden);
    const summaries: MonthSummary[] = [];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    // Totais Globais
    let globalHours = 0;
    let globalXP = 0;
    let globalPctSum = 0;

    history.forEach(monthData => {
      const { year, month } = monthData;

      // Filtro de data futura
      if (year > currentYear || (year === currentYear && month > currentMonth)) {
        return;
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      
      // --- CÁLCULO DE METAS ESPECÍFICAS DESTE MÊS ---
      // Precisamos saber quantas segundas, terças, etc, teve neste mês 
      // para calcular a meta exata de cada atividade.
      const activityTargets: Record<string, number> = {};
      let monthlyTotalTarget = 0;
      let monthlyWeightedSum = 0;

      // Inicializa contadores
      activeWeights.forEach(w => activityTargets[w.name] = 0);

      for (let d = 1; d <= daysInMonth; d++) {
         const dow = new Date(year, month - 1, d).getDay();
         const key = dayNames[dow];
         
         activeWeights.forEach(w => {
            const t = w.targetsByDay?.[key] ?? w.target ?? 0;
            // Soma na meta da atividade
            activityTargets[w.name] += t;
            // Soma na meta geral
            monthlyTotalTarget += t;
            monthlyWeightedSum += t * (w.importance || 3);
         });
      }
      
      const factor = monthlyWeightedSum === 0 ? 0 : (daysInMonth * 1000) / monthlyWeightedSum;

      // --- SOMAR REALIZADO ---
      let totalHours = 0;
      let totalXP = 0;
      const activityHours: Record<string, number> = {};
      activeWeights.forEach(w => activityHours[w.name] = 0);

      if (monthData.entries) {
        monthData.entries.forEach((entry: any) => {
          if (entry.activities) {
            Object.entries(entry.activities).forEach(([name, val]: [string, any]) => {
              const numVal = Number(val);
              const weight = weights.find(w => w.name === name);
              
              if (weight && !weight.hidden && numVal > 0) {
                totalHours += numVal;
                totalXP += factor * numVal * (weight.importance || 3);
                
                if (activityHours[name] !== undefined) {
                  activityHours[name] += numVal;
                }
              }
            });
          }
        });
      }

      // Montar array de detalhes das atividades
      const activitiesSummary: ActivitySummary[] = activeWeights.map(w => {
        const actual = activityHours[w.name];
        const target = activityTargets[w.name];
        const pct = target > 0 ? (actual / target) * 100 : 0;
        
        return {
          name: w.name,
          color: w.color,
          hours: actual,
          target: target,
          percentage: Math.min(pct, 100)
        };
      }).sort((a, b) => b.hours - a.hours); // Ordenar por quem teve mais horas

      const percentage = monthlyTotalTarget > 0 ? (totalHours / monthlyTotalTarget) * 100 : 0;
      const finalPct = Math.min(percentage, 100);

      globalHours += totalHours;
      globalXP += totalXP;
      globalPctSum += finalPct;

      summaries.push({
        id: monthData.id,
        label: `${monthNames[month - 1]} ${year}`,
        year,
        month,
        totalHours,
        totalXP: Math.round(totalXP),
        percentage: finalPct,
        daysCount: daysInMonth,
        entriesCount: monthData.entries.length,
        activities: activitiesSummary // Salva o detalhe
      });
    });

    const sorted = summaries.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return {
      monthlyStats: sorted,
      grandTotals: sorted.length > 0 ? {
        hours: globalHours,
        xp: Math.round(globalXP),
        avgPercentage: Math.round(globalPctSum / sorted.length)
      } : null
    };

  }, [history, weights]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      
      <div 
        style={{
          background: '#f8fafc',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '650px', // Um pouco mais largo para caber os detalhes
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideUp 0.3s ease-out',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div style={{ 
          padding: '20px 24px', 
          background: 'white', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
              Histórico Mensal Detalhado
            </h2>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%',
            fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>
        </div>

        {/* Resumo Global Fixo */}
        {grandTotals && (
          <div style={{
            padding: '16px 24px',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '12px'
          }}>
            <div style={{ flex: 1, background: '#3b82f6', borderRadius: '12px', padding: '12px', color: 'white' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.9 }}>Total Horas</div>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{grandTotals.hours.toFixed(1)}h</div>
            </div>
            <div style={{ flex: 1, background: '#8b5cf6', borderRadius: '12px', padding: '12px', color: 'white' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.9 }}>Total XP</div>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{grandTotals.xp.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, background: '#10b981', borderRadius: '12px', padding: '12px', color: 'white' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.9 }}>Média Obj.</div>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{grandTotals.avgPercentage}%</div>
            </div>
          </div>
        )}

        {/* Lista de Meses */}
        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
          ) : monthlyStats.map((stat) => (
            <div key={stat.id} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
            }}>
              {/* Topo do Card: Título e Totais Gerais do Mês */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  {stat.label}
                </span>
                <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                   <span style={{ fontWeight: '600', color: '#64748b' }}>{stat.totalHours.toFixed(1)}h Totais</span>
                   <span style={{ fontWeight: '700', color: '#8b5cf6', background: '#f3e8ff', padding: '2px 8px', borderRadius: '10px' }}>
                     {stat.totalXP.toLocaleString()} XP
                   </span>
                </div>
              </div>

              {/* Lista Detalhada das Atividades (O Progresso de cada coluna) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stat.activities.map((act) => (
                  <div key={act.name}>
                    {/* Linha de Info: Nome e Valores */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.color }} />
                        <span style={{ fontWeight: '600', color: '#475569' }}>{act.name}</span>
                      </div>
                      <div style={{ color: '#64748b' }}>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{act.hours.toFixed(1)}h</span>
                        <span style={{ opacity: 0.6 }}> / {act.target.toFixed(1)}h</span>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso da Atividade */}
                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${act.percentage}%`, 
                        height: '100%', 
                        background: act.color,
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Divisor */}
              <div style={{ height: '1px', background: '#f1f5f9', margin: '16px 0' }} />

              {/* Barra de Progresso Geral do Mês (Resumo) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Objetivo Geral</span>
                <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${stat.percentage}%`, 
                    height: '100%', 
                    background: stat.percentage >= 80 ? '#10b981' : stat.percentage >= 50 ? '#f59e0b' : '#ef4444'
                  }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>
                  {stat.percentage.toFixed(0)}%
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};