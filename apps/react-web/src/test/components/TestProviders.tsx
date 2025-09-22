import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../app/providers/AuthProvider';

export const TestProviders = ({ 
  children, 
  queryClient, 
  withAuth = true
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
  withAuth?: boolean;
}) => {
  if (withAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};