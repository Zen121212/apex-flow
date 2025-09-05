import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Build input classes including variant
  const inputClasses = [
    'input',
    `input--${variant}`,
    leftIcon && 'input--with-left-icon',
    rightIcon && 'input--with-right-icon'
  ].filter(Boolean).join(' ');

  // Build wrapper classes
  const wrapperClasses = [
    'form-group',
    error && 'form-group--error',
    className // Use the custom className for the wrapper
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId}>
          {label}
        </label>
      )}
      
      <div className="input-container">
        {leftIcon && (
          <span className="input-icon input-icon--left">
            {leftIcon}
          </span>
        )}
        
        <input
          {...props}
          id={inputId}
          className={inputClasses}
        />
        
        {rightIcon && (
          <span className="input-icon input-icon--right">
            {rightIcon}
          </span>
        )}
      </div>
      
      {error && (
        <span className="input-error">{error}</span>
      )}
      
      {helperText && !error && (
        <span className="input-helper">{helperText}</span>
      )}
    </div>
  );
};

export default Input;
