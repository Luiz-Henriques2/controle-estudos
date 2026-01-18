// hooks/useAdjacentMonthsData.ts
import { useState, useEffect } from 'react';
import { db } from '../core/data/database';

export function useAdjacentMonthsData(year: number, month: number) {
  const [previousMonthData, setPreviousMonthData] = useState<any>(null);
  const [nextMonthData, setNextMonthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAdjacentMonths = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calcular mês anterior
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth < 1) {
          prevMonth = 12;
          prevYear--;
        }

        // Calcular próximo mês
        let nextYear = year;
        let nextMonth = month + 1;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }

        console.log(`📊 useAdjacentMonthsData: Buscando mês anterior ${prevMonth}/${prevYear}`);
        console.log(`📊 useAdjacentMonthsData: Buscando próximo mês ${nextMonth}/${nextYear}`);

        // Buscar dados dos meses adjacentes
        const [prevData, nextData] = await Promise.all([
          db.getMonthlyData(prevYear, prevMonth),
          db.getMonthlyData(nextYear, nextMonth)
        ]);

        console.log(`✅ useAdjacentMonthsData: Dados adjacentes carregados`);
        setPreviousMonthData(prevData);
        setNextMonthData(nextData);
      } catch (error) {
        console.error('❌ Erro ao carregar dados dos meses adjacentes:', error);
        setError('Erro ao carregar dados adjacentes.');
        
        // Em caso de erro, definir como objetos vazios
        // Calcular novamente meses (pode ter sido alterado no catch)
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth < 1) {
          prevMonth = 12;
          prevYear--;
        }
        
        let nextYear = year;
        let nextMonth = month + 1;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }
        
        setPreviousMonthData({
          id: `${prevYear}-${prevMonth.toString().padStart(2, '0')}`,
          year: prevYear,
          month: prevMonth,
          entries: [],
          objectiveId: '1',
          metaHours: 1,
          metaPoints: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setNextMonthData({
          id: `${nextYear}-${nextMonth.toString().padStart(2, '0')}`,
          year: nextYear,
          month: nextMonth,
          entries: [],
          objectiveId: '1',
          metaHours: 1,
          metaPoints: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } finally {
        setLoading(false);
      }
    };

    loadAdjacentMonths();
  }, [year, month]);

  return { previousMonthData, nextMonthData, loading, error };
}