/** Prototype metadata only. Identity fields and images are never persisted here. */
export type DemoKycStatus = "not_started" | "demo_pending" | "demo_approved" | "demo_changes_requested";
export type DemoKycRole = "attendee" | "host";
export type DemoKycRecord = Partial<Record<DemoKycRole, DemoKycStatus>>;

export const DEMO_KYC_LABELS: Record<DemoKycStatus, string> = {
  not_started: "Not started",
  demo_pending: "Ready to submit",
  demo_approved: "Approval preview",
  demo_changes_requested: "Changes requested preview",
};
export const DOCUMENT_TYPES = ["National ID", "Passport", "Driver's license"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function getDemoKycStatus(record: DemoKycRecord | undefined, role: DemoKycRole): DemoKycStatus {
  const status = record?.[role];
  return status && Object.prototype.hasOwnProperty.call(DEMO_KYC_LABELS, status) ? status : "not_started";
}

export interface DemoKycDetails {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  contactNumber: string;
  addressLine1: string;
  addressLine2: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  documentType: string;
  organization: string;
  authorized: boolean;
}
export type KycAddress = Pick<DemoKycDetails, "addressLine1" | "addressLine2" | "barangay" | "city" | "province" | "postalCode" | "country">;
export type AddressErrors = Partial<Record<keyof KycAddress, string>>;
export type DetailErrors = Partial<Record<keyof DemoKycDetails, string>>;
export type DocumentErrors = Partial<Record<"documentType" | "front" | "back" | "selfie", string>>;

export function validateIdentity(details: DemoKycDetails, role: DemoKycRole, today = new Date()): DetailErrors {
  const errors: DetailErrors = {};
  if (!details.firstName.trim() || details.firstName.trim().length > 100) errors.firstName = "Enter your first name (up to 100 characters).";
  if (!details.lastName.trim() || details.lastName.trim().length > 100) errors.lastName = "Enter your last name (up to 100 characters).";
  if (details.middleName.trim().length > 100) errors.middleName = "Use up to 100 characters for your middle name.";
  const phone = details.contactNumber.trim();
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
    errors.contactNumber = "Enter a valid contact number (7 to 15 digits).";
  }
  const date = new Date(details.dateOfBirth + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(details.dateOfBirth) || Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== details.dateOfBirth || details.dateOfBirth >= today.toISOString().slice(0, 10)) {
    errors.dateOfBirth = "Enter a valid date of birth in the past.";
  }
  if (role === "host") {
    if (details.organization.trim().length < 2 || details.organization.trim().length > 100) errors.organization = "Enter your business or organizer name (2 to 100 characters).";
    if (!details.authorized) errors.authorized = "Confirm that you are authorized to represent this organizer.";
  }
  return errors;
}

export function validateAddress(details: KycAddress): AddressErrors {
  const errors: AddressErrors = {};
  const fields = [
    ["addressLine1", "house number and street", 150], ["city", "city or municipality", 100],
    ["province", "province or region", 100], ["country", "country", 100],
  ] as const;
  for (const [field, label, max] of fields) {
    if (!details[field].trim() || details[field].trim().length > max) errors[field] = "Enter your " + label + " (up to " + max + " characters).";
  }
  if (details.addressLine2.trim().length > 150) errors.addressLine2 = "Use up to 150 characters for the additional address details.";
  const philippines = ["philippines", "ph", "phl"].includes(details.country.trim().toLowerCase());
  if ((philippines && !details.barangay.trim()) || details.barangay.trim().length > 100) errors.barangay = "Enter your barangay (up to 100 characters).";
  const postalCode = details.postalCode.trim();
  if (philippines ? !/^\d{4}$/.test(postalCode) : !/^[a-zA-Z0-9][a-zA-Z0-9 -]{1,11}$/.test(postalCode)) {
    errors.postalCode = philippines ? "Enter a 4-digit postal code." : "Enter a valid postal code (2 to 12 characters).";
  }
  return errors;
}

export function requiresBackImage(documentType: string): boolean {
  return documentType === "National ID" || documentType === "Driver's license";
}

export function validateDocuments(documentType: string, images: { front: boolean; back: boolean; selfie: boolean }): DocumentErrors {
  const errors: DocumentErrors = {};
  if (!(DOCUMENT_TYPES as readonly string[]).includes(documentType)) errors.documentType = "Choose a document type.";
  if (!images.front) errors.front = documentType === "Passport" ? "Add the photo page of your passport." : "Add the front of your ID.";
  if (requiresBackImage(documentType) && !images.back) errors.back = "Add the back of your ID.";
  if (!images.selfie) errors.selfie = "Add a clear selfie photo.";
  return errors;
}

export function validateImage(file: { size: number; type: string }): string | undefined {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choose a JPG, PNG, or WebP image.";
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return "Choose a non-empty image up to 5 MB.";
  return undefined;
}

export function resolveCurrentAddress(permanent: KycAddress, current: KycAddress, sameAsPermanent: boolean): KycAddress {
  return sameAsPermanent ? permanent : current;
}
