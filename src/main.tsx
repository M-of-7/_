import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Fetch data on every load to ensure freshness
      refetchOnMount: true, // Ensure queries refetch when components mount
      refetchOnWindowFocus: true, // Refetch on window focus for fresh data
    },
  },
});

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);