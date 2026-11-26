import { createApiClient, tokenExpiry } from "./apiClient";
import type { DiscoveryProfile } from "./discovery";
import type { KycStatus, KycAddress } from "./kyc";
export { ApiError } from "./apiClient";

const TOKEN_KEY = "salika.access-token.v1";
let activeToken: string | null = null;
export const AUTH_EXPIRED = "salika:auth-expired";
export function readToken(): string | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token && tokenExpiry(token) > Date.now() ? token : null;
  } catch { return null; }
}
export function storeToken(token: string | null) {
  activeToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("salika.session"); // Discard the old unauthenticated prototype session.
  } catch { /* Memory-only authentication when browser storage is unavailable. */ }
}
const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";
export const api = createApiClient({
  baseUrl,
  getToken: () => activeToken,
  onUnauthorized: (token) => {
    if (activeToken !== token) return;
    storeToken(null);
    window.dispatchEvent(new Event(AUTH_EXPIRED));
  },
});

export interface ApiUser {
  id: number; username: string; email: string; display_name: string | null;
  account_type: "attendee" | "host"; business_name: string | null;
  business_contact: string | null; discovery_profile: DiscoveryProfile | null;
}
export interface PersonalDetails {
  firstName: string; lastName: string; middleName: string; contactNumber: string;
  permanentAddress: KycAddress; currentAddress: KycAddress; organization: string; authorized: boolean;
}
export interface KycSubmission {
  id: number; legal_name: string; date_of_birth: string; address: string; id_type: string;
  personal_details: PersonalDetails | null; status: KycStatus; documents: string[];
  review_note: string | null; reviewed_at: string | null;
}
export function getMyKyc(signal?: AbortSignal) {
  return api<KycSubmission>("/api/v1/kyc/me", { signal });
}
export function updateProfile(data: { account_type?: "attendee" | "host"; discovery_profile?: DiscoveryProfile }) {
  return api<ApiUser>("/users/me", { method: "PATCH", body: JSON.stringify(data) });
}
