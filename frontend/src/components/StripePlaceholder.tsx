import { ImageIcon } from "lucide-react";

/** The diagonal-striped "event photo" cover placeholder from the design. */
export function StripePlaceholder({
  className = "",
  showLabel = true,
  children,
}: {
  className?: string;
  showLabel?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`stripes ${className}`}>
      {showLabel && (
        <span className="stripes__label">
          <ImageIcon size={16} strokeWidth={2} />
          event photo
        </span>
      )}
      {children}
    </div>
  );
}
