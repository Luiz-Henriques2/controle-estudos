import { useEffect, useState } from 'react';
import { db } from '../core/data/database';

export function useDebugData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        console.log('🔍 Carregando dados para debug...');
        
        // Verifica se o banco está aberto
        if (!db.isOpen()) {
          await db.open();
        }
        
        // Obtém todos os dados
        const weights = await db.activityWeights.toArray();
        const objectives = await db.objectives.toArray();
        const monthlyData = await db.monthlyData.toArray();
        
        // Tenta criar um mês para ver se funciona
        const testMonth = await db.getMonthlyData(2026, 1);
        
        setData({
          weights,
          objectives,
          monthlyData,
          testMonth,
          dbState: db.isOpen() ? 'open' : 'closed',
          dbName: db.name,
          dbVersion: db.verno
        });
        
        console.log('✅ Debug data loaded:', {
          weights: weights.length,
          objectives: objectives.length,
          monthlyData: monthlyData.length,
          testMonth: testMonth ? `Criado com ${testMonth.entries.length} dias` : 'null'
        });
        
      } catch (error) {
        console.error('❌ Erro no debug:', error);
        setData({ error: error.message, stack: error.stack });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { data, loading };
}