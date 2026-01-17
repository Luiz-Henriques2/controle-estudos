import { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { MonthlyTable } from './components/MonthlyTable/MonthlyTable';
import { WeightEditor } from './components/WeightEditor/WeightEditor';
import './styles/global.css';

function App() {
  const { isReady, error } = useDatabase();
  const [showWeightEditor, setShowWeightEditor] = useState(false);
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

  // Teste no console
  useEffect(() => {
    if (isReady) {
      console.log('✅ App: Banco está pronto!');
      console.log('📅 Data atual:', currentDate);
    }
  }, [isReady, currentDate]);

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

  if (!isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '20px' }}>Inicializando banco de dados...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#3b82f6' }}>🎯 Controle de Estudos</h1>
      
      {/* Controles do mês */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={handlePreviousMonth}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Anterior
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>
            {monthNames[currentDate.month - 1]} {currentDate.year}
          </h2>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {currentDate.month.toString().padStart(2, '0')}/{currentDate.year}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleNextMonth}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Próximo →
          </button>
          <button
            onClick={() => setShowWeightEditor(true)}
            style={{
              padding: '10px 20px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ⚙️ Atividades
          </button>
        </div>
      </div>

      {/* Editor de Pesos */}
      {showWeightEditor && (
        <div style={{
          marginBottom: '20px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '20px'
        }}>
          <WeightEditor onClose={() => setShowWeightEditor(false)} />
        </div>
      )}

      {/* Tabela */}
      <MonthlyTable
        year={currentDate.year}
        month={currentDate.month}
      />

      {/* Botões de debug */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#e6f7ff',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <button
          onClick={() => {
            // Limpar banco
            indexedDB.deleteDatabase('StudyControlDB');
            alert('Banco deletado! Recarregando...');
            setTimeout(() => window.location.reload(), 1000);
          }}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🗑️ Deletar Banco
        </button>
        
        <button
          onClick={() => {
            console.log('Banco:', (window as any).studyDB);
            console.log('Data atual:', currentDate);
            alert('Verifique o console (F12)');
          }}
          style={{
            padding: '10px 20px',
            background: '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔍 Debug
        </button>
      </div>
    </div>
  );
}

export default App;