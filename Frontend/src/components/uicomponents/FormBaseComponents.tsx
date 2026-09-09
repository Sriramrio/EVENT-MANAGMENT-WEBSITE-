import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

// ============================================================================
// 1. BASE INPUT FIELD (Text, Number, Email, PAN, GSTIN, etc.)
// ============================================================================
export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  badge?: React.ReactNode;
  fontMono?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  required = false,
  helperText,
  error,
  badge,
  fontMono = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1 w-full text-left">
      {/* Label and Badge Container */}
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {badge}
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full px-3.5 py-2 text-xs bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 ${
            fontMono ? 'font-mono uppercase' : ''
          } ${
            error
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900'
              : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800'
          } ${className}`}
          {...props}
        />
      </div>

      {/* Helper / Error Text */}
      {error ? (
        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-400 block mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 2. SELECT DROPDOWN COMPONENT
// ============================================================================
export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[] | string[];
  required?: boolean;
  helperText?: string;
  error?: string;
  placeholder?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  options,
  required = false,
  helperText,
  error,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1 w-full text-left">
      <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <select
          id={inputId}
          className={`w-full px-3.5 py-2 pr-8 text-xs bg-white border rounded-lg appearance-none transition-all focus:outline-none focus:ring-2 text-slate-800 ${
            error
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt, index) => {
            if (typeof opt === 'string') {
              return (
                <option key={index} value={opt}>
                  {opt}
                </option>
              );
            }
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        
        {/* Custom Chevron Icon */}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {error ? (
        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-400 block mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 3. TEXTAREA COMPONENT
// ============================================================================
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}

export const TextAreaInput: React.FC<TextAreaProps> = ({
  label,
  required = false,
  helperText,
  error,
  rows = 2,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1 w-full text-left">
      <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <textarea
        id={inputId}
        rows={rows}
        className={`w-full px-3.5 py-2 text-xs bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 resize-none text-slate-800 ${
          error
            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
            : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-400 block mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};