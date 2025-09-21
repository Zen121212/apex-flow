import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../app/providers/AuthProvider';

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

const AllTheProviders = ({ 
  children, 
  queryClient, 
  withAuth = true
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
  withAuth?: boolean;
}) => {
  let component = (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  if (withAuth) {
    component = (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return component;
};

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
    <AllTheProviders 
      queryClient={queryClient} 
      withAuth={withAuth}
    >
      {children}
    </AllTheProviders>
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

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };