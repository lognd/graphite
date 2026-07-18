// Designed empty state (spec 03.5, 04.3): every view that can be legitimately
// empty gets a specific engineer-voiced message, never a blank pane.

import type { ReactNode } from 'react';
import './EmptyState.css';

// frob:doc docs/guide.md#1010-emptystate-and-errorstate
export interface EmptyStateProps {
  title: string;
  detail?: string;
  action?: ReactNode;
}

// frob:doc docs/guide.md#1010-emptystate-and-errorstate
export function EmptyState({ title, detail, action }: EmptyStateProps) {
  return (
    <div className="gr-empty-state" role="status">
      <p className="gr-empty-state__title">{title}</p>
      {detail ? <p className="gr-empty-state__detail">{detail}</p> : null}
      {action ? <div className="gr-empty-state__action">{action}</div> : null}
    </div>
  );
}
