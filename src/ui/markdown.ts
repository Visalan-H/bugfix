import { esc } from './format';

// A small Markdown renderer for tickets, hints and answers (same rules as the
// prototype). Output is HTML with all input escaped, safe for dangerouslySetInnerHTML.

/** Inline bits: `code`, **bold**, [links](https://…). */
export function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/** Headings, paragraphs, lists, tables and code blocks. */
export function md(src: string): string {
  const out: string[] = [];
  const L = src.replace(/\r/g, '').split('\n');
  let i = 0;
  const isList = (l: string) => /^\s*([-*]|\d+\.)\s+/.test(l);
  while (i < L.length) {
    const l = L[i];
    if (l.startsWith('```')) {
      const b: string[] = [];
      i++;
      while (i < L.length && !L[i].startsWith('```')) b.push(L[i++]);
      i++;
      out.push('<pre class="md-code">' + esc(b.join('\n')) + '</pre>');
      continue;
    }
    const h = /^(#{1,3})\s+(.*)/.exec(l);
    if (h) {
      const n = h[1].length + 1;
      out.push(`<h${n}>${inline(h[2])}</h${n}>`);
      i++;
      continue;
    }
    if (l.startsWith('|')) {
      const rows: string[] = [];
      while (i < L.length && L[i].startsWith('|')) rows.push(L[i++]);
      const cells = (r: string) =>
        r
          .replace(/\\\|/g, '\u0001')
          .split('|')
          .slice(1, -1)
          .map((c) => inline(c.trim()).split('\u0001').join('|'));
      let t =
        '<div class="tbl"><table><thead><tr>' +
        cells(rows[0])
          .map((c) => `<th>${c}</th>`)
          .join('') +
        '</tr></thead><tbody>';
      rows.slice(2).forEach((r) => {
        t +=
          '<tr>' +
          cells(r)
            .map((c) => `<td>${c}</td>`)
            .join('') +
          '</tr>';
      });
      out.push(t + '</tbody></table></div>');
      continue;
    }
    if (isList(l)) {
      const ord = /^\s*\d+\./.test(l);
      const items: string[] = [];
      while (i < L.length && isList(L[i])) items.push(L[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      out.push(
        `<${ord ? 'ol' : 'ul'}>` + items.map((x) => `<li>${inline(x)}</li>`).join('') + `</${ord ? 'ol' : 'ul'}>`,
      );
      continue;
    }
    if (!l.trim()) {
      i++;
      continue;
    }
    const b: string[] = [];
    while (i < L.length && L[i].trim() && !/^(#|\||```)/.test(L[i]) && !isList(L[i])) b.push(L[i++]);
    out.push('<p>' + inline(b.join(' ')) + '</p>');
  }
  return out.join('');
}
