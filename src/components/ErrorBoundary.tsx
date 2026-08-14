import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Portfolio application:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] text-neutral-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md space-y-4">
            <h1 className="font-syne text-xl font-bold tracking-wider text-teal-400">SUBEG SINGH PORTFOLIO</h1>
            <p className="font-mono text-xs text-neutral-400">
              Recovering application session...
            </p>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-300 overflow-auto text-left max-h-32">
              {this.state.error?.message || 'An unknown glitch occurred'}
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('subeg_projects_data');
                    localStorage.removeItem('subeg_about_data');
                    localStorage.removeItem('subeg_contact_data');
                    localStorage.removeItem('subeg_site_settings');
                  } catch {}
                  window.location.hash = '#/about';
                  window.location.reload();
                }}
                className="px-4 py-2 bg-neutral-100 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white transition-colors"
              >
                Reload &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



