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
    // Soma de horas estudadas (equivalente a =SOMA(N131:N161))
    const totalHours = this.calculateTotalHours(entries, weights);
    
    // Calcula todas as pontuações diárias
    const dailyScores = entries.map(entry => 
      DailyScoreCalculator.calculate(entry, weights, objectiveWeights)
    );
    
    // Pontuação total mensal (=SOMA(U131:U161))
    const totalPoints = dailyScores.reduce((sum, result) => 
      sum + (result.score || 0), 0
    );
    
    // Média diária de pontos (=MÉDIA(U131:U161))
    const daysWithScore = dailyScores.filter(d => d.score != null).length;
    const dailyAveragePoints = daysWithScore > 0 ? totalPoints / daysWithScore : 0;
    
    // Percentual de objetivo (=N162/M162)
    const objectivePercentage = metaHours > 0 ? totalHours / metaHours : 0;
    
    // Percentual de pontuação (=U162/V162)
    const pointsPercentage = metaPoints > 0 ? totalPoints / metaPoints : 0;
    
    // Falta para completar (=SE(V162>U162;U162-V162;"Completo"))
    const remainingToComplete = metaPoints > totalPoints 
      ? metaPoints - totalPoints 
      : 'Completo';
    
    // Sequências
    const sequences = this.calculateSequences(entries, weights);
    
    // Fórmula de acordar (=((9-T162)/2)*(S162/S163))
    const wakeUpFormulaResult = this.calculateWakeUpFormula(entries);
    
    return {
      totalHours,
      totalPoints,
      dailyAveragePoints,
      objectivePercentage,
      pointsPercentage,
      currentStreak: sequences.currentStreak,
      longestStreak: sequences.longestStreak,
      remainingToComplete,
      wakeUpFormulaResult
    };
  }
  
  private static calculateTotalHours(
    entries: DailyEntry[],
    weights: ActivityWeights[]
  ): number {
    return entries.reduce((total, entry) => {
      return total + weights.reduce((sum, weight) => {
        return sum + (entry.activities[weight.id] || 0);
      }, 0);
    }, 0);
  }
  
  private static calculateSequences(
    entries: DailyEntry[],
    weights: ActivityWeights[]
  ): { currentStreak: number; longestStreak: number } {
    // Ordena por data
    const sortedEntries = [...entries].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const entry of sortedEntries) {
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