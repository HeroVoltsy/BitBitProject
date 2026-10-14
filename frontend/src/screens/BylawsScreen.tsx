import { LegalPage, type LegalSection } from "../components/LegalPage";
import { LEGAL } from "../data/legal";
import type { ScreenName } from "../types";

const { operator: OPERATOR, email: CONTACT_EMAIL } = LEGAL;

const SECTIONS: LegalSection[] = [
  {
    id: "purpose",
    title: "Article I. Purpose and scope",
    body: (
      <>
        <p>
          These Community By-laws set out how members of the Sali Ka community are expected to
          behave, and how {OPERATOR} enforces these standards. They apply to everyone who uses Sali
          Ka, including guests, attendees, Hosts, and Business accounts, both on the Service and at
          events found through it.
        </p>
        <p>
          These By-laws form part of our Terms & Conditions. If the two ever conflict, the Terms &
          Conditions prevail.
        </p>
      </>
    ),
  },
  {
    id: "values",
    title: "Article II. Community values",
    body: (
      <ul>
        <li>
          <strong>Respect:</strong> treat everyone with courtesy, whatever their background,
          beliefs, or abilities.
        </li>
        <li>
          <strong>Safety:</strong> put the well-being of attendees, Hosts, and neighbors first.
        </li>
        <li>
          <strong>Honesty:</strong> say what you mean, list events accurately, and keep your word.
        </li>
        <li>
          <strong>Inclusion:</strong> help make community events welcoming to all.
        </li>
      </ul>
    ),
  },
  {
    id: "conduct",
    title: "Article III. Member conduct",
    body: (
      <>
        <p>All members must:</p>
        <ul>
          <li>use their real name or a business name they are authorized to use;</li>
          <li>keep only one personal account;</li>
          <li>
            not harass, bully, threaten, stalk, or discriminate against anyone on the basis of sex,
            gender, sexual orientation, age, religion, ethnicity, disability, or any other status;
          </li>
          <li>respect other people's privacy and not share their personal information without consent; and</li>
          <li>follow all applicable laws and local ordinances.</li>
        </ul>
      </>
    ),
  },
  {
    id: "hosting",
    title: "Article IV. Hosting standards",
    body: (
      <>
        <p>Hosts must:</p>
        <ul>
          <li>list events with an accurate title, category, date, time, location, and description;</li>
          <li>clearly state any entrance fee, age limit, dress code, or other requirement;</li>
          <li>secure every permit or clearance required by the local government unit or barangay;</li>
          <li>
            provide reasonable safety measures appropriate to the event, such as first aid,
            marshals for fun runs, or crowd control for concerts;
          </li>
          <li>
            update or cancel a listing as soon as plans change, and give attendees at least
            twenty-four (24) hours' notice of a cancellation, except in emergencies; and
          </li>
          <li>use attendee information only to run their event.</li>
        </ul>
        <p>
          Events must not involve illegal activity, unlicensed gambling, or the sale of alcohol or
          tobacco to minors.
        </p>
      </>
    ),
  },
  {
    id: "attending",
    title: "Article V. Attendee standards",
    body: (
      <ul>
        <li>RSVP only to events you plan to attend, and cancel your RSVP if your plans change.</li>
        <li>Follow the Host's rules and the venue's rules during the event.</li>
        <li>Use only your own membership QR code, and do not share or copy it.</li>
        <li>Respect the venue, the neighborhood, and the environment. Leave no trash behind.</li>
      </ul>
    ),
  },
  {
    id: "content",
    title: "Article VI. Content standards",
    body: (
      <>
        <p>Content posted on Sali Ka must not include:</p>
        <ul>
          <li>hate speech, threats, or content that promotes violence;</li>
          <li>sexually explicit material, or any content that sexualizes minors;</li>
          <li>false or misleading information, scams, or spam;</li>
          <li>other people's personal information, or photos of people posted without their consent; or</li>
          <li>material that infringes someone else's copyright or trademark.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ratings",
    title: "Article VII. Ratings and reviews",
    body: (
      <ul>
        <li>Rate only events you actually attended, based on your own experience.</li>
        <li>Do not offer, request, or accept payment or favors in exchange for ratings.</li>
        <li>Hosts must not rate their own events or pressure attendees for good ratings.</li>
      </ul>
    ),
  },
  {
    id: "business",
    title: "Article VIII. Business accounts",
    body: (
      <ul>
        <li>Keep your business name and contact details accurate and up to date.</li>
        <li>Clearly mark sponsored or promoted events as such.</li>
        <li>Follow consumer protection laws on pricing, advertising, and promotions.</li>
      </ul>
    ),
  },
  {
    id: "reporting",
    title: "Article IX. Reporting a problem",
    body: (
      <>
        <p>
          If you see something that breaks these By-laws, report it to us at {CONTACT_EMAIL}.
          Include the event or user involved and what happened. We review every report and keep the
          reporter's identity confidential.
        </p>
        <p>
          Members must not retaliate against anyone who makes a report in good faith. Knowingly
          false reports are themselves a violation.
        </p>
        <p>
          If someone is in immediate danger, contact emergency services (911) or the local police
          first.
        </p>
      </>
    ),
  },
  {
    id: "enforcement",
    title: "Article X. Enforcement",
    body: (
      <>
        <p>
          Depending on how serious a violation is and whether it has happened before, we may take
          one or more of these actions:
        </p>
        <ol>
          <li>remove the content or event listing;</li>
          <li>issue a written warning;</li>
          <li>temporarily suspend the account, for up to thirty (30) days; or</li>
          <li>permanently ban the account.</li>
        </ol>
        <p>
          We may skip straight to a permanent ban for serious violations, such as violence or
          threats, fraud, or any content or conduct that exploits minors. Where we believe a crime
          was committed, we may report it to the authorities.
        </p>
      </>
    ),
  },
  {
    id: "appeals",
    title: "Article XI. Appeals",
    body: (
      <p>
        If you believe we made a mistake, you may appeal within fourteen (14) days of our decision
        by emailing {CONTACT_EMAIL} with the subject line "Appeal" and an explanation. Someone not
        involved in the original decision will review your appeal and reply within fourteen (14)
        days. That decision is final.
      </p>
    ),
  },
  {
    id: "amendments",
    title: "Article XII. Amendments",
    body: (
      <p>
        {OPERATOR} may amend these By-laws to keep the community safe and to reflect changes in
        the Service or the law. We will announce material changes through the Service at least
        seven (7) days before they take effect.
      </p>
    ),
  },
];

export function BylawsScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  return (
    <LegalPage
      screen="bylaws"
      title="Community By-laws"
      summary={[
        "Be respectful, honest, and safe, both online and at events.",
        "Hosts must list events accurately, get the right permits, and keep attendees safe.",
        "Report problems to us. We keep reports confidential.",
        "Breaking the rules can lead to removal, warnings, suspension, or a ban.",
      ]}
      sections={SECTIONS}
      onNavigate={onNavigate}
    />
  );
}
