import { useCallback, useEffect, useState } from "react";
import { ApiError, getMyKyc, type KycSubmission } from "./api";

export function useVerification(userId: number | undefined) {
  const [state, setState] = useState<{ userId?: number; data: KycSubmission | null; loading: boolean; error: string }>({
    data: null, loading: Boolean(userId), error: "",
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!userId) { setState({ data: null, loading: false, error: "" }); return; }
    const controller = new AbortController();
    setState({ userId, data: null, loading: true, error: "" });
    getMyKyc(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ userId, data, loading: false, error: "" });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setState({ userId, data: null, loading: false,
        error: error instanceof ApiError && error.status === 404 ? "" : error.message || "Could not load verification status.",
      });
    });
    return () => controller.abort();
  }, [userId, revision]);
  const update = useCallback((data: KycSubmission) => setState({ userId, data, loading: false, error: "" }), [userId]);
  return {
    submission: state.userId === userId ? state.data : null,
    loading: Boolean(userId) && (state.userId !== userId || state.loading),
    error: state.userId === userId ? state.error : "",
    refresh: () => setRevision((value) => value + 1), update,
  };
}
