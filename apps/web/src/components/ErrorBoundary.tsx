import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI error boundary', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-lg px-4 py-20 md:px-6">
        <p className="font-display text-3xl font-semibold text-ink">Something went wrong</p>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">
          The page hit an unexpected error. Your data was not filed with the borough — this hub is a
          preparation mirror only.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="rounded-md bg-creek px-4 py-2 font-semibold text-foam"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
          <Link to="/" className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink">
            Home
          </Link>
          <Link
            to="/structures"
            className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
          >
            Structures
          </Link>
          <Link
            to="/map"
            className="rounded-md border border-ink/15 px-4 py-2 font-semibold text-ink"
          >
            Map
          </Link>
        </div>
        {this.state.error?.message ? (
          <p className="mt-6 text-xs text-ink/40 break-words">
            Technical detail: {this.state.error.message.slice(0, 240)}
          </p>
        ) : null}
      </div>
    );
  }
}
