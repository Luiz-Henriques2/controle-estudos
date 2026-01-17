import { DailyEntry, MonthlyStats, ActivityWeights } from '../models/types';
import { DailyScoreCalculator } from './daily-score';

export class MonthlyStatsCalculator {
  static calculate(
    entries: DailyEntry[],
    weights: ActivityWeights[],
    objectiveWeights: Record<string, number>,
    metaHours: number,
    metaPoints: number
  ): MonthlyStats {
    // Ordena por data
    const sortedEntries = [...entries].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // 1. Soma de horas estudadas (=SOMA(N131:N161))
    const totalHours = this.calculateTotalHours(sortedEntries, weights);
    
    // 2. Calcula todas as pontuações diárias
    const dailyScores = sortedEntries.map(entry => 
      DailyScoreCalculator.calculate(entry, weights, objectiveWeights)
    );
    
    // 3. Pontuação total mensal (=SOMA(U131:U161))
    const totalPoints = dailyScores.reduce((sum, result) => 
      sum + (result.score || 0), 0
    );
    
    // 4. Dias com dados
    const daysWithData = dailyScores.filter(d => d.score != null).length;
    
    // 5. Média diária de pontos (=MÉDIA(U131:U161))
    const dailyAveragePoints = daysWithData > 0 ? totalPoints / daysWithData : 0;
    
    // 6. Percentual de objetivo (=N162/M162)
    const objectivePercentage = metaHours > 0 ? totalHours / metaHours : 0;
    
    // 7. Percentual de pontuação (=U162/V162)
    const pointsPercentage = metaPoints > 0 ? totalPoints / metaPoints : 0;
    
    // 8. Falta para completar (=SE(V162>U162;U162-V162;"Completo"))
    const remainingToComplete = metaPoints > totalPoints 
      ? Math.round(metaPoints - totalPoints)
      : 'Completo';
    
    // 9. Sequências (dias consecutivos estudando)
    const sequences = this.calculateSequences(sortedEntries, weights);
    
    // 10. Fórmula de acordar (=((9-T162)/2)*(S162/S163))
    const wakeUpFormulaResult = this.calculateWakeUpFormula(sortedEntries);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalPoints,
      dailyAveragePoints: Math.round(dailyAveragePoints * 10) / 10,
      objectivePercentage: Math.round(objectivePercentage * 100) / 100,
      pointsPercentage: Math.round(pointsPercentage * 100) / 100,
      currentStreak: sequences.currentStreak,
      longestStreak: sequences.longestStreak,
      remainingToComplete,
      wakeUpFormulaResult: Math.round(wakeUpFormulaResult * 100) / 100,
      daysWithData
    };
  }
  
  private static calculateTotalHours(
    entries: DailyEntry[],
    weights: ActivityWeights[]
  ): number {
    return entries.reduce((total, entry) => {
      const dayHours = weights.reduce((sum, weight) => {
        return sum + (entry.activities[weight.id] || 0);
      }, 0);
      return total + dayHours;
    }, 0);
  }
  
  private static calculateSequences(
    entries: DailyEntry[],
    weights: ActivityWeights[]
  ): { currentStreak: number; longestStreak: number } {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const entry of entries) {
      const hasStudyHours = weights.some(w => 
        (entry.activities[w.id] || 0) > 0
      );
      
      if (hasStudyHours) {
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  }
  
  private static calculateWakeUpFormula(entries: DailyEntry[]): number {
    const validEntries = entries.filter(e => e.wakeUpTime != null);
    
    if (validEntries.length === 0) {
      return 0;
    }
    
    // T162: média de horas de acordar
    const averageWakeUp = validEntries.reduce((sum, e) => 
      sum + (e.wakeUpTime || 0), 0
    ) / validEntries.length;
    
    // S162: soma de horas de dormir
    const totalSleep = validEntries.reduce((sum, e) => 
      sum + (e.sleepTime || 0), 0
    );
    
    // S163: soma de horas de acordar
    const totalWakeUp = validEntries.reduce((sum, e) => 
      sum + (e.wakeUpTime || 0), 0
    );
    
    // ((9 - T162) / 2) * (S162 / S163)
    if (totalWakeUp === 0) return 0;
    
    return ((9 - averageWakeUp) / 2) * (totalSleep / totalWakeUp);
  }
}