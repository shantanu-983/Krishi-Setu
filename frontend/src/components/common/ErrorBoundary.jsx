import React from 'react';

/**
 * Krishi Setu Global Error Boundary
 *
 * Prevents React application crashes from displaying a blank white screen.
 * Catches JavaScript errors anywhere in child component trees, logs them,
 * and renders an accessible fallback UI with recovery options.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Krishi Setu caught runtime error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      // Clear potentially corrupt auth or state tokens
      sessionStorage.clear();
    } catch {
      // Ignore storage cleanup issues
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-[#eef4f7] dark:bg-[#0c121e] flex items-center justify-center p-4 sm:p-6 text-slate-800 dark:text-slate-100">
          <div className="max-w-lg w-full bg-white dark:bg-[#111927] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-10 text-center space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400 text-3xl shadow-xs">
              ⚠️
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                कृषि सेतु में एक अनपेक्षित समस्या आई है। कृपया पृष्ठ पुनः लोड करें या मुख्य पृष्ठ पर जाएँ।
              </p>
            </div>

            {/* Error Message Details in Dev */}
            {isDev && this.state.error && (
              <div className="text-left bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-40">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#143d35] hover:bg-[#0e2c26] text-white text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer"
              >
                Reload Page (पुनः लोड करें)
              </button>
              <button
                type="button"
                onClick={this.handleResetState}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wide transition cursor-pointer"
              >
                Reset to Home
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
