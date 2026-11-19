// Small line icons drawn with SVG. They take the text colour and size of where they sit.

const PATHS = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  play: 'M7 4.5v15l12-7.5z',
  pause: 'M8 5v14M16 5v14',
  lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  chevronDown: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  sidebarLeft: 'M3 4h18v16H3zM9 4v16',
  sidebarRight: 'M3 4h18v16H3zM15 4v16',
  columns: 'M3 4h18v16H3zM12 4v16',
  diff: 'M12 3v12M6 9h12M6 21h12',
  undo: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5',
  shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, title }: { name: IconName; size?: number; title?: string }) {
  return (
    <svg
      className={`icon i-${name}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'play' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}
