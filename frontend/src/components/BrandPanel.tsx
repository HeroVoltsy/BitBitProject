import { useState } from "react";
import { MapPin, CalendarDays, QrCode } from "lucide-react";
import { ParrotLogo } from "./ParrotLogo";

/**
 * Green brand panel from the original login page, now shown inside the sign-in
 * pop-up: beside the form on laptops/desktops, as a compact strip above it on phones.
 * Reuses the .auth-hero styles in app.css.
 */
export function BrandPanel() {
  const [artOk, setArtOk] = useState(true);

  return (
    <aside className="auth-hero auth-hero--modal" aria-label="About Sali Ka">
      <div className="auth-hero__top">
        <span className="brand__mark auth-hero__mark" aria-hidden="true">
          <ParrotLogo size={26} />
        </span>
        <span className="auth-hero__name" translate="no">
          sali ka<span className="auth-hero__q">?</span>
        </span>
      </div>

      <div className="auth-hero__art">
        {artOk ? (
          <img
            src="/sali-ka-logo.webp"
            className="auth-hero__logo"
            alt=""
            width={1450}
            height={1085}
            decoding="async"
            onError={() => setArtOk(false)}
          />
        ) : (
          <ParrotLogo size={140} className="auth-hero__art-fallback" title="" />
        )}
      </div>

      <div className="auth-hero__body">
        <p className="auth-hero__headline">Your neighborhood, always up to something.</p>
        <ul className="auth-hero__points">
          <li>
            <MapPin size={18} strokeWidth={2.2} aria-hidden="true" />
            Find events happening near you
          </li>
          <li>
            <CalendarDays size={18} strokeWidth={2.2} aria-hidden="true" />
            Host and manage your own
          </li>
          <li>
            <QrCode size={18} strokeWidth={2.2} aria-hidden="true" />
            Check members in with a QR
          </li>
        </ul>
      </div>
    </aside>
  );
}
