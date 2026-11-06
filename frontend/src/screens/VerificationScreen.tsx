import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, ImagePlus } from "lucide-react";
import type { Role } from "../useAuth";
import {
  DEMO_KYC_LABELS, DOCUMENT_TYPES, requiresBackImage, resolveCurrentAddress, validateAddress, validateDocuments,
  validateIdentity, validateImage, type DemoKycDetails, type DemoKycStatus, type DetailErrors, type DocumentErrors, type KycAddress, type AddressErrors,
} from "../kyc";

const EMPTY_DETAILS: DemoKycDetails = {
  firstName: "", lastName: "", middleName: "", dateOfBirth: "", contactNumber: "", addressLine1: "", addressLine2: "",
  barangay: "", city: "", province: "", postalCode: "", country: "Philippines", documentType: "", organization: "", authorized: false,
};
type Images = { front: File | null; back: File | null; selfie: File | null };
const EMPTY_IMAGES: Images = { front: null, back: null, selfie: null };
type ImageKey = keyof Images;
type FormErrors = DetailErrors & DocumentErrors & { consent?: string; currentAddress?: AddressErrors };
const EMPTY_ADDRESS: KycAddress = { addressLine1: "", addressLine2: "", barangay: "", city: "", province: "", postalCode: "", country: "Philippines" };
type TextFieldKey = Exclude<keyof DemoKycDetails, "authorized" | "documentType">;

