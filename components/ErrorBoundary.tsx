import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  // This component does not have any specific props besides `children`.
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Switched to class field for state initialization to resolve type resolution issues.
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in React component tree:", error, errorInfo);
  }

  // FIX: Removed explicit ReactNode return type from render method to fix a TypeScript type resolution issue where `this.props` was not found.
  render() {
    if (this.state.hasError) {
      const isRTL = document.documentElement.dir === 'rtl';
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-stone-100 text-stone-800 p-6">
          <div className="text-center p-8 bg-red-100 text-red-800 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold">
              {isRTL ? 'حدث خطأ ما' : 'Something went wrong.'}
            </h1>
            <p className="mt-4 text-lg">
              {isRTL 
                ? 'لقد واجهنا خطأ غير متوقع. الرجاء محاولة تحديث الصفحة.' 
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition-colors"
            >
              {isRTL ? 'تحديث الصفحة' : 'Refresh Page'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
