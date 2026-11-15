/**
 * The IweHub mark: a small open-book glyph.
 *
 * It inherits `currentColor`, so it takes the accent colour of wherever it is
 * placed. It is decorative by default (the "IweHub" wordmark sits next to it),
 * so it is hidden from assistive tech; pass a `title` to expose it as a
 * labelled image instead.
 */
function Logo({ className = "h-6 w-6", title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
    >
      {title && <title>{title}</title>}
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

export default Logo;