/** Frontend prototype: entered identity details and image files never leave this form. */
export function VerificationScreen({ role, status, onStatusChange, onBack }: {
  role: Role;
  status: DemoKycStatus;
  onStatusChange: (status: DemoKycStatus) => void;
  onBack: () => void;
}) {
  const roleName = role === "host" ? "Host" : "Joiner";
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<DemoKycDetails>(EMPTY_DETAILS);
  const [currentAddress, setCurrentAddress] = useState<KycAddress>(EMPTY_ADDRESS);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const resolvedCurrentAddress = resolveCurrentAddress(details, currentAddress, sameAsPermanent);
  const [images, setImages] = useState<Images>(EMPTY_IMAGES);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const needsBack = requiresBackImage(details.documentType);
  const isPassport = details.documentType === "Passport";
  const imageKeys: ImageKey[] = needsBack ? ["front", "back", "selfie"] : ["front", "selfie"];
  const imageLabel = (key: ImageKey) => key === "front" ? (isPassport ? "Passport photo page" : "Front of ID") : key === "back" ? "Back of ID" : "Selfie photo";
  const imageHint = (key: ImageKey) => key === "selfie"
    ? "Face the camera with your face clearly visible."
    : key === "back" ? "Show the entire back side, including all four corners."
      : isPassport ? "Show your photo and personal details on the same page." : "Show your photo, name, and all four corners of the card.";

  useEffect(() => { headingRef.current?.focus(); }, [step, status]);
  const focusError = () => requestAnimationFrame(() =>
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  const clearDraft = () => {
    setDetails(EMPTY_DETAILS); setCurrentAddress(EMPTY_ADDRESS); setSameAsPermanent(false); setImages(EMPTY_IMAGES); setConsent(false); setErrors({}); setStep(1);
  };
  const changeField = (field: TextFieldKey, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setConsent(false);
  };
  const checkDocuments = () => validateDocuments(details.documentType, {
    front: Boolean(images.front), back: Boolean(images.back), selfie: Boolean(images.selfie),
  });
  const goWithErrors = (nextStep: number, nextErrors: FormErrors) => {
    setErrors(nextErrors); setStep(nextStep); focusError();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const currentErrors = sameAsPermanent ? {} : validateAddress(currentAddress);
    const personalErrors: FormErrors = { ...validateIdentity(details, role), ...validateAddress(details),
      ...(Object.keys(currentErrors).length ? { currentAddress: currentErrors } : {}) };
    const documentErrors = checkDocuments();
    if (step === 1) {
      if (Object.keys(personalErrors).length) { goWithErrors(1, personalErrors); return; }
      setErrors({}); setStep(2); return;
    }
    if (step === 2) {
      if (Object.keys(documentErrors).length) { goWithErrors(2, documentErrors); return; }
      setErrors({}); setStep(3); return;
    }
    if (Object.keys(personalErrors).length) { goWithErrors(1, personalErrors); return; }
    if (Object.keys(documentErrors).length) { goWithErrors(2, documentErrors); return; }
    if (!consent) { setErrors({ consent: "Confirm that you have reviewed your information." }); focusError(); return; }
    clearDraft();
    // Only this progress marker is persisted, never the entered personal information.
    onStatusChange("demo_pending");
  };
  const textField = (field: TextFieldKey, label: string, options: {
    optional?: boolean; type?: string; placeholder?: string; maxLength?: number; inputMode?: "numeric" | "text" | "tel";
  } = {}) => (
    <label className="field" htmlFor={"kyc-" + field}>
      <span className="field__label">{label}{options.optional && <span className="kyc-optional"> (optional)</span>}</span>
      <input id={"kyc-" + field} className="input" name={field} type={options.type ?? "text"}
        value={details[field]} maxLength={options.maxLength ?? 100} inputMode={options.inputMode}
        placeholder={options.placeholder} required={!options.optional} onChange={(event) => changeField(field, event.target.value)}
        aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? "kyc-error-" + field : undefined} />
      {errors[field] && <span className="auth-error" id={"kyc-error-" + field}>{errors[field]}</span>}
    </label>
  );

  return (
    <div className="page page--narrow kyc-page">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Back to Settings</button>
      <div className="kyc-heading">
        <div><h1 className="page-title">Verify your identity</h1><p className="page-sub">{roleName} account</p></div>
        <span className="kyc-badge">KYC</span>
      </div>
      {status !== "not_started" ? (
        <section className="card kyc-panel" aria-labelledby="kyc-status-title">
          <ClipboardCheck className="kyc-status-icon" size={38} aria-hidden="true" />
          <h2 id="kyc-status-title" ref={headingRef} tabIndex={-1}>{DEMO_KYC_LABELS[status]}</h2>
          <p>{status === "demo_pending"
            ? "You have completed the verification steps. Submission is not available yet, so your information has not been sent for review."
            : "This is a saved review-screen preview. No documents were reviewed and your account has not been verified. Start again to return to the verification steps."}</p>
          <p className="muted">Your personal details, address, and photos have been cleared. Only this step's progress is saved in the current tab.</p>
          <div className="kyc-actions">
            <button type="button" className="btn-primary" onClick={onBack}>Back to Settings</button>
            <button type="button" className="btn-secondary" onClick={() => { clearDraft(); onStatusChange("not_started"); }}>Start again</button>
          </div>
        </section>
      ) : (
        <>
          <ol className="kyc-steps" aria-label="Verification steps">
            {["Personal details", "Documents", "Review"].map((label, index) => (
              <li key={label} className={step === index + 1 ? "kyc-step--active" : ""} aria-current={step === index + 1 ? "step" : undefined}>
                <span aria-hidden="true">{step > index + 1 ? <Check size={16} /> : index + 1}</span>{label}
              </li>
            ))}
          </ol>
          <form ref={formRef} className="card kyc-panel" onSubmit={submit} noValidate autoComplete="off">
            <h2 ref={headingRef} tabIndex={-1}>{["Personal details", "Identity documents", "Review your information"][step - 1]}</h2>
            {step === 1 && <div className="kyc-fields">
              <strong className="kyc-name-heading">Name</strong>
              <div className="kyc-two-col">
                {textField("firstName", "First name", { placeholder: "Enter your first name" })}
                {textField("lastName", "Last name", { placeholder: "Enter your last name" })}
                {textField("middleName", "Middle name", { optional: true, placeholder: "Enter your middle name, if applicable" })}
                {textField("dateOfBirth", "Date of birth", { type: "date" })}
              </div>
              {textField("contactNumber", "Contact number", { type: "tel", inputMode: "tel", maxLength: 30, placeholder: "Contact number" })}
              <fieldset className="kyc-section kyc-address-section">
                <legend>Permanent Address</legend>
                <AddressFields prefix="permanent" value={details} errors={errors} onChange={changeField} />
              </fieldset>
              <fieldset className="kyc-section kyc-address-section">
                <legend>Current Address</legend>
                <label className="kyc-check"><input type="checkbox" checked={sameAsPermanent}
                  onChange={(event) => { setSameAsPermanent(event.target.checked); setErrors((current) => ({ ...current, currentAddress: undefined })); setConsent(false); }} />
                  <span>Same as permanent address</span></label>
                <AddressFields prefix="current" value={resolvedCurrentAddress} errors={sameAsPermanent ? {} : errors.currentAddress ?? {}} disabled={sameAsPermanent}
                  onChange={(field, value) => {
                    setCurrentAddress((current) => ({ ...current, [field]: value }));
                    setErrors((current) => ({ ...current, currentAddress: { ...current.currentAddress, [field]: undefined } }));
                    setConsent(false);
                  }} />
              </fieldset>
              {role === "host" && <fieldset className="kyc-section">
                <legend>Organizer details</legend>
                {textField("organization", "Business / organizer name", { placeholder: "Enter your business or organizer name" })}
                <label className="kyc-check"><input type="checkbox" checked={details.authorized}
                  onChange={(event) => { setDetails({ ...details, authorized: event.target.checked }); setConsent(false); }}
                  aria-invalid={Boolean(errors.authorized)} aria-describedby={errors.authorized ? "kyc-error-authorized" : undefined} />
                  <span>I am authorized to represent this business or organizer.</span></label>
                {errors.authorized && <span className="auth-error" id="kyc-error-authorized">{errors.authorized}</span>}
              </fieldset>}
            </div>}
            {step === 2 && <div className="kyc-fields">
              <label className="field" htmlFor="kyc-documentType"><span className="field__label">Document type</span>
                <select id="kyc-documentType" className="input" name="documentType" required value={details.documentType}
                  onChange={(event) => { setDetails({ ...details, documentType: event.target.value }); setImages({ front: null, back: null, selfie: images.selfie }); setErrors({}); setConsent(false); }}
                  aria-invalid={Boolean(errors.documentType)} aria-describedby={errors.documentType ? "kyc-error-documentType" : undefined}>
                  <option value="">Choose a document</option>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
                {errors.documentType && <span className="auth-error" id="kyc-error-documentType">{errors.documentType}</span>}
              </label>
              {details.documentType && <>
                <div className="kyc-document-note">{isPassport ? "Passport: add the photo page showing your personal details." : "Card ID: add both the front and back of the same ID."} Each image must be JPG, PNG, or WebP, up to 5 MB.</div>
                <div className="kyc-two-col kyc-document-grid">
                  {imageKeys.map((key) => <ImageField key={key} id={key} label={imageLabel(key)} hint={imageHint(key)} value={images[key]} error={errors[key]}
                    onChange={(file) => { setImages((current) => ({ ...current, [key]: file })); setConsent(false); }}
                    onError={(message) => setErrors((current) => ({ ...current, [key]: message }))} />)}
                </div>
              </>}
            </div>}
            {step === 3 && <div className="kyc-fields">
              <p className="muted">Check your details and photos before continuing. Use Edit to make changes.</p>
              <ReviewSection title="Personal details" onEdit={() => { setStep(1); setConsent(false); }}>
                <dl className="kyc-review">
                  <ReviewRow label="Account role" value={roleName} />
                  <ReviewRow label="First name" value={details.firstName.trim()} />
                  <ReviewRow label="Last name" value={details.lastName.trim()} />
                  <ReviewRow label="Middle name" value={details.middleName.trim() || "Not applicable"} />
                  <ReviewRow label="Date of birth" value={details.dateOfBirth} />
                  <ReviewRow label="Contact number" value={details.contactNumber.trim()} />
                  {role === "host" && <><ReviewRow label="Business / organizer" value={details.organization.trim()} /><ReviewRow label="Organizer authorization" value="Confirmed" /></>}
                </dl>
                <h4 className="kyc-review-subtitle">Permanent Address</h4>
                <AddressReview address={details} />
                <h4 className="kyc-review-subtitle">Current Address</h4>
                <AddressReview address={resolvedCurrentAddress} />
              </ReviewSection>
              <ReviewSection title="Identity documents" onEdit={() => { setStep(2); setConsent(false); }}>
                <dl className="kyc-review"><ReviewRow label="Document type" value={details.documentType} /></dl>
                <div className="kyc-two-col kyc-review-images">
                  {imageKeys.map((key) => images[key] && <div key={key}><strong>{imageLabel(key)}</strong><LocalPreview file={images[key]!} label={imageLabel(key)} onInvalid={() => { setImages((current) => ({ ...current, [key]: null })); goWithErrors(2, { [key]: "This photo could not be opened. Choose another image." }); }} /></div>)}
                </div>
              </ReviewSection>
              <label className="kyc-check"><input type="checkbox" checked={consent}
                onChange={(event) => { setConsent(event.target.checked); setErrors({}); }} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "kyc-error-consent" : undefined} />
                <span>I have reviewed my details, address, and photos. I understand they will not be submitted while verification is unavailable.</span></label>
              {errors.consent && <span className="auth-error" id="kyc-error-consent">{errors.consent}</span>}
            </div>}
            <div className="kyc-actions kyc-form-actions">
              {step > 1 && <button type="button" className="btn-secondary" onClick={() => { setStep(step - 1); setErrors({}); setConsent(false); }}>Previous</button>}
              <button type="submit" className="btn-primary">{step === 3 ? "Finish" : "Continue"}<ArrowRight size={18} aria-hidden="true" /></button>
              <button type="button" className="kyc-cancel" onClick={onBack}>Cancel</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function AddressFields({ prefix, value, errors, onChange, disabled = false }: {
  prefix: string; value: KycAddress; errors: AddressErrors; disabled?: boolean;
  onChange: (field: keyof KycAddress, value: string) => void;
}) {
  const field = (key: keyof KycAddress, label: string, optional = false, maxLength = 100) => {
    const id = "kyc-" + prefix + "-" + key;
    return <div className="kyc-address-field">
      <label className="kyc-visually-hidden" htmlFor={id}>{label}{optional ? " (optional)" : ""}</label>
      <input id={id} className="input" name={prefix + "-" + key} value={value[key]} disabled={disabled}
        maxLength={maxLength} placeholder={label + (optional ? " (optional)" : "")} required={!optional}
        onChange={(event) => onChange(key, event.target.value)} aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? id + "-error" : undefined} />
      {errors[key] && <span className="auth-error" id={id + "-error"}>{errors[key]}</span>}
    </div>;
  };
  return <div className="kyc-address-fields">
    {field("addressLine1", "Street Address", false, 150)}
    {field("addressLine2", "Street Address Line 2", true, 150)}
    {field("barangay", "Barangay / District", !["philippines", "ph", "phl"].includes(value.country.trim().toLowerCase()))}
    <div className="kyc-two-col">{field("city", "City / Municipality")}{field("province", "Province / Region")}</div>
    <div className="kyc-two-col">{field("postalCode", "Postal / Zip Code", false, 12)}{field("country", "Country")}</div>
  </div>;
}
function AddressReview({ address }: { address: KycAddress }) {
  return <dl className="kyc-review">
    <ReviewRow label="Street Address" value={address.addressLine1.trim()} />
    {address.addressLine2.trim() && <ReviewRow label="Street Address Line 2" value={address.addressLine2.trim()} />}
    {address.barangay.trim() && <ReviewRow label="Barangay / District" value={address.barangay.trim()} />}
    <ReviewRow label="City / Municipality" value={address.city.trim()} />
    <ReviewRow label="Province / Region" value={address.province.trim()} />
    <ReviewRow label="Postal / Zip Code" value={address.postalCode.trim()} />
    <ReviewRow label="Country" value={address.country.trim()} />
  </dl>;
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return <section className="kyc-review-section"><div className="kyc-review-heading"><h3>{title}</h3><button type="button" onClick={onEdit} aria-label={"Edit " + title.toLowerCase()}>Edit</button></div>{children}</section>;
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function ImageField({ id, label, hint, value, onChange, error, onError }: {
  id: ImageKey; label: string; hint: string; value: File | null;
  onChange: (file: File | null) => void; error?: string; onError: (error?: string) => void;
}) {
  const inputId = "kyc-image-" + id;
  return <div className="kyc-image-field">
    <span className="field__label" id={inputId + "-label"}>{label}</span>
    <p className="kyc-upload-hint" id={inputId + "-hint"}>{hint}</p>
    <input id={inputId} className="kyc-upload-input" type="file" accept="image/jpeg,image/png,image/webp"
      aria-labelledby={inputId + "-label"} aria-invalid={Boolean(error)} aria-describedby={inputId + "-hint" + (error ? " " + inputId + "-error" : "")}
      onChange={(event) => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file) return;
        const message = validateImage(file); onError(message); onChange(message ? null : file);
      }} />
    <label className="kyc-upload-target" htmlFor={inputId}>
      {value ? <><LocalPreview file={value} label={label} onInvalid={() => { onChange(null); onError("This photo could not be opened. Choose another image."); }} /><span>Replace photo</span></>
        : <><ImagePlus size={30} aria-hidden="true" /><strong>Choose photo</strong><span>JPG, PNG, or WebP - up to 5 MB</span></>}
    </label>
    {error && <span className="auth-error" id={inputId + "-error"}>{error}</span>}
    {value && <button type="button" className="kyc-cancel" onClick={() => { onChange(null); onError(undefined); }}>Remove {label.toLowerCase()}</button>}
  </div>;
}

function LocalPreview({ file, label, onInvalid }: { file: File; label: string; onInvalid: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? <img className="kyc-image-preview" src={url} alt={label + " preview"} onError={onInvalid} /> : null;
}
