import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Pill-shaped filter button that opens its own popover (a bottom sheet on
 * phones). Used beside the search bar on the Home screen.
 *
 * Closes on: Done, outside click, Escape (focus returns to the chip), or
 * tabbing out of the popover.
 */
export function FilterChip({
  title,
  icon,
  value,
  open,
  onOpenChange,
  onClear,
  badge = 0,
  doneLabel = "Done",
  clearLabel = "Clear",
  wide = false,
  children,
}: {
  /** Name of the filter, e.g. "Date". Shown when no value is set. */
  title: string;
  icon: ReactNode;
  /** Short label for the active value, or null when the filter is off. */
  value: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
  /** Count of active filters, shown as a badge (for a combined "Filters" button). */
  badge?: number;
  /** Text for the popover's primary button, e.g. "Show 3 events". */
  doneLabel?: string;
  clearLabel?: string;
  /** Wider popover for multi-section panels. */
  wide?: boolean;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popId = useId();
  const titleId = useId();
  const active = value !== null || badge > 0;
  // Keep the latest callback without re-running the open effect (which would
  // steal focus back to the first option on every parent render).
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  // Open toward whichever side has room. Re-checked when the value changes
  // (a longer label can wrap the chips onto a new row) and on resize.
  const [alignEnd, setAlignEnd] = useState(false);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!btnRef.current || !popRef.current) return;
      const pop = popRef.current;
      const chip = btnRef.current.getBoundingClientRect();
      setAlignEnd(chip.left + pop.offsetWidth > window.innerWidth - 16);
      // Dropdown (not the phone bottom sheet): fit the space below the chip so
      // the footer buttons stay on screen; the panel scrolls inside instead.
      if (getComputedStyle(pop).position === "absolute") {
        const room = window.innerHeight - chip.bottom - 24;
        pop.style.maxHeight = `${Math.max(room, 360)}px`;
      } else {
        pop.style.maxHeight = "";
      }
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [open, value]);

  const close = (returnFocus: boolean) => {
    onOpenChange(false);
    if (returnFocus) btnRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    // Move focus into the popover so keyboard users land on the options.
    popRef.current
      ?.querySelector<HTMLElement>("button:not(:disabled), [href], input, select")
      ?.focus({ preventScroll: true });

    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChangeRef.current(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChangeRef.current(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className="fchip-wrap"
      ref={wrapRef}
      onBlur={(e) => {
        // Tabbing out of the chip + popover closes it.
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) onOpenChange(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className={`fchip ${active ? "fchip--active" : ""} ${open ? "fchip--open" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-label={badge > 0 ? `${title}: ${badge} active` : `${title}: ${value ?? "any"}`}
        onClick={() => onOpenChange(!open)}
      >
        <span className="fchip__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="fchip__label">{value ?? title}</span>
        {badge > 0 ? (
          <span className="fchip__badge" aria-hidden="true">
            {badge}
          </span>
        ) : (
          <ChevronDown size={16} strokeWidth={2.4} className="fchip__caret" aria-hidden="true" />
        )}
      </button>

      {open && (
        <>
          <div className="fchip-scrim" aria-hidden="true" onClick={() => close(false)} />
          <div
            ref={popRef}
            id={popId}
            className={`fchip-pop ${alignEnd ? "fchip-pop--end" : ""} ${wide ? "fchip-pop--wide" : ""}`}
            role="dialog"
            aria-labelledby={titleId}
          >
            <p className="fchip-pop__title" id={titleId}>
              {title}
            </p>
            {children}
            <div className="fchip-pop__foot">
              <button type="button" className="fchip-pop__clear" onClick={onClear} disabled={!active}>
                {clearLabel}
              </button>
              <button type="button" className="fchip-pop__done" onClick={() => close(true)}>
                {doneLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
