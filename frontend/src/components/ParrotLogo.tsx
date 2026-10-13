/**
 * Sali Ka parrot mark — a clean, minimal parrot head (crest + hooked beak).
 * Uses `currentColor` so it inherits the mark's text color; the eye is a
 * cut-out (evenodd) that shows the container background through it.
 */
export function ParrotLogo({
  size = 22,
  className,
  title = "Sali Ka logo",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      {/* crest feathers */}
      <path d="M10.5 12C8.6 7.6 10.6 4.6 14 4c-1.2 2.5-2 5-1.8 7.6z" />
      <path d="M13 11c-1-5 2-8 5.5-7.8-2 1.8-2.7 4.3-2.9 7.1z" />
      <path d="M16 10.6C15.8 6 18.5 4 21.5 5c-2 1-2.7 3-2.8 5.2z" />
      {/* head with eye cut-out */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 10a9 9 0 1 0 0.01 18A9 9 0 0 0 15 10Zm2.1 6a1.4 1.4 0 1 1 2.8 0 1.4 1.4 0 0 1-2.8 0Z"
      />
      {/* hooked beak */}
      <path d="M21.5 14.5c4-0.5 7.5 1 7.3 3.7-0.2 2.1-2.8 3-5.3 2.4 1.4-1.6 1-4.4-2-6.1Z" />
      {/* small perch */}
      <path d="M8 29.2h13a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2Z" opacity="0.55" />
    </svg>
  );
}
