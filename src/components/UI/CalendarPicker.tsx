import React, { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';

interface CalendarPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  year,
  month,
  onChange,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(year, month - 1));

  const handlePrevious = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    onChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleNext = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onChange(today.getFullYear(), today.getMonth() + 1);
  };

  return (
    <div className="flex items-center space-x-4 bg-white p-3 rounded-lg shadow">
      <button
        onClick={handlePrevious}
        className="p-2 hover:bg-gray-100 rounded"
        title="Mês anterior"
      >
        ◀
      </button>
      
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: { code: 'pt-BR' } })}
        </span>
        <span className="text-sm text-gray-500">
          {format(currentDate, 'MM/yyyy')}
        </span>
      </div>
      
      <button
        onClick={handleNext}
        className="p-2 hover:bg-gray-100 rounded"
        title="Próximo mês"
      >
        ▶
      </button>
      
      <button
        onClick={handleToday}
        className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        Hoje
      </button>
    </div>
  );
};