/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Here you could log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">אופס! משהו השתבש</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              אנחנו מצטערים, אבל משהו לא עבד כמו שצריך. אנא נסה לרענן את הדף.
            </p>

            {isDev && this.state.error && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  פרטי שגיאה (פיתוח בלבד)
                </summary>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                רענן דף
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
