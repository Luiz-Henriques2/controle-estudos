import { DailyEntry, ActivityWeights, DailyScoreResult } from '../models/types';

export class DailyScoreCalculator {
  static calculate(
    entry: DailyEntry,
    weights: ActivityWeights[],
    objectiveWeights: Record<string, number>
  ): DailyScoreResult {
    // Verifica se há dados base
    const hasBaseData = this.hasBaseData(entry, weights);
    if (!hasBaseData) {
      return {
        score: null,
        breakdown: {
          activityScores: {},
          wakeUpAdjustment: 0,
          bonus: 0,
          totalBeforeScale: 0
        }
      };
    }

    // Calcula soma ponderada das atividades
    const activityScores: Record<string, number> = {};
    let activityTotal = 0;

    weights.forEach(weightConfig => {
      const activityHours = entry.activities[weightConfig.id] || 0;
      const objectiveWeight = objectiveWeights[weightConfig.id] || weightConfig.weight;
      const score = activityHours * objectiveWeight;
      activityScores[weightConfig.id] = score;
      activityTotal += score;
    });

    // Calcula ajuste de hora de acordar
    const wakeUpAdjustment = this.calculateWakeUpAdjustment(
      entry.sleepTime,
      entry.wakeUpTime,
      objectiveWeights.acordar || 0.1
    );

    // Bônus manual
    const bonus = entry.bonus || 0;

    // Soma total antes da multiplicação
    const totalBeforeScale = activityTotal + wakeUpAdjustment + bonus;

    // Multiplicação final por 100
    const finalScore = Math.round(totalBeforeScale * 100);

    return {
      score: finalScore,
      breakdown: {
        activityScores,
        wakeUpAdjustment,
        bonus,
        totalBeforeScale
      }
    };
  }

  private static hasBaseData(entry: DailyEntry, weights: ActivityWeights[]): boolean {
    // Verifica se há pelo menos uma atividade com horas
    const hasActivityHours = weights.some(w => 
      (entry.activities[w.id] || 0) > 0
    );
    
    // Verifica hora de acordar
    const hasWakeUpTime = entry.wakeUpTime != null;
    
    return hasActivityHours || hasWakeUpTime;
  }

  private static calculateWakeUpAdjustment(
    sleepTime?: number,
    wakeUpTime?: number,
    wakeUpWeight: number = 0.1
  ): number {
    if (sleepTime == null || wakeUpTime == null) {
      return 0;
    }
    
    // (hora de dormir - hora de acordar) * peso acordar
    return (sleepTime - wakeUpTime) * wakeUpWeight;
  }
}