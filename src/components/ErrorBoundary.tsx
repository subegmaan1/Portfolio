import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any)<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Portfolio application:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md space-y-4">
            <h1 className="text-xl font-bold tracking-wider text-rose-400">Application Notice</h1>
            <p className="text-sm text-neutral-400">
              The application encountered a visual rendering glitch.
            </p>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-300 overflow-auto text-left max-h-32">
              {this.state.error?.message || 'An unknown error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-100 text-neutral-950 text-xs font-semibold uppercase tracking-wider rounded hover:bg-neutral-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
