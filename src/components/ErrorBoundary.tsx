import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Refactored to use class field for state initialization.
  // This is a more modern and robust syntax that avoids potential issues with `this` in the constructor.
  state: ErrorBoundaryState = { hasError: false };

  // FIX: Removed the redundant constructor. It is unnecessary when initializing state as a class property and may have been causing a type inference issue with `this.props`.
  // constructor(props: ErrorBoundaryProps) {
  //   super(props);
  // }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in React component tree:", error, errorInfo);
  }

  // FIX: Add explicit return type to the render method to aid type inference.
  render(): ReactNode {
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
