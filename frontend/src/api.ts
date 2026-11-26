import { createApiClient, tokenExpiry } from "./apiClient";
export { ApiError } from "./apiClient";
export interface ApiUser {
  id: number;
  email: string;
  username: string;
}
const TOKEN_KEY = "salika.access-token.v2";
export const AUTH_EXPIRED = "salika:auth-expired";
let activeToken: string | null = null;
export const getActiveToken = () => activeToken;
export function readToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token && tokenExpiry(token) > Date.now() ? token : null;
  } catch {
    return null;
  }
}
export function storeToken(token: string | null) {
  activeToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("salika.session");
    sessionStorage.removeItem("salika.access-token.v1");
  } catch {
    /* Authentication continues in memory if browser storage is unavailable. */
  }
}
// Both Vite and Vercel forward these same-origin requests to the existing API.
export const api = createApiClient({
  baseUrl: "/backend",
  getToken: getActiveToken,
  onUnauthorized: (token) => {
    if (activeToken !== token) return;
    storeToken(null);
    window.dispatchEvent(new Event(AUTH_EXPIRED));
  },
});
