import { useEffect } from 'react';
import { Nav } from '../ui/Nav';
import raw from './guide-content.html?raw';
import './pages.css';

// Each <h2> and everything after it, up to the next <h2>, becomes a section you can open and close.
const content = (() => {
  const parts = raw.split(/(?=<h2[\s>])/);
  const intro = parts.shift() ?? '';
  return (
    intro +
    parts
      .map((part) => {
        const end = part.indexOf('</h2>') + '</h2>'.length;
        return `<details class="pb-sec"><summary>${part.slice(0, end)}</summary>${part.slice(end)}</details>`;
      })
      .join('\n')
  );
})();

/** The Guide: how to pass the bug-fixing round. Static content from guide-content.html. */
export function Guide() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <>
      <Nav active="guide" />
      <div className="wrap pb" dangerouslySetInnerHTML={{ __html: content }} />
    </>
  );
}
