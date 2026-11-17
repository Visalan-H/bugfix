import { inline, md } from '../ui/markdown';

// Markdown helpers. md() and inline() escape all input, so their output is safe to inject.

export function Markdown({ src, className }: { src: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: md(src) }} />;
}

export function Inline({
  src,
  as: Tag = 'span',
  className,
}: {
  src: string;
  as?: 'span' | 'li' | 'div';
  className?: string;
}) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: inline(src) }} />;
}
