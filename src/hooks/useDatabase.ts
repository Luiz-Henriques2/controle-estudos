import { useEffect, useState } from 'react';
import { db } from '../core/data/database';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const initDB = async () => {
      console.log('🚀 Iniciando inicialização do banco...');
      
      try {
        // PASSO 1: Fechar conexão existente se houver
        if (db.isOpen()) {
          console.log('🔒 Fechando conexão existente...');
          db.close();
        }
        
        // PASSO 2: Abrir nova conexão
        console.log('🔓 Abrindo conexão com banco...');
        await db.open();
        
        // PASSO 3: Inicializar (isso chama populate se necessário)
        await db.initialize();
        
        // PASSO 4: Buscar informações de debug
        const info = await db.debugInfo();
        setDebugInfo(info);
        
        // PASSO 5: Marcar como pronto
        setIsReady(true);
        setError(null);
        
        console.log('🎉 Banco de dados PRONTO!', {
          pesos: info?.weightsCount,
          objetivos: info?.objectivesCount,
          meses: info?.monthlyDataCount
        });
        
      } catch (error) {
        console.error('💥 ERRO CRÍTICO ao inicializar banco:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        setIsReady(false);
      }
    };

    initDB();

    return () => {
      // Não fechar automaticamente
    };
  }, []);

  return { 
    isReady, 
    error,
    debugInfo,
    db 
  };
}