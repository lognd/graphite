// WO-G8 a11y pass: every route needs exactly one real <h1> for a sane
// document outline (WCAG 1.3.1/2.4.6), even where the visual design's own
// heading (TitleBlock, a gr-micro-label span, etc.) is not itself an <h1>.
// Screen-reader-only by default so it never duplicates the visible title
// block on screen; routes that already render a genuine visible <h1>
// (e.g. ClaimDetail) do not need this.
export function PageTitle({ text }: { text: string }) {
  return <h1 className="gr-sr-only">{text}</h1>;
}
