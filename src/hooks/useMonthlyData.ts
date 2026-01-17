import { useState, useEffect, useCallback } from 'react';
import { MonthlyData, ActivityWeights, Objective } from '../core/models/types';
import { db } from '../core/data/database';
import { DailyScoreCalculator } from '../core/calculations/daily-score';

export function useMonthlyData(year: number, month: number) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [weights, setWeights] = useState<ActivityWeights[]>([]);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [year, month]);
  
  const loadData = async () => {
    setLoading(true);
    
    try {
      const monthly = await db.getMonthlyData(year, month);
      const allWeights = await db.activityWeights.toArray();
      const activeObjective = await db.objectives
        .where('isActive')
        .equals(true)
        .first();
      
      setMonthlyData(monthly);
      setWeights(allWeights.sort((a, b) => a.order - b.order));
      setObjective(activeObjective || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateDailyEntry = useCallback(async (
    day: number,
    updates: {
      activityId?: string;
      activityValue?: number;
      wakeUpTime?: number;
      sleepTime?: number;
      bonus?: number;
    }
  ) => {
    if (!monthlyData) return;
    
    const entryId = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const entryIndex = monthlyData.entries.findIndex(e => e.date.getDate() === day);
    
    if (entryIndex === -1) return;
    
    const entry = monthlyData.entries[entryIndex];
    const updatedEntry = {
      ...entry,
      updatedAt: new Date()
    };
    
    // Atualiza atividade específica
    if (updates.activityId !== undefined && updates.activityValue !== undefined) {
      updatedEntry.activities = {
        ...updatedEntry.activities,
        [updates.activityId]: updates.activityValue
      };
    }
    
    // Atualiza outros campos
    if (updates.wakeUpTime !== undefined) {
      updatedEntry.wakeUpTime = updates.wakeUpTime;
    }
    
    if (updates.sleepTime !== undefined) {
      updatedEntry.sleepTime = updates.sleepTime;
    }
    
    if (updates.bonus !== undefined) {
      updatedEntry.bonus = updates.bonus;
    }
    
    // Atualiza localmente
    const updatedEntries = [...monthlyData.entries];
    updatedEntries[entryIndex] = updatedEntry;
    
    setMonthlyData({
      ...monthlyData,
      entries: updatedEntries
    });
    
    // Persiste no banco
    await db.updateDailyEntry(updatedEntry);
  }, [monthlyData, year, month]);
  
  const calculateDailyScore = useCallback((day: number) => {
    if (!monthlyData || !objective || weights.length === 0) {
      return null;
    }
    
    const entry = monthlyData.entries.find(
      e => e.date.getDate() === day
    );
    
    if (!entry) return null;
    
    return DailyScoreCalculator.calculate(
      entry,
      weights,
      objective.weights
    );
  }, [monthlyData, objective, weights]);
  
  return {
    monthlyData,
    weights,
    objective,
    loading,
    updateDailyEntry,
    calculateDailyScore,
    refresh: loadData
  };
}