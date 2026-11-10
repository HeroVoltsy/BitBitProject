/** Rounded parrot-envelope app icon shared by navigation and auth screens. */
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
      src="/sali-ka-app-icon-128.png"
      srcSet="/sali-ka-app-icon-128.png 128w, /sali-ka-app-icon-256.png 256w, /sali-ka-app-icon.png 1024w"
      sizes={size + "px"}
      width={size}
      height={size}
      className={["parrot-logo", className].filter(Boolean).join(" ")}
      alt={title}
    />
  );
}
