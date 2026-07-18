// Prev/next sibling navigation for detail views (04.1 "ANY DETAIL VIEW"
// floor). Extracted at WO-G8 when the calc-sheet viewer became the second
// consumer of ClaimDetail's inline block (dedup law 04.2); documented
// component-list gap per 03.5 -- no existing component covers ordered
// sibling traversal.

import { Link } from 'react-router-dom';
import './DetailNav.css';

// frob:doc docs/guide.md#1014-detailnav
export interface DetailNavProps {
  prevTo: string | null;
  nextTo: string | null;
  index: number;
  total: number;
}

// frob:doc docs/guide.md#1014-detailnav
export function DetailNav({ prevTo, nextTo, index, total }: DetailNavProps) {
  return (
    <div className="gr-detail-nav">
      {prevTo ? <Link to={prevTo}>&lt; prev</Link> : <span aria-disabled="true">&lt; prev</span>}
      <span className="gr-micro-label">
        {index + 1} / {total}
      </span>
      {nextTo ? <Link to={nextTo}>next &gt;</Link> : <span aria-disabled="true">next &gt;</span>}
    </div>
  );
}
