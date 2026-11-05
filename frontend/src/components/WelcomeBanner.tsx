import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuthGate } from "./AuthGate";
import { ParrotLogo } from "./ParrotLogo";

/**
 * Welcome banner at the top of Home for signed-out visitors — the introduction
 * the old login page used to give. Hidden once signed in.
 */
export function WelcomeBanner() {
  const { signedIn, openAuth } = useAuthGate();
  const [artOk, setArtOk] = useState(true);

  if (signedIn) return null;

  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <div className="welcome__text">
        <h1 className="welcome__title" id="welcome-title">
          Your neighborhood, always up to something.
        </h1>
        <p className="welcome__lead">
          Discover, host, and check in to community events happening right around you.
        </p>
        <div className="welcome__actions">
          <button type="button" className="welcome__btn welcome__btn--primary" onClick={() => openAuth("signup")}>
            Sign Up <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button type="button" className="welcome__btn" onClick={() => openAuth("login")}>
            Log In
          </button>
        </div>
      </div>

      <div className="welcome__art" aria-hidden="true">
        {artOk ? (
          <img
            src="/sali-ka-logo.webp"
            className="auth-hero__logo welcome__logo"
            alt=""
            width={1450}
            height={1085}
            decoding="async"
            onError={() => setArtOk(false)}
          />
        ) : (
          <ParrotLogo size={150} className="welcome__logo" title="" />
        )}
      </div>
    </section>
  );
}
