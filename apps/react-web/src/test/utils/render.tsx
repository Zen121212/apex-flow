import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { TestProviders } from '../components/TestProviders';

// Create a custom render function that includes providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries in tests
      gcTime: Infinity, // Prevent garbage collection during tests
    },
    mutations: {
      retry: false,
    },
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  withAuth?: boolean;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    queryClient = createTestQueryClient(),
    withAuth = true,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders 
      queryClient={queryClient} 
      withAuth={withAuth}
    >
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock user for testing
export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  provider: 'email' as const,
  role: 'user',
};

// Mock auth API responses
export const mockAuthResponses = {
  login: {
    user: mockUser,
    token: 'mock-jwt-token',
  },
  register: {
    user: mockUser,
    token: 'mock-jwt-token',
  },
  profile: {
    user: mockUser,
  },
};

// Re-export specific testing utilities (avoiding * export to satisfy react-refresh)
export {
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
  getByRole,
  getByText,
  queryByText,
  findByText,
  getByTestId,
  queryByTestId,
  findByTestId,
  act,
  cleanup,
  prettyDOM,
  logRoles,
} from '@testing-library/react';
export { customRender as render, createTestQueryClient };
