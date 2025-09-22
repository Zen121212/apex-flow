import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Input, type InputProps } from './Input';


describe('Input Component', () => {
  const defaultProps: InputProps = {
    placeholder: 'Enter text'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render input with default props', () => {
      render(<Input {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter text');
      expect(input).toHaveClass('input', 'input--default');
    });

    it('should generate unique ID when not provided', () => {
      const { rerender } = render(<Input placeholder="First input" />);
      const firstInput = screen.getByRole('textbox');
      const firstId = firstInput.id;
      
      rerender(<Input placeholder="Second input" />);
      const secondInput = screen.getByRole('textbox');
      const secondId = secondInput.id;
      
      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(firstId).not.toBe(secondId);
    });

    it('should use provided ID', () => {
      render(<Input {...defaultProps} id="custom-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-input');
    });

    it('should apply custom className to wrapper', () => {
      render(<Input {...defaultProps} className="custom-class" />);
      
      const wrapper = screen.getByRole('textbox').closest('.form-group');
      expect(wrapper).toHaveClass('form-group', 'custom-class');
    });
  });

  describe('Variants', () => {
    const variants: Array<InputProps['variant']> = ['default', 'filled', 'outline'];

    variants.forEach(variant => {
      it(`should render ${variant} variant correctly`, () => {
        render(<Input {...defaultProps} variant={variant} />);
        
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass(`input--${variant}`);
      });
    });
  });

  describe('Label', () => {
    it('should render label when provided', () => {
      render(<Input {...defaultProps} label="Username" />);
      
      const label = screen.getByText('Username');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('should associate label with input using htmlFor', () => {
      render(<Input {...defaultProps} label="Username" id="username-input" />);
      
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'username-input');
      expect(input).toHaveAttribute('id', 'username-input');
    });

    it('should associate label with generated ID', () => {
      render(<Input {...defaultProps} label="Username" />);
      
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      
      const inputId = input.id;
      expect(inputId).toBeTruthy();
      expect(label).toHaveAttribute('for', inputId);
    });

    it('should not render label when not provided', () => {
      render(<Input {...defaultProps} />);
      
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      render(<Input {...defaultProps} error="This field is required" />);
      
      const errorMessage = screen.getByText('This field is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('input-error');
    });

    it('should add error class to wrapper when error exists', () => {
      render(<Input {...defaultProps} error="This field is required" />);
      
      const wrapper = screen.getByRole('textbox').closest('.form-group');
      expect(wrapper).toHaveClass('form-group--error');
    });

    it('should hide helper text when error is present', () => {
      render(
        <Input 
          {...defaultProps} 
          error="This field is required" 
          helperText="This is helper text"
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('should display helper text when provided', () => {
      render(<Input {...defaultProps} helperText="Enter your username" />);
      
      const helperText = screen.getByText('Enter your username');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('input-helper');
    });

    it('should not display helper text when not provided', () => {
      render(<Input {...defaultProps} />);
      
      expect(screen.queryByText(/enter/i)).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render left icon when provided', () => {
      const leftIcon = <span data-testid="left-icon">👤</span>;
      render(<Input {...defaultProps} leftIcon={leftIcon} />);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input--with-left-icon');
      
      const iconWrapper = screen.getByTestId('left-icon').closest('.input-icon--left');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should render right icon when provided', () => {
      const rightIcon = <span data-testid="right-icon">🔍</span>;
      render(<Input {...defaultProps} rightIcon={rightIcon} />);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input--with-right-icon');
      
      const iconWrapper = screen.getByTestId('right-icon').closest('.input-icon--right');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">👤</span>;
      const rightIcon = <span data-testid="right-icon">🔍</span>;
      
      render(<Input {...defaultProps} leftIcon={leftIcon} rightIcon={rightIcon} />);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input--with-left-icon', 'input--with-right-icon');
    });

    it('should not render icon wrappers when no icons provided', () => {
      render(<Input {...defaultProps} />);
      
      expect(screen.queryByText('👤')).not.toBeInTheDocument();
      expect(screen.queryByText('🔍')).not.toBeInTheDocument();
      
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveClass('input--with-left-icon');
      expect(input).not.toHaveClass('input--with-right-icon');
    });
  });

  describe('Input Types and Attributes', () => {
    it('should handle different input types', () => {
      const { rerender } = render(<Input type="email" placeholder="Email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
      
      rerender(<Input type="password" placeholder="Password" />);
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
      
      rerender(<Input type="number" placeholder="Age" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('should pass through HTML input attributes', () => {
      render(
        <Input 
          {...defaultProps}
          required
          readOnly
          maxLength={10}
          minLength={2}
          pattern="[A-Za-z]+"
          autoComplete="username"
          autoFocus
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('maxlength', '10');
      expect(input).toHaveAttribute('minlength', '2');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
      expect(input).toHaveAttribute('autocomplete', 'username');
      expect(input).toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Input {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('should call onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalledTimes(4); // Called for each character
      expect(handleChange).toHaveBeenLastCalledWith(expect.objectContaining({
        target: expect.objectContaining({ value: 'test' })
      }));
    });

    it('should call onFocus and onBlur handlers', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input {...defaultProps} onFocus={handleFocus} onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', async () => {
      const handleKeyDown = jest.fn();
      const handleKeyUp = jest.fn();
      const user = userEvent.setup();
      
      render(<Input {...defaultProps} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('a');
      
      expect(handleKeyDown).toHaveBeenCalled();
      expect(handleKeyUp).toHaveBeenCalled();
    });

    it('should not accept input when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input {...defaultProps} disabled onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not accept input when readonly', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input {...defaultProps} readOnly onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as controlled component', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('initial');
        
        return (
          <Input 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Controlled input"
          />
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledInput />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');
      
      await user.clear(input);
      await user.type(input, 'updated');
      
      expect(input).toHaveValue('updated');
    });

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup();
      render(<Input {...defaultProps} defaultValue="default value" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default value');
      
      await user.clear(input);
      await user.type(input, 'new value');
      
      expect(input).toHaveValue('new value');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Input {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should support aria attributes', () => {
      render(
        <Input 
          {...defaultProps}
          aria-label="Username input"
          aria-describedby="username-help"
          aria-required="true"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Username input');
      expect(input).toHaveAttribute('aria-describedby', 'username-help');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should be accessible with screen reader', () => {
      render(
        <Input 
          label="Email Address"
          helperText="We'll never share your email"
          placeholder="Enter your email"
        />
      );
      
      const input = screen.getByRole('textbox', { name: 'Email Address' });
      expect(input).toBeInTheDocument();
      
      const label = screen.getByText('Email Address');
      expect(label).toBeInTheDocument();
      
      const helper = screen.getByText("We'll never share your email");
      expect(helper).toBeInTheDocument();
    });

    it('should handle error state accessibly', () => {
      render(
        <Input 
          label="Password"
          error="Password is too short"
          aria-describedby="password-error"
        />
      );
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('Password is too short');
      
      expect(input).toBeInTheDocument();
      expect(errorMessage).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', 'password-error');
    });
  });

  describe('Form Integration', () => {
    it('should work within a form', async () => {
      const handleSubmit = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        return formData.get('username');
      });
      
      const user = userEvent.setup();
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" placeholder="Username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      await user.type(input, 'testuser');
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should support form validation', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <Input 
            name="email"
            type="email" 
            required
            placeholder="Email"
          />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button');
      
      // Try to submit with invalid email
      await user.type(input, 'invalid-email');
      await user.click(submitButton);
      
      expect(input).toBeInvalid();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle dynamic props changes', async () => {
      const DynamicInput = () => {
        const [hasError, setHasError] = React.useState(false);
        const [value, setValue] = React.useState('');
        
        React.useEffect(() => {
          setHasError(value.length > 0 && value.length < 3);
        }, [value]);
        
        return (
          <>
            <Input 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={hasError ? 'Minimum 3 characters' : ''}
              helperText={!hasError ? 'Enter at least 3 characters' : ''}
              placeholder="Dynamic validation"
            />
            <button onClick={() => setValue('')}>Clear</button>
          </>
        );
      };
      
      const user = userEvent.setup();
      render(<DynamicInput />);
      
      const input = screen.getByRole('textbox');
      const clearButton = screen.getByRole('button', { name: 'Clear' });
      
      // Initial state - should show helper text
      expect(screen.getByText('Enter at least 3 characters')).toBeInTheDocument();
      expect(screen.queryByText('Minimum 3 characters')).not.toBeInTheDocument();
      
      // Type less than 3 characters - should show error
      await user.type(input, 'ab');
      await waitFor(() => {
        expect(screen.getByText('Minimum 3 characters')).toBeInTheDocument();
        expect(screen.queryByText('Enter at least 3 characters')).not.toBeInTheDocument();
      });
      
      // Type 3 or more characters - should show helper text again
      await user.type(input, 'c');
      await waitFor(() => {
        expect(screen.getByText('Enter at least 3 characters')).toBeInTheDocument();
        expect(screen.queryByText('Minimum 3 characters')).not.toBeInTheDocument();
      });
      
      // Clear input - should reset
      await user.click(clearButton);
      await waitFor(() => {
        expect(input).toHaveValue('');
        expect(screen.getByText('Enter at least 3 characters')).toBeInTheDocument();
      });
    });
  });
});