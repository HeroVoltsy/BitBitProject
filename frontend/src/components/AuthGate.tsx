import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { AuthForm, type AuthMode } from "../screens/AuthScreen";
import type { Session } from "../useAuth";
import { useToast } from "./Toast";
import { BrandPanel } from "./BrandPanel";
import { JoinerOnboardingDialog } from "./JoinerOnboarding";
import { shouldOnboardJoiner, type DiscoveryProfile } from "../discovery";

/**
 * Sign-in gate. Visitors can browse without an account; features that need one
 * (like, join, sasali, post, notifications, follow, rate) call `requireAuth`.
 * Signed in → the action runs now. Signed out → the sign-in pop-up opens and the
 * action runs right after they log in or sign up.
 *
 * SECURITY: front-end UX gate only (see useAuth.ts). It hides buttons, it does
 * not protect data — real checks must happen on the server.
 */

interface Prompt {
  mode: AuthMode;
  reason?: string;
  action?: () => void;
}

interface AuthGateValue {
  signedIn: boolean;
  /** Run `action` if signed in, otherwise ask to sign in first. */
  requireAuth: (action: () => void, reason?: string) => void;
  /** Open the pop-up directly (e.g. the Sign Up button). */
  openAuth: (mode: AuthMode, reason?: string) => void;
}

const AuthGateContext = createContext<AuthGateValue>({
  signedIn: false,
  requireAuth: () => {},
  openAuth: () => {},
});

export const useAuthGate = () => useContext(AuthGateContext);

export function AuthGateProvider({
  signedIn,
  onLogin,
  children,
}: {
  signedIn: boolean;
  onLogin: (s: Session) => void;
  children: ReactNode;
}) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [onboarding, setOnboarding] = useState<{ session: Session; action?: () => void } | null>(null);
  const onboardingFinished = useRef(false);
  const notify = useToast();

  const requireAuth = useCallback(
    (action: () => void, reason?: string) => {
      if (signedIn) action();
      else setPrompt({ mode: "login", reason, action });
    },
    [signedIn]
  );

  const openAuth = useCallback((mode: AuthMode, reason?: string) => setPrompt({ mode, reason }), []);
  const close = useCallback(() => setPrompt(null), []);

  const handleAuthenticated = (s: Session, mode: AuthMode) => {
    const pending = prompt?.action;
    onLogin(s);
    setPrompt(null);
    if (shouldOnboardJoiner(mode, s.role)) {
      onboardingFinished.current = false;
      setOnboarding({ session: s, action: pending });
      return;
    }
    notify(`Welcome, ${s.name.split(" ")[0]}!`);
    // Finish what they were trying to do (its own toast, if any, replaces the welcome).
    pending?.();
  };

  const finishOnboarding = (profile?: DiscoveryProfile) => {
    if (!onboarding || onboardingFinished.current) return;
    onboardingFinished.current = true;
    if (profile) onLogin({ ...onboarding.session, discoveryProfile: profile });
    const pending = onboarding.action;
    setOnboarding(null);
    notify(`Welcome, ${onboarding.session.name.split(" ")[0]}!`);
    pending?.();
  };

  const value = useMemo(() => ({ signedIn, requireAuth, openAuth }), [signedIn, requireAuth, openAuth]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {onboarding && <JoinerOnboardingDialog onComplete={finishOnboarding} onSkip={() => finishOnboarding()} />}
      {prompt && (
        <AuthModal prompt={prompt} onClose={close} onAuthenticated={handleAuthenticated} />
      )}
    </AuthGateContext.Provider>
  );
}

/** Native <dialog>: traps focus, makes the page behind inert, closes on Esc. */
function AuthModal({
  prompt,
  onClose,
  onAuthenticated,
}: {
  prompt: Prompt;
  onClose: () => void;
  onAuthenticated: (s: Session, mode: AuthMode) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Only a press that starts AND ends on the backdrop closes it (not a text-select drag).
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      opener?.focus?.(); // return focus to the button that opened it
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="auth-modal"
      aria-labelledby="auth-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal__grid">
        <BrandPanel />
        <div className="auth-modal__body">
          <AuthForm
            initialMode={prompt.mode}
            reason={prompt.reason}
            titleId="auth-modal-title"
            onAuthenticated={onAuthenticated}
          />
        </div>
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </dialog>
  );
}
