import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Create a client for React Query to manage server state
const queryClient = new QueryClient();

// Find the root DOM element where the app will be mounted
const rootElement = document.getElementById('root');

if (rootElement) {
  // Create a React root and render the application
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  // Log an error if the root element is not found, which is a critical failure
  console.error('Fatal Error: The root element with ID "root" was not found in the DOM.');
}