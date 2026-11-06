import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Briefcase, Check, GraduationCap, Store, Wrench, UserRound } from "lucide-react";
import { CATEGORIES } from "../data/events";
import { normalizeDiscoveryProfile, OCCUPATIONS, type DiscoveryProfile } from "../discovery";
import type { Category, Occupation } from "../types";

const ICONS = { student: GraduationCap, teacher: BookOpen, professional: Briefcase, business_owner: Store, self_employed: Wrench, other: UserRound, prefer_not_to_say: UserRound };

export function JoinerOnboarding({ titleId, initialProfile, editing = false, onComplete, onSkip }: {
  titleId: string;
  initialProfile?: DiscoveryProfile | null;
  editing?: boolean;
  onComplete: (profile: DiscoveryProfile) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(1);
  const [occupation, setOccupation] = useState<Occupation | "">(initialProfile?.occupation ?? "");
  const [interests, setInterests] = useState<Category[]>(initialProfile?.interests ?? []);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const toggleInterest = (category: Category) => {
    setInterests((current) => current.includes(category) ? current.filter((value) => value !== category) : [...current, category]);
    setError("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      if (!occupation) { setError("Choose an option to continue."); return; }
      setError(""); setStep(2); return;
    }
    const profile = normalizeDiscoveryProfile({ occupation, interests }, CATEGORIES);
    if (!profile) { setError("Choose at least one interest."); return; }
    onComplete(profile);
  };
  return <form className="joiner-onboarding" onSubmit={submit} noValidate>
    <div className="onboarding-progress" aria-label={"Step " + step + " of 2"}>
      <span className="onboarding-eyebrow">{editing ? "Your preferences" : "Make Sali Ka yours"}</span>
      <span>{step} / 2</span>
    </div>
    <div className="onboarding-progress-track" aria-hidden="true"><span className={step === 2 ? "onboarding-progress-track--complete" : ""} /></div>
    <h2 id={titleId} ref={heading} tabIndex={-1}>{step === 1 ? "Which best describes you?" : "What are you interested in?"}</h2>
    <p className="onboarding-sub">{step === 1 ? "Tell us a little about yourself." : "Choose the events you would like to see."}</p>
    {step === 1 ? <fieldset className="onboarding-options" aria-describedby={error ? "onboarding-error" : undefined}>
      <legend className="onboarding-sr-only">Choose what best describes you</legend>
      {OCCUPATIONS.map(({ value, label }) => {
        const Icon = ICONS[value];
        return <label key={value} className={"onboarding-option" + (occupation === value ? " onboarding-option--selected" : "")}>
          <input type="radio" name="occupation" value={value} checked={occupation === value} onChange={() => { setOccupation(value); setError(""); }} />
          <Icon size={23} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
        </label>;
      })}
    </fieldset> : <fieldset className="onboarding-interest-options" aria-describedby={error ? "onboarding-error" : undefined}>
      <legend className="onboarding-sr-only">Choose one or more interests</legend>
      {CATEGORIES.map((category) => <button key={category} type="button" aria-pressed={interests.includes(category)}
        className={"onboarding-interest" + (interests.includes(category) ? " onboarding-interest--selected" : "")} onClick={() => toggleInterest(category)}>
        <span>{category}</span>{interests.includes(category) && <Check size={18} aria-hidden="true" />}
      </button>)}
    </fieldset>}
    {error && <p id="onboarding-error" className="auth-error" role="alert">{error}</p>}
    <div className="onboarding-actions">
      {step === 2 && <button type="button" className="btn-ghost" onClick={() => { setStep(1); setError(""); }}><ArrowLeft size={17} aria-hidden="true" /> Back</button>}
      <button type="submit" className="btn-primary">{step === 1 ? "Continue" : editing ? "Save preferences" : "Start exploring"}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    <button type="button" className="onboarding-skip" onClick={onSkip}>{editing ? "Cancel" : "Skip for now"}</button>
  </form>;
}

export function JoinerOnboardingDialog({ onComplete, onSkip }: {
  onComplete: (profile: DiscoveryProfile) => void;
  onSkip: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className="onboarding-dialog" aria-labelledby="onboarding-title" onCancel={(event) => { event.preventDefault(); onSkip(); }}>
    <JoinerOnboarding titleId="onboarding-title" onComplete={onComplete} onSkip={onSkip} />
  </dialog>;
}
