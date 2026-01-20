import { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { MonthlyTable } from './components/MonthlyTable/MonthlyTable';
import { WeightEditor } from './components/WeightEditor/WeightEditor';
import './styles/global.css';

function App() {
  const { isReady, error } = useDatabase();
  const [showWeightEditor, setShowWeightEditor] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  
  // ESTADO PARA CONTROLAR QUANDO MOSTRAR A TABELA
  const [showTable, setShowTable] = useState(false);

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // FUNÇÃO PARA FECHAR E ATUALIZAR
  const handleCloseEditor = () => {
    setShowWeightEditor(false);
    setListVersion(prev => prev + 1);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  useEffect(() => {
    if (isReady) {
      console.log('✅ App: Banco está pronto!');
      
      // **ESPERA 600ms** para garantir TUDO está carregado
      // Inclui banco de dados, hooks internos, etc.
      const timer = setTimeout(() => {
        console.log('🎯 App: Mostrando tabela...');
        setShowTable(true);
      }, 600); // Aumentei para 600ms para ser mais seguro
      
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545' }}>❌ Erro</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Recarregar
        </button>
      </div>
    );
  }

  // Loading inicial
  if (!isReady || !showTable) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        background: '#f8f9fa'
      }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '16px',
          color: '#64748b',
          fontWeight: '500'
        }}>
          {!isReady ? 'Inicializando banco de dados...' : 'Preparando visualização...'}
        </p>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      background: '#f8f9fa', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Modal de Atividades */}
      {showWeightEditor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)',
            padding: '30px',
            maxWidth: '1000px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseEditor}
              style={{
                position: 'absolute',
                top: '30px',
                right: '40px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                opacity: 0.6,
                transition: 'opacity 0.2s',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              title="Fechar e atualizar"
            >
              ✕
            </button>
            <WeightEditor onClose={handleCloseEditor} />
          </div>
        </div>
      )}

      {/* Tabela - AGORA com uma chave única que força recriação completa */}
      <MonthlyTable
        key={`${currentDate.year}-${currentDate.month}-${listVersion}-${Date.now()}`}
        year={currentDate.year}
        month={currentDate.month}
        currentMonth={currentDate}
        monthNames={monthNames}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        showWeightEditor={showWeightEditor}
        onToggleWeightEditor={() => {
          if (showWeightEditor) handleCloseEditor();
          else setShowWeightEditor(true);
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default App;