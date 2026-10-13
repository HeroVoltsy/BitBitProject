/**
 * Deterministic initials avatar. We render CSS gradients + initials rather than
 * shipping image files — keeps the bundle self-contained with no external assets.
 */
const GRADIENTS = [
  "linear-gradient(135deg, #2E7D32, #1B5E20)",
  "linear-gradient(135deg, #de7b45, #c25f2c)",
  "linear-gradient(135deg, #4b44de, #322caf)",
  "linear-gradient(135deg, #1d75b5, #135a8d)",
  "linear-gradient(135deg, #7d9b6a, #5a744a)",
];

function pick(seed: number) {
  return GRADIENTS[Math.abs(seed) % GRADIENTS.length];
}

export function Avatar({
  seed,
  size = 28,
  label,
  initials,
}: {
  seed: number;
  size?: number;
  label?: string;
  initials?: string;
}) {
  return (
    <span
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        background: pick(seed),
        fontSize: size * 0.38,
      }}
      role="img"
      aria-label={label}
    >
      {initials}
    </span>
  );
}

export function AvatarGroup({ count = 4 }: { count?: number }) {
  return (
    <span className="avatar-group" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="avatar-group__item"
          style={{ background: pick(i + 3), zIndex: count - i }}
        />
      ))}
    </span>
  );
}
