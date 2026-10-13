import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

/**
 * Minimal toast for demo feedback. Purely in-memory — nothing is persisted or
 * sent anywhere; the message just appears briefly then clears.
 */
const ToastContext = createContext<(msg: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-layer" aria-live="polite" aria-atomic="true">
        {msg && <div className="toast">{msg}</div>}
      </div>
    </ToastContext.Provider>
  );
}
