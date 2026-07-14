// A minimal, SAFE markdown-to-JSX render (headings, list items,
// paragraphs) -- never `dangerouslySetInnerHTML` (charter 3.1/ANTI-VIBE:
// no injected HTML from artifact content). Good enough for the shipped
// bringup.md / README-shaped docs; anything fancier (tables, code
// fences with syntax highlight) still shows as a paragraph, honestly,
// rather than being silently dropped.

export function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: { kind: 'h1' | 'h2' | 'h3' | 'li' | 'p'; text: string }[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('### ')) blocks.push({ kind: 'h3', text: line.slice(4) });
    else if (line.startsWith('## ')) blocks.push({ kind: 'h2', text: line.slice(3) });
    else if (line.startsWith('# ')) blocks.push({ kind: 'h1', text: line.slice(2) });
    else if (/^[-*]\s+/.test(line)) blocks.push({ kind: 'li', text: line.replace(/^[-*]\s+/, '') });
    else if (/^\d+\.\s+/.test(line))
      blocks.push({ kind: 'li', text: line.replace(/^\d+\.\s+/, '') });
    else blocks.push({ kind: 'p', text: line });
  }
  return (
    <div className="gr-markdown-block">
      {blocks.map((b, i) => {
        if (b.kind === 'h1') return <h2 key={i}>{b.text}</h2>;
        if (b.kind === 'h2') return <h3 key={i}>{b.text}</h3>;
        if (b.kind === 'h3') return <h4 key={i}>{b.text}</h4>;
        if (b.kind === 'li') return <li key={i}>{b.text}</li>;
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
