// hooks/useActivityStreaks.ts
import { useState, useEffect } from 'react';
import { db } from '../core/data/database';

export function useActivityStreaks(year: number, month: number, weights: any[]) {
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const calculateAll = async () => {
      // Só calcula se houver atividades visíveis
      const activeWeights = weights.filter(w => !w.hidden);
      if (activeWeights.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const newStreaks: Record<string, number> = {};
      const today = new Date();

      // Executa em paralelo para todas as atividades
      await Promise.all(
        activeWeights.map(async (weight) => {
          // A função que criamos no passo 1
          const count = await db.calculateCurrentStreak(weight.name, today);
          newStreaks[weight.name] = count;
        })
      );

      if (isMounted) {
        setStreaks(newStreaks);
        setLoading(false);
      }
    };

    calculateAll();

    return () => { isMounted = false; };
  }, [weights, year, month]); // Recalcula se as atividades mudarem ou se mudar a view (opcional, já que streak é baseada em "hoje")

  return { streaks, loading };
}