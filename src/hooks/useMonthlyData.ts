import { useState, useEffect, useCallback } from 'react';
import { db } from '../core/data/database';

export function useMonthlyData(year: number, month: number) {
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log(`📊 useMonthlyData: Iniciando para ${month}/${year}`);
    loadData();
  }, [year, month]);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Carregando dados...');
      
      // 1. Buscar dados do mês
      const monthly = await db.getMonthlyData(year, month);
      console.log(`📅 Mês carregado: ${monthly.entries.length} entradas`);
      
      // 2. Buscar pesos
      const allWeights = await db.getWeights();
      console.log(`⚖️ Pesos carregados: ${allWeights.length}`);
      
      // 3. Atualizar estado
      setMonthlyData(monthly);
      setWeights(allWeights.sort((a, b) => (a.order || 0) - (b.order || 0)));
      
      console.log('✅ Dados carregados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente recarregar a página.');
      
      // Criar dados vazios em caso de erro
      setMonthlyData({
        id: `${year}-${month.toString().padStart(2, '0')}`,
        year,
        month,
        entries: [],
        objectiveId: '1',
        metaHours: 100,
        metaPoints: 10000,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setWeights([]);
    } finally {
      setLoading(false);
    }
  };
  
  const updateDailyEntry = useCallback(async (
    day: number,
    updates: {
      activityName?: string;
      activityValue?: number;
      targetName?: string;
      targetValue?: number;
      wakeUpTime?: number;
      sleepTime?: number;
      bonus?: number;
    }
  ) => {
    if (!monthlyData) return;
    
    console.log(`📝 Atualizando dia ${day}...`);
    
    const entryId = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Encontrar ou criar entrada
    let entryIndex = monthlyData.entries.findIndex((e: any) => {
      if (!e.date) return false;
      return e.date.getDate() === day;
    });
    
    let entry;
    if (entryIndex === -1) {
      // Criar nova entrada
      entry = {
        id: entryId,
        date: new Date(year, month - 1, day),
        activities: {},
        updatedAt: new Date()
      };
      monthlyData.entries.push(entry);
      entryIndex = monthlyData.entries.length - 1;
    } else {
      entry = monthlyData.entries[entryIndex];
    }
    
    // Atualizar entrada
    const updatedEntry = {
      ...entry,
      updatedAt: new Date()
    };
    
    if (updates.activityName !== undefined && updates.activityValue !== undefined) {
      updatedEntry.activities = {
        ...updatedEntry.activities,
        [updates.activityName]: updates.activityValue
      };
    }
    
    if (updates.targetName !== undefined && updates.targetValue !== undefined) {
      updatedEntry.targets = {
        ...updatedEntry.targets,
        [updates.targetName]: updates.targetValue
      };
    }
    
    if (updates.wakeUpTime !== undefined) {
      updatedEntry.wakeUpTime = updates.wakeUpTime;
    }
    
    if (updates.sleepTime !== undefined) {
      updatedEntry.sleepTime = updates.sleepTime;
    }
    
    if (updates.bonus !== undefined) {
      updatedEntry.bonus = updates.bonus;
    }
    
    // Atualizar estado local
    const updatedEntries = [...monthlyData.entries];
    updatedEntries[entryIndex] = updatedEntry;
    
    const updatedMonthlyData = {
      ...monthlyData,
      entries: updatedEntries,
      updatedAt: new Date()
    };
    
    setMonthlyData(updatedMonthlyData);
    
    // Salvar no banco
    try {
      await db.updateDailyEntry(updatedEntry);
      console.log(`💾 Entrada do dia ${day} salva`);
    } catch (error) {
      console.error(`❌ Erro ao salvar entrada do dia ${day}:`, error);
    }
  }, [monthlyData, year, month]);
  
  return {
    monthlyData,
    weights,
    loading,
    error,
    updateDailyEntry,
    refresh: loadData
  };
}