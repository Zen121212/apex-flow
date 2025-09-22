import React from 'react';
import { Input, InputProps } from '../../atoms/Input/Input';
import { Icon } from '../../atoms/Icon/Icon';
import './FormField.css';

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  name: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  showValidation?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  validation,
  showValidation = true,
  value,
  onChange,
  ...inputProps
}) => {
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const validateValue = React.useCallback((val: string) => {
    if (!validation) return null;

    if (validation.required && !val.trim()) {
      return `${inputProps.label || name} is required`;
    }

    if (validation.minLength && val.length < validation.minLength) {
      return `Must be at least ${validation.minLength} characters`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `Must be no more than ${validation.maxLength} characters`;
    }

    if (validation.pattern && !validation.pattern.test(val)) {
      return `Invalid ${inputProps.label?.toLowerCase() || name} format`;
    }

    if (validation.custom) {
      return validation.custom(val);
    }

    return null;
  }, [validation, inputProps.label, name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (showValidation && touched) {
      const validationError = validateValue(newValue);
      setError(validationError);
    }

    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    
    if (showValidation) {
      const validationError = validateValue(e.target.value);
      setError(validationError);
    }

    if (inputProps.onBlur) {
      inputProps.onBlur(e);
    }
  };

  const getValidationIcon = () => {
    if (!showValidation || !touched) return null;
    
    if (error) {
      return <Icon name="error" size="small" color="#ef4444" />;
    }
    
    if (value && typeof value === 'string' && value.trim()) {
      return <Icon name="success" size="small" color="#10b981" />;
    }
    
    return null;
  };

  return (
    <div className="form-field">
      <Input
        {...inputProps}
        name={name}
        value={value}
        error={showValidation && touched ? error || undefined : undefined}
        rightIcon={getValidationIcon()}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default FormField;
