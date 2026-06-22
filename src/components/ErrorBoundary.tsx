import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="max-w-md bg-white rounded-xl shadow p-8 text-center space-y-4">
            <div className="text-4xl">&#9888;&#65039;</div>
            <h1 className="text-xl font-bold text-hi-navy">Ein Fehler ist aufgetreten</h1>
            <p className="text-gray-500 text-sm">{this.state.error?.message}</p>
            <p className="text-xs text-gray-400">
              Bitte sichern Sie Ihre Daten zuvor mit dem JSON-Backup, bevor Sie die Seite neu laden.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-hi-navy text-white rounded-lg text-sm hover:bg-opacity-90"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
