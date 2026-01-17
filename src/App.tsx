import { useState } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { MonthlyTable } from './components/MonthlyTable/MonthlyTable';
import { CalendarPicker } from './components/UI/CalendarPicker';
import { DateUtils } from './core/utils/date-utils';

function App() {
  const { isReady } = useDatabase();
  const { year: currentYear, month: currentMonth } = DateUtils.getCurrentDate();
  
  const [selectedDate, setSelectedDate] = useState({
    year: currentYear,
    month: currentMonth
  });

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Controle de Estudos
              </h1>
              <p className="text-gray-600 mt-1">
                Sistema offline para acompanhamento diário
              </p>
            </div>
            
            <div className="w-full sm:w-auto">
              <CalendarPicker
                year={selectedDate.year}
                month={selectedDate.month}
                onChange={(year, month) => setSelectedDate({ year, month })}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {DateUtils.getMonthName(selectedDate.month)} {selectedDate.year}
          </h2>
          <p className="text-gray-600">
            Preencha suas horas diárias. Os cálculos são automáticos.
          </p>
        </div>

        <MonthlyTable
          year={selectedDate.year}
          month={selectedDate.month}
        />

        {/* Informações */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Como funciona:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Preencha as horas de cada atividade diariamente</li>
            <li>• A pontuação é calculada automaticamente</li>
            <li>• Dados salvos localmente no seu navegador</li>
            <li>• Funciona 100% offline</li>
            <li>• Atualize a hora de dormir e acordar para cálculos extras</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              Sistema offline • Dados armazenados localmente
            </p>
            <div className="mt-2 sm:mt-0 flex space-x-4">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                onClick={() => {
                  if (confirm('Exportar dados deste mês?')) {
                    console.log('Exportar dados:', selectedDate);
                  }
                }}
              >
                Exportar Dados
              </button>
              <button
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                onClick={() => setSelectedDate({ year: currentYear, month: currentMonth })}
              >
                Voltar para Hoje
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;