/** Sali Ka parrot-envelope icon shared by the navigation and auth screens. */
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
    <img
      src="/sali-ka-icon.png"
      width={size}
      height={size}
      className={className}
      alt={title}
    />
  );
}
