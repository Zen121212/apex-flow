import '@testing-library/jest-dom';

// Add jest-dom matchers to Jest's expect
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveClass(...classNames: string[]): R;
    toHaveAttribute(name: string, value?: string | number | null): R;
    toHaveStyle(style: string | Record<string, unknown>): R;
    toHaveValue(value: string | number | string[] | null): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeRequired(): R;
    toBeInvalid(): R;
    toBeValid(): R;
    toHaveFocus(): R;
    toBeChecked(): R;
    toBePartiallyChecked(): R;
    toHaveDescription(description?: string | RegExp): R;
    toHaveErrorMessage(message?: string | RegExp): R;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
    toHaveFormValues(values: Record<string, unknown>): R;
    toBeEmptyDOMElement(): R;
    toContainElement(element: HTMLElement | null): R;
    toContainHTML(htmlText: string): R;
    toHaveAccessibleDescription(description?: string | RegExp): R;
    toHaveAccessibleName(name?: string | RegExp): R;
  }
}
