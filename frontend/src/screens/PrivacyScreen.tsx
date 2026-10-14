import { LegalPage, type LegalSection } from "../components/LegalPage";
import { LEGAL } from "../data/legal";
import type { ScreenName } from "../types";

const { operator: OPERATOR, address: ADDRESS, email: CONTACT_EMAIL } = LEGAL;

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    body: (
      <>
        <p>
          Sali Ka is operated by {OPERATOR} ("we", "us", or "our"), {ADDRESS}. We are the personal
          information controller for the personal information we process through the Sali Ka
          website and app (the "Service").
        </p>
        <p>
          This Privacy Policy explains what we collect, why, how we protect it, and the rights you
          have under the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules
          and Regulations, and issuances of the National Privacy Commission ("NPC").
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "2. Information we collect",
    body: (
      <>
        <p>We collect only what we need to run the Service:</p>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, password (stored in
            encrypted, hashed form), and account type.
          </li>
          <li>
            <strong>Business account details:</strong> business name and business contact
            information, if you open a Business account.
          </li>
          <li>
            <strong>Event activity:</strong> events you host, RSVP to, or check in at, plus the
            ratings and content you post.
          </li>
          <li>
            <strong>Event listings:</strong> the details Hosts provide, such as event titles,
            descriptions, dates, venues, and photos.
          </li>
          <li>
            <strong>Technical information:</strong> basic device, browser, and log data needed to
            keep the Service secure and working, and settings such as your light or dark theme
            preference.
          </li>
        </ul>
        <p>
          We do not collect your precise device location unless you choose to allow it, and we do
          not ask for sensitive personal information such as your government ID numbers, health
          records, or religious or political beliefs. Please do not include such information in
          your profile or event listings.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How and why we use your information",
    body: (
      <>
        <p>We use your personal information to:</p>
        <ul>
          <li>create and manage your account and let you sign in;</li>
          <li>show, host, and manage events, RSVPs, and QR check-ins;</li>
          <li>send you notifications you have turned on, such as event reminders;</li>
          <li>respond to your questions, reports, and requests;</li>
          <li>keep the Service safe, prevent fraud and abuse, and enforce our Terms; and</li>
          <li>comply with our legal obligations.</li>
        </ul>
        <p>
          We process your information because it is necessary to provide the Service you signed up
          for, because you have given your consent, because we are legally required to, or for our
          legitimate interests in running a safe and reliable Service, as allowed under Section 12
          of the Data Privacy Act. Where we rely on consent, you can withdraw it at any time.
        </p>
        <p>We do not sell your personal information, and we do not use it for automated decisions that have legal effects on you.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "4. Who we share it with",
    body: (
      <>
        <ul>
          <li>
            <strong>Event Hosts:</strong> when you RSVP to or check in at an event, the Host sees
            your name and attendance. Hosts may use this only to run their event.
          </li>
          <li>
            <strong>Other users:</strong> your name, profile, hosted events, and ratings may be
            visible to other users of the Service.
          </li>
          <li>
            <strong>Service providers:</strong> companies that host our servers, send emails, or
            provide maps and other features for us. They act on our instructions and must protect
            your information.
          </li>
          <li>
            <strong>Authorities:</strong> government agencies or courts, when the law requires it
            or when needed to protect someone's life, safety, or rights.
          </li>
        </ul>
        <p>
          Some of our service providers may store information outside the Philippines. When that
          happens, we require them to protect it to a standard comparable to the Data Privacy Act.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    title: "5. Cookies and browser storage",
    body: (
      <p>
        We use your browser's storage to keep you signed in and to remember preferences such as
        dark mode. We do not use advertising or cross-site tracking cookies. You can clear this
        storage in your browser settings, but parts of the Service may stop working properly.
      </p>
    ),
  },
  {
    id: "retention",
    title: "6. How long we keep it",
    body: (
      <p>
        We keep your personal information only for as long as your account is active or as needed
        for the purposes above. When you delete your account, we delete or anonymize your personal
        information within thirty (30) days, unless we must keep certain records longer to comply
        with the law, resolve disputes, or enforce our agreements.
      </p>
    ),
  },
  {
    id: "security",
    title: "7. How we protect it",
    body: (
      <>
        <p>
          We use reasonable organizational, physical, and technical security measures, including
          encrypted connections, hashed passwords, and access limited to people who need it.
        </p>
        <p>
          No system is completely secure. If a personal data breach puts your rights at real risk,
          we will notify you and the NPC within seventy-two (72) hours of becoming aware of it, as
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "8. Your rights",
    body: (
      <>
        <p>Under the Data Privacy Act, you have the right to:</p>
        <ul>
          <li>be informed about how your personal information is processed;</li>
          <li>access your personal information and get a copy of it;</li>
          <li>correct inaccurate or outdated information;</li>
          <li>object to processing, including withdrawing consent you have given;</li>
          <li>have your information erased or blocked when there are lawful grounds;</li>
          <li>receive your information in a commonly used electronic format (data portability);</li>
          <li>be compensated for damages caused by unlawful processing; and</li>
          <li>file a complaint with the National Privacy Commission.</li>
        </ul>
        <p>
          To use any of these rights, email us at {CONTACT_EMAIL}. We may need to confirm your
          identity first. We will respond within a reasonable time, and in any case within the
          period the law requires.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "9. Children",
    body: (
      <p>
        The Service is meant for people aged 18 and older. Users under 18 may use it only with the
        consent and supervision of a parent or guardian. If you believe a minor has given us
        personal information without that consent, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "10. Changes to this Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will
        notify you through the Service or by email before they take effect. The date at the top of
        this page shows when it was last updated.
      </p>
    ),
  },
  {
    id: "contact",
    title: "11. Contact us and our Data Protection Officer",
    body: (
      <>
        <p>
          For privacy questions, requests, or complaints, contact our Data Protection Officer at{" "}
          {CONTACT_EMAIL} or write to {OPERATOR}, {ADDRESS}.
        </p>
        <p>
          If you are not satisfied with our response, you may file a complaint with the National
          Privacy Commission at privacy.gov.ph.
        </p>
      </>
    ),
  },
];

export function PrivacyScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  return (
    <LegalPage
      screen="privacy"
      title="Privacy Policy"
      summary={[
        "We collect only what we need to run Sali Ka: your account, events, and check-ins.",
        "Hosts see your name when you RSVP to or check in at their events.",
        "We never sell your personal information.",
        "You can access, correct, or delete your data at any time by emailing us.",
      ]}
      sections={SECTIONS}
      onNavigate={onNavigate}
    />
  );
}
