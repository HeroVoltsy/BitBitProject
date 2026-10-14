import { LegalPage, type LegalSection } from "../components/LegalPage";
import { LEGAL } from "../data/legal";
import type { ScreenName } from "../types";

const { operator: OPERATOR, address: ADDRESS, email: CONTACT_EMAIL, venue: VENUE } = LEGAL;

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of these Terms",
    body: (
      <>
        <p>
          These Terms and Conditions ("Terms") are a binding agreement between you and {OPERATOR}{" "}
          ("Sali Ka", "we", "us", or "our") and govern your use of the Sali Ka website, app, and
          related services (the "Service").
        </p>
        <p>
          By creating an account, continuing as a guest, or otherwise using the Service, you
          confirm that you have read, understood, and agree to these Terms. Your electronic
          acceptance has the same effect as a signed written agreement under the Electronic
          Commerce Act of 2000 (Republic Act No. 8792). If you do not agree, do not use the
          Service.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility and accounts",
    body: (
      <>
        <p>
          You must be at least 18 years old to create an account. If you are under 18, you may
          use the Service only with the consent and supervision of a parent or legal guardian, who
          agrees to these Terms on your behalf and is responsible for your use of the Service.
        </p>
        <p>
          You agree to give accurate information and to keep your login details secure. You are
          responsible for all activity under your account. Tell us right away at {CONTACT_EMAIL}{" "}
          if you believe your account has been used without your permission.
        </p>
        <p>
          If you open a Business account, you confirm that you are authorized to act for that
          business and that its details are true and current.
        </p>
      </>
    ),
  },
  {
    id: "platform",
    title: "3. Sali Ka is a platform, not an event organizer",
    body: (
      <>
        <p>
          Sali Ka helps people discover, host, and check in to community events. Events listed
          on the Service are created and run by independent users ("Hosts"), not by Sali Ka,
          unless we clearly say otherwise.
        </p>
        <p>
          We do not organize, supervise, inspect, insure, or control these events. We do not
          verify the identity of Hosts or attendees, and we do not guarantee that any event will
          take place as described, or at all. A listing on Sali Ka is not an endorsement of the
          event, its Host, or its venue.
        </p>
      </>
    ),
  },
  {
    id: "hosts",
    title: "4. Responsibilities of Hosts",
    body: (
      <>
        <p>If you host an event, you are solely responsible for it. Among other things, you must:</p>
        <ul>
          <li>describe the event, its date, time, location, and any costs accurately;</li>
          <li>
            obtain every permit, clearance, and license the event requires, including those from
            the local government unit or barangay;
          </li>
          <li>
            take reasonable steps to keep attendees safe and comply with all applicable laws,
            including health, safety, and venue rules;
          </li>
          <li>handle any cancellations, changes, refunds, or complaints about your event; and</li>
          <li>
            protect any personal information you receive about attendees, such as names collected
            through QR check-in, and use it only for running your event, in line with the Data
            Privacy Act of 2012.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "attendees",
    title: "5. Attending events",
    body: (
      <>
        <p>
          Your decision to attend an event, and your interactions with Hosts and other attendees,
          are your own responsibility. Some activities, such as fun runs and sports, carry a risk
          of injury. Judge for yourself whether an event is right for you, follow the Host's
          instructions, and take sensible precautions.
        </p>
        <p>
          Any dispute about an event, including refunds, is between you and its Host. We may, but
          are not required to, help resolve it.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "6. Your content",
    body: (
      <>
        <p>
          You keep ownership of the content you post, such as event details, photos, and ratings.
          You give Sali Ka a non-exclusive, royalty-free, worldwide license to host, display,
          reproduce, and share that content as needed to run and promote the Service. This license
          ends when you delete the content or your account, except for copies we must keep by law.
        </p>
        <p>
          You confirm you have the rights to everything you post and that it does not infringe
          anyone's intellectual property, privacy, or other rights. We may remove any content that
          we reasonably believe breaks these Terms or the law.
        </p>
      </>
    ),
  },
  {
    id: "conduct",
    title: "7. Prohibited conduct",
    body: (
      <>
        <p>You must not use the Service to:</p>
        <ul>
          <li>post false, misleading, or fraudulent events or information;</li>
          <li>
            promote anything illegal, including gambling, drugs, weapons, or unlicensed sales;
          </li>
          <li>harass, threaten, discriminate against, or harm anyone;</li>
          <li>collect other users' personal information without their consent;</li>
          <li>
            hack, overload, scrape, or interfere with the Service, or commit any offense under the
            Cybercrime Prevention Act of 2012 (Republic Act No. 10175); or
          </li>
          <li>impersonate any person or business.</li>
        </ul>
        <p>
          You must also follow our Community By-laws, which set out in more detail how members
          are expected to behave and how we enforce these rules.
        </p>
      </>
    ),
  },
  {
    id: "fees",
    title: "8. Fees and promoted events",
    body: (
      <p>
        Using Sali Ka is currently free. If we introduce paid features, such as promoting an
        event, we will show the price and terms before you pay, and payments will be handled by a
        third-party payment provider under its own terms. Event fees charged by Hosts are set and
        collected by the Host, not by Sali Ka.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "9. Privacy and personal data",
    body: (
      <>
        <p>
          We process personal information in accordance with the Data Privacy Act of 2012
          (Republic Act No. 10173) and its implementing rules. We collect only what we need to run
          the Service, such as your name, email address, account type, the events you join or
          host, and check-in records.
        </p>
        <p>
          When you RSVP to or check in at an event, your name is shared with that event's Host. You
          have the right to be informed about, access, correct, object to the processing of, and
          request deletion of your personal information, and to file a complaint with the National
          Privacy Commission. To exercise these rights, contact us at {CONTACT_EMAIL}. Our Privacy
          Policy explains this in more detail.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "10. Third-party services",
    body: (
      <p>
        The Service may link to or rely on third-party services, such as maps, directions, and
        payment providers. We are not responsible for their content, availability, or practices,
        and your use of them is governed by their own terms.
      </p>
    ),
  },
  {
    id: "ip",
    title: "11. Our intellectual property",
    body: (
      <p>
        The Sali Ka name, logo, design, and software belong to us or our licensors and are
        protected by the Intellectual Property Code of the Philippines (Republic Act No. 8293).
        You may not copy, modify, or use them without our written permission, except as these
        Terms allow.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "12. Disclaimers",
    body: (
      <p>
        To the fullest extent permitted by law, the Service is provided "as is" and "as
        available", without warranties of any kind, whether express or implied, including
        warranties of merchantability, fitness for a particular purpose, accuracy, or
        non-infringement. We do not guarantee that the Service will be uninterrupted, secure, or
        error-free, or that event information posted by users is accurate or complete.
      </p>
    ),
  },
  {
    id: "liability",
    title: "13. Limitation of liability",
    body: (
      <>
        <p>To the fullest extent permitted by law, Sali Ka and its owners, staff, and partners are not liable for:</p>
        <ul>
          <li>
            any event listed on the Service, or anything that happens at, on the way to, or because
            of it, including injury, illness, loss, theft, or property damage;
          </li>
          <li>the acts, omissions, or content of Hosts, attendees, or other users;</li>
          <li>event cancellations, changes, or refunds; or</li>
          <li>
            any indirect, incidental, special, consequential, or exemplary damages, or lost profits,
            data, or goodwill.
          </li>
        </ul>
        <p>
          Where we are found liable, our total liability for all claims relating to the Service is
          limited to the greater of the amount you paid to Sali Ka in the six (6) months before the
          claim arose or ₱1,000.
        </p>
        <p>
          Nothing in these Terms excludes or limits any liability that cannot be excluded or
          limited under Philippine law, including liability for fraud, bad faith, or gross
          negligence, or your rights as a consumer under the Consumer Act of the Philippines
          (Republic Act No. 7394).
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "14. Indemnity",
    body: (
      <p>
        To the extent permitted by law, you agree to defend, indemnify, and hold harmless Sali Ka
        and its owners, staff, and partners from any claims, damages, losses, and expenses,
        including reasonable legal fees, arising from your breach of these Terms, your content, or
        any event you host or attend.
      </p>
    ),
  },
  {
    id: "termination",
    title: "15. Suspension and termination",
    body: (
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        close your account, or remove your events, if you break these Terms or the law, or if we
        need to in order to protect other users or the Service. Where reasonable, we will tell you
        why. Sections that by their nature should survive termination, including Sections 12 to
        18, will continue to apply.
      </p>
    ),
  },
  {
    id: "changes",
    title: "16. Changes to these Terms",
    body: (
      <p>
        We may update these Terms from time to time. If we make material changes, we will notify
        you through the Service or by email at least seven (7) days before they take effect. If
        you keep using the Service after that, you accept the updated Terms. If you do not agree,
        stop using the Service and delete your account.
      </p>
    ),
  },
  {
    id: "law",
    title: "17. Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of the Republic of the Philippines. If a dispute
        arises, please contact us first so we can try to resolve it in good faith within thirty
        (30) days. If it cannot be resolved, it will be brought exclusively before the proper
        courts of {VENUE}, Philippines, without prejudice to any remedies available to you under
        consumer protection laws.
      </p>
    ),
  },
  {
    id: "general",
    title: "18. General",
    body: (
      <p>
        These Terms, together with our Privacy Policy and Community By-laws, are the entire agreement between you and
        Sali Ka about the Service. If any part of these Terms is found invalid or unenforceable,
        the rest stays in effect. Our failure to enforce a right is not a waiver of that right. You
        may not transfer your rights under these Terms without our consent. If these Terms are
        translated, the English version prevails.
      </p>
    ),
  },
  {
    id: "contact",
    title: "19. Contact us",
    body: (
      <p>
        Questions about these Terms? Contact {OPERATOR} at {CONTACT_EMAIL} or write to us at{" "}
        {ADDRESS}.
      </p>
    ),
  },
];

export function TermsScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  return (
    <LegalPage
      screen="terms"
      title="Terms & Conditions"
      summary={[
        "Sali Ka connects people with events. Hosts, not Sali Ka, run them.",
        "Hosts are responsible for permits, safety, accuracy, and refunds.",
        "You attend events at your own discretion and risk.",
        "We protect your data under the Data Privacy Act of 2012.",
      ]}
      sections={SECTIONS}
      onNavigate={onNavigate}
    />
  );
}
