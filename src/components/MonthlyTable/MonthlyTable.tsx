import React, { useMemo } from 'react';
import { useMonthlyData } from '../../hooks/useMonthlyData';
import { InputField } from '../UI/InputField';
import { DateUtils } from '../../core/utils/date-utils';

interface MonthlyTableProps {
  year: number;
  month: number;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ year, month }) => {
  const {
    monthlyData,
    weights,
    updateDailyEntry,
    calculateDailyScore,
    loading
  } = useMonthlyData(year, month);
  
  const daysInMonth = useMemo(() => {
    return DateUtils.getDaysInMonth(year, month);
  }, [year, month]);
  
  if (loading || !monthlyData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dia
              </th>
              
              {weights.map(weight => (
                <th 
                  key={weight.id} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ color: weight.color }}
                >
                  {weight.name}
                  <div className="text-xs font-normal">peso: {weight.weight}</div>
                </th>
              ))}
              
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dormir
              </th>
              
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acordar
              </th>
              
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bônus
              </th>
              
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pontuação
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const scoreResult = calculateDailyScore(day);
              const isToday = day === DateUtils.getCurrentDate().day && 
                              month === DateUtils.getCurrentDate().month && 
                              year === DateUtils.getCurrentDate().year;
              
              return (
                <tr 
                  key={day} 
                  className={`hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day}
                      </span>
                      <span className="text-xs text-gray-500">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][
                          new Date(year, month - 1, day).getDay()
                        ]}
                      </span>
                    </div>
                  </td>
                  
                  {weights.map(weight => {
                    const entry = monthlyData.entries.find(e => e.date.getDate() === day);
                    const value = entry?.activities[weight.id] || '';
                    
                    return (
                      <td key={weight.id} className="px-4 py-3 whitespace-nowrap">
                        <InputField
                          value={value}
                          onChange={(newValue) => updateDailyEntry(day, {
                            activityId: weight.id,
                            activityValue: newValue ? parseFloat(newValue) : 0
                          })}
                          placeholder="0.0"
                        />
                      </td>
                    );
                  })}
                  
                  <td className="px-4 py-3 whitespace-nowrap">
                    <InputField
                      value={monthlyData.entries.find(e => e.date.getDate() === day)?.sleepTime || ''}
                      onChange={(newValue) => updateDailyEntry(day, {
                        sleepTime: newValue ? parseFloat(newValue) : undefined
                      })}
                      placeholder="--:--"
                    />
                  </td>
                  
                  <td className="px-4 py-3 whitespace-nowrap">
                    <InputField
                      value={monthlyData.entries.find(e => e.date.getDate() === day)?.wakeUpTime || ''}
                      onChange={(newValue) => updateDailyEntry(day, {
                        wakeUpTime: newValue ? parseFloat(newValue) : undefined
                      })}
                      placeholder="--:--"
                    />
                  </td>
                  
                  <td className="px-4 py-3 whitespace-nowrap">
                    <InputField
                      value={monthlyData.entries.find(e => e.date.getDate() === day)?.bonus || ''}
                      onChange={(newValue) => updateDailyEntry(day, {
                        bonus: newValue ? parseFloat(newValue) : undefined
                      })}
                      placeholder="0.0"
                    />
                  </td>
                  
                  <td className="px-4 py-3 whitespace-nowrap">
                    {scoreResult?.score !== null ? (
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-lg ${
                          scoreResult.score >= 1000 ? 'text-green-600' : 
                          scoreResult.score >= 500 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          {scoreResult.score.toLocaleString('pt-BR')}
                        </span>
                        {scoreResult.breakdown.bonus > 0 && (
                          <span className="text-xs text-purple-600">+{scoreResult.breakdown.bonus * 100} bônus</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};