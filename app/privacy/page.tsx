import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Malabar Coast collects, uses, shares and protects personal data under UK data protection law.",
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Privacy policy",
    content: <p>This Privacy Policy explains how MalabarCoast.co.uk (“we”, “us”, “our”), trading as Malabar Coast, collects, uses, shares and protects your personal data. We handle personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the Privacy and Electronic Communications Regulations (PECR). Please read it alongside our <Link href="/cookie">Cookie Policy</Link>.</p>,
  },
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <>
        <p>The data controller responsible for your personal data is Malabar Coast.</p>
        <p><strong>Address:</strong> 33 Main Street, Holytown, ML1 4TH, United Kingdom<br /><strong>Email:</strong> <a href="mailto:reservations@malabarcoast.co.uk">reservations@malabarcoast.co.uk</a></p>
        <p>For any privacy question, to exercise your rights, or to make a complaint, please contact us using the details above.</p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "The personal data we collect",
    content: (
      <ul>
        <li><strong>Order data</strong> — name, email, phone number, order details, collection or delivery information, and payment confirmation. We do not store full card details.</li>
        <li><strong>Table reservation data</strong> — contact details, date, arrival time, party size, occasion, dietary information, accessibility requirements and booking notes.</li>
        <li><strong>Hall enquiry data</strong> — contact details, preferred and alternative dates, estimated guest count, occasion, contact preference and the event information you provide.</li>
        <li><strong>Communications & support data</strong> — messages you send us by email, phone or another available contact channel, plus feedback or reviews you provide.</li>
        <li><strong>Marketing preferences</strong> — your consent choices and how you engage with messages, if marketing subscriptions are introduced.</li>
        <li><strong>Device & usage data</strong> — technical request and security information. Additional analytics or advertising data would only be collected after valid consent.</li>
        <li><strong>Delivery data</strong> — delivery address, chosen date or slot, and any delivery instructions you submit.</li>
      </ul>
    ),
  },
  {
    id: "lawful-bases",
    title: "How and why we use your personal data",
    content: (
      <>
        <p>We must have a lawful basis under the UK GDPR for using personal data. We rely on the following:</p>
        <div className="legalTableWrap"><table className="legalTable"><thead><tr><th>What we do</th><th>Lawful basis</th></tr></thead><tbody>
          <tr><td>Process and fulfil orders, take payment, provide confirmations and customer support.</td><td>Performance of our contract with you.</td></tr>
          <tr><td>Send service messages about an order or delivery.</td><td>Contract; our legitimate interest in keeping you informed.</td></tr>
          <tr><td>Manage table reservations, hall enquiries and related service messages.</td><td>Steps taken at your request; performance of a contract where a booking is confirmed; our legitimate interest in operating the restaurant.</td></tr>
          <tr><td>Send marketing messages, if offered.</td><td>Your consent, which you can withdraw at any time.</td></tr>
          <tr><td>Set non-essential analytics or advertising storage, if introduced.</td><td>Your consent.</td></tr>
          <tr><td>Operate, secure and improve the Site, prevent fraud and keep business records.</td><td>Our legitimate interests; legal obligations.</td></tr>
          <tr><td>Meet legal, tax and regulatory requirements.</td><td>Compliance with a legal obligation.</td></tr>
        </tbody></table></div>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    content: <p>We use storage that is strictly necessary for basket, checkout, security and order-access functions. If non-essential analytics or advertising tools are introduced, they will remain off until you consent. See our <Link href="/cookie">Cookie Policy</Link> for current details.</p>,
  },
  {
    id: "sharing",
    title: "Who we share your personal data with",
    content: (
      <>
        <p>We do not sell personal data. We share it only with trusted service providers acting on our instructions, where needed to provide the service, or where required by law. These may include:</p>
        <ul>
          <li><strong>Stripe</strong> — secure hosted payment processing and payment-status confirmation.</li>
          <li><strong>Supabase</strong> — secure database and application services used to store and process order records.</li>
          <li><strong>Brevo</strong> — transactional email delivery for order, table reservation and hall enquiry messages.</li>
          <li><strong>Delivery partners</strong> — where needed to fulfil a delivery order.</li>
          <li><strong>Professional and regulatory recipients</strong> — where necessary to comply with law or establish, exercise or defend legal rights.</li>
        </ul>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "International transfers",
    content: <p>Some service providers may process data outside the UK. Where personal data is transferred internationally, we use an applicable lawful safeguard, such as UK adequacy regulations, the UK Extension to the EU–US Data Privacy Framework, or approved contractual protections.</p>,
  },
  {
    id: "retention",
    title: "How long we keep personal data",
    content: <p>We keep personal data only for as long as necessary for the purposes above. Order and transaction records are generally retained for up to seven years to meet tax and accounting obligations. Reservation and enquiry details are retained only for operational, dispute and record-keeping needs, then deleted or anonymised under the restaurant&apos;s approved retention schedule. Consent records are retained for as long as needed to demonstrate and honour your choice.</p>,
  },
  {
    id: "security",
    title: "Data security",
    content: <p>We use appropriate technical and organisational measures to protect personal data, including hosted payment pages so card details do not enter this application. No internet transmission is completely secure, but once we receive data we apply controls intended to prevent unauthorised access, alteration or disclosure.</p>,
  },
  {
    id: "marketing",
    title: "Marketing",
    content: <p>We will only send optional marketing messages where there is a valid legal basis, normally your consent. Any marketing message will provide an appropriate way to unsubscribe. Opting out of marketing does not affect necessary service messages about an order you placed.</p>,
  },
  {
    id: "rights",
    title: "Your rights",
    content: (
      <>
        <p>Under the UK GDPR, you may have the right to be informed; access your data; correct inaccurate data; request erasure; restrict or object to processing; receive portable data; and withdraw consent where we rely on it. You also have rights relating to solely automated decisions that significantly affect you; we do not currently carry out that type of decision-making.</p>
        <p>To exercise a right, email <a href="mailto:reservations@malabarcoast.co.uk">reservations@malabarcoast.co.uk</a>. We will normally respond within one month. Rights can be subject to legal exemptions, and we may retain information where the law requires or permits us to do so.</p>
      </>
    ),
  },
  {
    id: "required-data",
    title: "If you do not provide personal data",
    content: <p>Some information is necessary for us to take payment, fulfil an order, reserve a table or respond to a hall enquiry. If you choose not to provide it, we may be unable to provide the relevant service.</p>,
  },
  {
    id: "children",
    title: "Children",
    content: <p>The Site and online ordering service are intended for people aged 18 or over. We do not knowingly collect personal data from children. If you believe a child has provided personal data, please contact us.</p>,
  },
  {
    id: "complaints",
    title: "Complaints",
    content: <p>Please contact us first at <a href="mailto:reservations@malabarcoast.co.uk">reservations@malabarcoast.co.uk</a> so we can try to resolve your concern. You also have the right to complain to the UK Information Commissioner’s Office through its <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">complaints service</a> or by calling 0303 123 1113.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: <p>We may update this policy for legal, operational or regulatory reasons. We will publish material changes on this page and update the review date.</p>,
  },
];

export default function PrivacyPage() {
  return <LegalPage eyebrow="Personal data · UK GDPR" title="Privacy policy" summary="How Malabar Coast collects, uses, shares and protects personal data when you browse, order or contact us." sections={sections} />;
}
