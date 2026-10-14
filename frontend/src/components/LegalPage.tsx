import { ArrowLeft, ChevronRight } from "lucide-react";
import { LEGAL } from "../data/legal";
import type { ScreenName } from "../types";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

const LEGAL_PAGES: { screen: ScreenName; label: string }[] = [
  { screen: "terms", label: "Terms & Conditions" },
  { screen: "privacy", label: "Privacy Policy" },
  { screen: "bylaws", label: "Community By-laws" },
];

/** Shared layout for the legal pages: summary, contents, sections, related links. */
export function LegalPage({
  screen,
  title,
  summary,
  sections,
  onNavigate,
}: {
  screen: ScreenName;
  title: string;
  summary: string[];
  sections: LegalSection[];
  onNavigate: (s: ScreenName) => void;
}) {
  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={() => onNavigate("settings")}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back
      </button>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">Effective {LEGAL.effectiveDate}</p>

      <div className="legal-summary card">
        <h2 className="legal-summary__title">The short version</h2>
        <ul>
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          This summary is for convenience only. The full text below is what applies.
        </p>
      </div>

      <nav className="legal-toc card" aria-label="Contents">
        <h2 className="legal-toc__title">Contents</h2>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => jumpTo(s.id)}>
                {s.title.replace(/^(\d+|Article [IVXLC]+)\.\s*/, "")}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <article className="legal-body card">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="legal-section">
            <h2 className="legal-section__title">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>

      <div className="legal-related">
        {LEGAL_PAGES.filter((p) => p.screen !== screen).map((p) => (
          <button
            key={p.screen}
            type="button"
            className="legal-related__link card"
            onClick={() => onNavigate(p.screen)}
          >
            {p.label}
            <ChevronRight size={18} strokeWidth={2} className="muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
