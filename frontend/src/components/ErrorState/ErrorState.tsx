// Designed error state (spec 03.5, 04.1's "any long operation" checklist):
// shows the real error/stderr tail, never a sad-face illustration or a
// vague "something went wrong."

import './ErrorState.css';

export interface ErrorStateProps {
  title: string;
  detail?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, detail, onRetry }: ErrorStateProps) {
  return (
    <div className="gr-error-state" role="alert">
      <p className="gr-error-state__title">{title}</p>
      {detail ? <pre className="gr-error-state__detail">{detail}</pre> : null}
      {onRetry ? (
        <button type="button" className="gr-error-state__retry" onClick={onRetry}>
          retry
        </button>
      ) : null}
    </div>
  );
}
