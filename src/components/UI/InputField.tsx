import React from 'react';

interface InputFieldProps {
  value: number | string;
  onChange: (value: string) => void;
  type?: 'number' | 'text';
  step?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  value,
  onChange,
  type = 'number',
  step = '0.1',
  placeholder = '',
  className = '',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500 ${
        disabled ? 'bg-gray-100' : ''
      } ${className}`}
    />
  );
};