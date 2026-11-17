import { useEffect, useRef } from 'react';
import { Nav } from '../ui/Nav';
import content from './guide-content.html?raw';
import './pages.css';

/** The Guide: how to pass the bug-fixing round. Static content from guide-content.html. */
export function Guide() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const el = ref.current;
    if (!el) return;
    // Table of contents: scroll to the section instead of changing the page.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-sec]');
      if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.sec!)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <Nav active="guide" />
      <div className="wrap pb" ref={ref} dangerouslySetInnerHTML={{ __html: content }} />
    </>
  );
}
