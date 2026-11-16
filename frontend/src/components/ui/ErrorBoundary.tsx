import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time failures so a broken page shows a helpful message
 * instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Something went wrong on this page</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            Your data is safe. Reload the page to continue. If this keeps happening, contact support with the message below.
          </p>
          <p className="mt-5 max-h-28 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-left font-mono text-[11px] leading-relaxed text-slate-500">
            {this.state.error.message || 'Unknown error'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" /> Reload page
          </button>
        </div>
      </div>
    );
  }
}
