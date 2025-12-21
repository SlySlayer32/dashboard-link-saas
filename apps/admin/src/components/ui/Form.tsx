import { UseFormRegister, RegisterOptions } from 'react-hook-form';
import type { ChangeEvent } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: any;
  registration: UseFormRegister<any>;
  validation?: RegisterOptions;
  className?: string;
  helperText?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  registration,
  validation,
  className = '',
  helperText,
  onChange,
  value,
}: FormFieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
        {...registration(name, validation)}
        onChange={onChange}
        value={value}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error.message}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: any;
  registration: UseFormRegister<any>;
  validation?: RegisterOptions;
  className?: string;
  helperText?: string;
  rows?: number;
}

export function FormTextarea({
  label,
  name,
  placeholder,
  required = false,
  disabled = false,
  error,
  registration,
  validation,
  className = '',
  helperText,
  rows = 3,
}: FormTextareaProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
        {...registration(name, validation)}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error.message}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: any;
  registration: UseFormRegister<any>;
  validation?: RegisterOptions;
  className?: string;
  helperText?: string;
}

export function FormSelect({
  label,
  name,
  options,
  placeholder,
  required = false,
  disabled = false,
  error,
  registration,
  validation,
  className = '',
  helperText,
}: FormSelectProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
        {...registration(name, validation)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error.message}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface FormCheckboxProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  error?: any;
  registration: UseFormRegister<any>;
  validation?: RegisterOptions;
  className?: string;
  helperText?: string;
  description?: string;
}

export function FormCheckbox({
  label,
  name,
  required = false,
  disabled = false,
  error,
  registration,
  validation,
  className = '',
  helperText,
  description,
}: FormCheckboxProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={name}
            type="checkbox"
            disabled={disabled}
            className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded ${
              error ? 'border-red-300' : ''
            } ${disabled ? 'bg-gray-50' : ''}`}
            {...registration(name, validation)}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={name} className="font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error.message}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  className?: string;
}

export function FormActions({
  onCancel,
  isSubmitting = false,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitDisabled = false,
  className = '',
}: FormActionsProps) {
  return (
    <div className={`flex justify-end space-x-3 pt-4 border-t ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={isSubmitting || submitDisabled}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {isSubmitting && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {submitText}
      </button>
    </div>
  );
}
