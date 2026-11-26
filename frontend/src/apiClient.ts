export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  fetcher = fetch,
}: {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized: (token: string) => void;
  fetcher?: typeof fetch;
}) {
  const base = baseUrl.replace(/\/+$/, "");
  return async function request<T>(
    path: string,
    options: RequestInit & { token?: string | null } = {},
  ): Promise<T> {
    const { token: supplied, ...init } = options;
    const token = supplied === undefined ? getToken() : supplied;
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", "Bearer " + token);
    if (init.body && !(init.body instanceof FormData))
      headers.set("Content-Type", "application/json");
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    if (init.signal?.aborted) cancel();
    init.signal?.addEventListener("abort", cancel, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30000);
    let response: Response;
    try {
      response = await fetcher(base + path, {
        ...init,
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (timedOut)
        throw new ApiError(
          0,
          "The server took too long to respond. Please try again.",
        );
      if (error instanceof DOMException && error.name === "AbortError")
        throw error;
      throw new ApiError(
        0,
        "Could not reach the server. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", cancel);
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized(token);
      const detail =
        body && typeof body === "object" && "detail" in body
          ? (body as { detail: unknown }).detail
          : null;
      const message =
        typeof detail === "string"
          ? detail
          : response.status === 422
            ? "Some information was not accepted. Check your entries and try again."
            : response.status === 413
              ? "This file is too large. Choose an image under 4 MB."
              : response.status === 401
                ? "Your session has expired. Please log in again."
                : "The server could not complete the request. Please try again.";
      throw new ApiError(response.status, message);
    }
    if (body === null)
      throw new ApiError(
        response.status,
        "The server returned an unexpected response.",
      );
    return body as T;
  };
}

export function tokenExpiry(token: string): number {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}
