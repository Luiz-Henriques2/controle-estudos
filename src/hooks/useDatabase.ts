import { useEffect, useState } from 'react';
import { db } from '../core/data/database';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        // Fecha conexão existente se houver
        if (db.isOpen()) {
          db.close();
        }
        
        // Abre nova conexão
        await db.open();
        setIsReady(true);
        setError(null);
        console.log('✅ Database initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        setError('Erro ao inicializar o banco de dados');
      }
    };

    initDB();

    return () => {
      // Não fechar automaticamente para manter dados
      // db.close();
    };
  }, []);

  return { 
    isReady, 
    error,
    db 
  };
}