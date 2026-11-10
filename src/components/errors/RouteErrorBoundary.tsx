import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../../lib/logger';

interface State { error: Error | null }

/** Per-route error boundary: a friendly fallback instead of a blank page, with a way to report it. */
export class RouteErrorBoundary extends Component<{ children: ReactNode; route?: string }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { logger.error('Route crashed', { route: this.props.route, message: error.message, stack: info.componentStack?.slice(0, 600) }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-[640px] mx-auto py-[60px] text-center" role="alert" data-error-boundary>
        <h1 className="text-[24px] font-light text-ink">Something went wrong on this page</h1>
        <p className="text-text mt-[8px]">The rest of the service is still working. You can try again, or report the problem so we can fix it.</p>
        <p className="text-[13px] text-muted mt-[6px] font-mono">{this.state.error.message}</p>
        <div className="flex justify-center gap-[10px] mt-[16px]">
          <button onClick={() => this.setState({ error: null })} className="h-[32px] px-[14px] rounded-btn border border-primary text-primary font-semibold">Try again</button>
          <a href={`${import.meta.env.BASE_URL}support`} className="h-[32px] px-[14px] rounded-btn bg-primary text-white font-semibold inline-flex items-center">Report this issue</a>
        </div>
      </div>
    );
  }
}
