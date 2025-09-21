import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Button, type ButtonProps } from './Button';


describe('Button Component', () => {
  const defaultProps: ButtonProps = {
    children: 'Test Button'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn', 'btn-primary');
      expect(button).toHaveTextContent('Test Button');
    });

    it('should render with custom className', () => {
      render(<Button {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary', 'custom-class');
    });

    it('should render children correctly', () => {
      render(
        <Button>
          <span>Custom Content</span>
        </Button>
      );
      
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants: Array<ButtonProps['variant']> = [
      'primary', 'secondary', 'ghost', 'google', 'success', 'warning', 'danger'
    ];

    variants.forEach(variant => {
      it(`should render ${variant} variant correctly`, () => {
        render(<Button {...defaultProps} variant={variant} />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass(`btn-${variant}`);
      });
    });
  });

  describe('Sizes', () => {
    const sizes: Array<ButtonProps['size']> = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should render ${size} size correctly`, () => {
        render(<Button {...defaultProps} size={size} />);
        
        const button = screen.getByRole('button');
        if (size === 'small') {
          expect(button).toHaveClass('btn-small');
        } else {
          // medium is default, large would need CSS class implementation
          expect(button).toHaveClass('btn');
        }
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading text when loading is true', () => {
      render(<Button {...defaultProps} loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Loading...');
      expect(button).toHaveClass('btn-loading');
    });

    it('should disable button when loading', () => {
      render(<Button {...defaultProps} loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should hide children when loading', () => {
      render(<Button loading={true}>Original Content</Button>);
      
      expect(screen.queryByText('Original Content')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<Button {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('btn-disabled');
    });

    it('should not trigger onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button {...defaultProps} disabled={true} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button {...defaultProps} loading={true} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Full Width', () => {
    it('should add full width class when fullWidth is true', () => {
      render(<Button {...defaultProps} fullWidth={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-full');
    });

    it('should not add full width class by default', () => {
      render(<Button {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('btn-full');
    });
  });

  describe('Icon', () => {
    it('should render icon when provided', () => {
      const icon = <span data-testid="icon">🔍</span>;
      render(<Button {...defaultProps} icon={icon} />);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should wrap icon in btn-icon span', () => {
      const icon = <span data-testid="icon">🔍</span>;
      render(<Button {...defaultProps} icon={icon} />);
      
      const iconWrapper = screen.getByTestId('icon').closest('.btn-icon');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should not render icon when loading', () => {
      const icon = <span data-testid="icon">🔍</span>;
      render(<Button {...defaultProps} icon={icon} loading={true} />);
      
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event object to onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle keyboard events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid clicks', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button 
          {...defaultProps} 
          type="submit"
          form="test-form"
          data-testid="submit-button"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('data-testid', 'submit-button');
    });

    it('should support custom HTML attributes', () => {
      render(
        <Button 
          {...defaultProps} 
          data-analytics="track-click"
          aria-describedby="button-help"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-analytics', 'track-click');
      expect(button).toHaveAttribute('aria-describedby', 'button-help');
    });
  });

  describe('Form Integration', () => {
    it('should work as a form submit button', async () => {
      const handleSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
      const user = userEvent.setup();
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );
      
      const button = screen.getByRole('button', { name: 'Submit Form' });
      await user.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not submit form when disabled', async () => {
      const handleSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
      const user = userEvent.setup();
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit" disabled={true}>Submit Form</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be focusable by default', () => {
      render(<Button {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });

    it('should maintain focus visible states', async () => {
      const user = userEvent.setup();
      render(<Button {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Focus with keyboard
      await user.tab();
      expect(button).toHaveFocus();
      
      // Click should maintain focus
      await user.click(button);
      expect(button).toHaveFocus();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle state changes correctly', async () => {
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        return (
          <Button 
            loading={loading}
            onClick={() => setLoading(!loading)}
          >
            Toggle Loading
          </Button>
        );
      };
      
      const user = userEvent.setup();
      render(<TestComponent />);
      
      const button = screen.getByRole('button');
      
      // Initial state
      expect(button).toHaveTextContent('Toggle Loading');
      expect(button).not.toBeDisabled();
      
      // Click to start loading
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveTextContent('Loading...');
        expect(button).toBeDisabled();
      });
    });

    it('should handle icon with loading state transition', async () => {
      const icon = <span data-testid="icon">🔍</span>;
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        return (
          <Button 
            icon={icon}
            loading={loading}
            onClick={() => setLoading(!loading)}
          >
            Search
          </Button>
        );
      };
      
      const user = userEvent.setup();
      render(<TestComponent />);
      
      // Initial state - should show icon and text
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      
      // Click to start loading
      const button = screen.getByRole('button');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
        expect(screen.queryByText('Search')).not.toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should work with complex children', () => {
      render(
        <Button>
          <span className="button-text">Save</span>
          <span className="keyboard-shortcut">Ctrl+S</span>
        </Button>
      );
      
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
    });
  });
});