import React, { useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

export const TestTable: React.FC = () => {
  const { isReady, db } = useDatabase();
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  useEffect(() => {
    const checkDatabase = async () => {
      if (isReady) {
        try {
          const weights = await db.activityWeights.toArray();
          const objectives = await db.objectives.toArray();
          const monthlyData = await db.monthlyData.toArray();
          
          setDebugInfo({
            weightsCount: weights.length,
            objectivesCount: objectives.length,
            monthlyDataCount: monthlyData.length,
            weights,
            objectives,
            monthlyData: monthlyData.slice(0, 1) // Primeiro item apenas
          });
        } catch (error) {
          console.error('Erro ao verificar banco:', error);
          setDebugInfo({ error: error.message });
        }
      }
    };

    checkDatabase();
  }, [isReady, db]);

  if (!isReady) {
    return <div>Carregando banco de dados...</div>;
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5' }}>
      <h2>Informações de Debug</h2>
      
      {debugInfo ? (
        <div>
          <h3>Contagens:</h3>
          <ul>
            <li>Pesos: {debugInfo.weightsCount}</li>
            <li>Objetivos: {debugInfo.objectivesCount}</li>
            <li>Meses: {debugInfo.monthlyDataCount}</li>
          </ul>
          
          <h3>Pesos:</h3>
          <pre>{JSON.stringify(debugInfo.weights, null, 2)}</pre>
          
          <h3>Objetivos:</h3>
          <pre>{JSON.stringify(debugInfo.objectives, null, 2)}</pre>
          
          {debugInfo.monthlyDataCount > 0 && (
            <>
              <h3>Dados Mensais (primeiro mês):</h3>
              <pre>{JSON.stringify(debugInfo.monthlyData, null, 2)}</pre>
            </>
          )}
        </div>
      ) : (
        <div>Coletando informações...</div>
      )}
      
      <button 
        onClick={() => window.location.reload()}
        style={{ marginTop: '20px', padding: '10px 20px' }}
      >
        Recarregar Página
      </button>
    </div>
  );
};