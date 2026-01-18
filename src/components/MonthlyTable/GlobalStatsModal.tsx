import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../core/data/database';


interface GlobalStatsModalProps {
  weights: any[]; // As atividades/pesos atuais
  onClose: () => void;
}

export const GlobalStatsModal: React.FC<GlobalStatsModalProps> = ({ weights, onClose }) => {
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

  // Calcular Estatísticas
  const stats = useMemo(() => {
    if (!history.length) return null;

    let totalHours = 0;
    let totalXP = 0;
    let totalTargetHours = 0; // Para calcular a %
    
    // Breakdown por atividade
    const activityStats: Record<string, { hours: number, xp: number, count: number }> = {};
    const activeWeights = weights.filter(w => !w.hidden);

    // Inicializar breakdown
    activeWeights.forEach(w => {
      activityStats[w.name] = { hours: 0, xp: 0, count: 0 };
    });

    history.forEach(monthData => {
      // 1. Calcular fator F deste mês específico (recalculado para precisão histórica)
      const year = monthData.year;
      const month = monthData.month;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      let monthlyTargetSum = 0;
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      
      // Calcular meta teórica deste mês (baseado nos pesos atuais)
      for (let d = 1; d <= daysInMonth; d++) {
         const dow = new Date(year, month - 1, d).getDay();
         const key = dayNames[dow];
         activeWeights.forEach(w => {
            const t = w.targetsByDay?.[key] ?? w.target ?? 0;
            monthlyTargetSum += t * (w.importance || 3);
            totalTargetHours += t; // Acumula meta global em horas
         });
      }
      
      const factor = monthlyTargetSum === 0 ? 0 : (daysInMonth * 1000) / monthlyTargetSum;

      // 2. Somar Realizado
      if (monthData.entries) {
        monthData.entries.forEach((entry: any) => {
          if (entry.activities) {
            Object.entries(entry.activities).forEach(([name, val]: [string, any]) => {
              const numVal = Number(val);
              const weight = weights.find(w => w.name === name);
              
              if (weight && !weight.hidden && numVal > 0) {
                // Totais Gerais
                totalHours += numVal;
                const xp = factor * numVal * (weight.importance || 3);
                totalXP += xp;

                // Breakdown
                if (activityStats[name]) {
                  activityStats[name].hours += numVal;
                  activityStats[name].xp += xp;
                  activityStats[name].count += 1;
                }
              }
            });
          }
        });
      }
    });

    const percentage = totalTargetHours > 0 ? (totalHours / totalTargetHours) * 100 : 0;

    return {
      totalHours,
      totalXP: Math.round(totalXP),
      percentage: Math.min(percentage, 100),
      totalMonths: history.length,
      activityStats
    };
  }, [history, weights]);

  // Componente de Card
  const StatCard = ({ title, value, subtext, color, icon }: any) => (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: 1,
      minWidth: '200px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
        <span>{icon}</span>
        {title}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 800, color: color }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
        {subtext}
      </div>
    </div>
  );

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
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>
              Estatísticas Globais
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
              Resumo de todo o tempo ({stats?.totalMonths || 0} meses registrados)
            </p>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#e2e8f0', width: '36px', height: '36px', borderRadius: '50%',
            fontSize: '18px', cursor: 'pointer', color: '#475569'
          }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Calculando histórico...</div>
        ) : stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* CARDS PRINCIPAIS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <StatCard 
                icon="⚡"
                title="Total XP" 
                value={stats.totalXP.toLocaleString('pt-BR')} 
                subtext="Pontos acumulados"
                color="#8b5cf6" // Roxo
              />
              <StatCard 
                icon="⏱️"
                title="Horas Totais" 
                value={`${stats.totalHours.toFixed(1)}h`} 
                subtext="Tempo investido"
                color="#3b82f6" // Azul
              />
              <StatCard 
                icon="🎯"
                title="Consistência" 
                value={`${stats.percentage.toFixed(1)}%`} 
                subtext="Do objetivo total cumprido"
                color={stats.percentage > 80 ? '#10b981' : stats.percentage > 50 ? '#f59e0b' : '#ef4444'}
              />
            </div>

            {/* BREAKDOWN POR ATIVIDADE */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#334155' }}>Detalhamento por Atividade</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(stats.activityStats)
                  .sort(([, a], [, b]) => b.hours - a.hours)
                  .map(([name, data]) => {
                    const w = weights.find(w => w.name === name);
                    const percentOfTotal = (data.hours / stats.totalHours) * 100;
                    
                    if (data.hours === 0) return null;

                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: w?.color || '#ccc' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{name}</span>
                            <span style={{ color: '#64748b' }}>{data.hours.toFixed(1)}h ({Math.round(data.xp)} XP)</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentOfTotal}%`, height: '100%', background: w?.color || '#ccc', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        ) : (
          <div>Sem dados históricos.</div>
        )}

      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};