import React, { useState } from 'react';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import './SearchBar.css';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showButton?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  loading = false,
  disabled = false,
  size = 'medium',
  showButton = true,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState('');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSearch = () => {
    if (onSearch && !loading && !disabled) {
      onSearch(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    const newValue = '';
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const wrapperClasses = [
    'search-bar',
    `search-bar--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        leftIcon={<Icon name="search" />}
        rightIcon={
          value ? (
            <button
              type="button"
              className="search-bar__clear"
              onClick={handleClear}
              disabled={disabled}
            >
              <Icon name="close" size="small" />
            </button>
          ) : null
        }
      />
      
      {showButton && (
        <Button
          variant="primary"
          size={size}
          onClick={handleSearch}
          loading={loading}
          disabled={disabled || !value.trim()}
          icon={<Icon name="search" />}
        >
          Search
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
