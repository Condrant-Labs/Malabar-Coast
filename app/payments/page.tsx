import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Payments & Website Terms",
  description: "Malabar Coast terms for online ordering, payments, website use and related services.",
  alternates: { canonical: "/payments" },
};

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <p>This website is operated by Malabar Coast. Throughout the Site, “we”, “us” and “our” refer to Malabar Coast. We provide this website, including its information, ordering tools and services, subject to your acceptance of the terms, conditions, policies and notices stated here.</p>
        <p>By visiting the Site or purchasing from us, you engage in our service and agree to these Terms of Service, including policies referenced here. These Terms apply to all users of the Site. Please read them carefully. If you do not agree, you must not access the Site or use its services.</p>
        <p>New features or tools added to the Site will also be subject to these Terms. We may update these Terms by publishing changes on this page. Your continued use of the Site after a change constitutes acceptance of the updated Terms.</p>
        <p>Online card payments are completed on secure hosted pages provided by <strong>Stripe</strong> or <strong>Worldpay</strong>. Full card details do not enter or remain in the Malabar Coast application.</p>
      </>
    ),
  },
  {
    id: "online-store",
    title: "Online ordering terms",
    content: (
      <>
        <p>By agreeing to these Terms, you represent that you are legally able to enter into a contract in your jurisdiction. You may not use our products or services for an illegal or unauthorised purpose, or violate applicable law while using the Site.</p>
        <p>You must not transmit malware, destructive code, or material intended to interfere with the Site. A breach of these Terms may result in immediate termination of access to the services.</p>
      </>
    ),
  },
  {
    id: "general-conditions",
    title: "General conditions",
    content: (
      <>
        <p>We reserve the right to refuse service where reasonably necessary, including to protect customers, staff, the Site, or comply with law.</p>
        <p>Information you submit, excluding card details handled by the hosted payment provider, may be transmitted across networks and adapted to technical requirements. Payment providers encrypt card information during transfer under their own security controls.</p>
        <p>You may not reproduce, duplicate, copy, sell, resell or exploit any portion of the service or access to it without our express written permission. Headings are included for convenience and do not limit these Terms.</p>
      </>
    ),
  },
  {
    id: "information-accuracy",
    title: "Accuracy, completeness and timeliness",
    content: (
      <>
        <p>We take reasonable care to keep Site information accurate and current, but general information should not be treated as the sole basis for a decision where more complete or timely information is required. Reliance on Site material is at your own risk, subject always to rights that cannot legally be excluded.</p>
        <p>Historical information is provided for reference. We may modify Site content and will make legally required updates, but we do not undertake to update every non-material item immediately.</p>
      </>
    ),
  },
  {
    id: "service-prices",
    title: "Changes to services and prices",
    content: (
      <>
        <p>Prices and availability may change without advance notice before an order is placed. The price confirmed at checkout applies to that order unless there is an obvious error.</p>
        <p>We may modify, suspend or discontinue parts of the Site. Nothing in this section limits rights relating to an order we have already accepted.</p>
      </>
    ),
  },
  {
    id: "products-services",
    title: "Products and services",
    content: (
      <>
        <p>Products or services offered online may have limited availability and are subject to our <Link href="/returns">Returns & Cancellations Policy</Link>. We make reasonable efforts to display descriptions and images accurately, but screens and photography can affect appearance.</p>
        <p>We may limit sales by person, household, order, region or jurisdiction where reasonably necessary. We may limit quantities, change descriptions or pricing before purchase, or discontinue an item. Offers are void where prohibited.</p>
        <p>Nothing in these Terms excludes our obligation to provide goods that meet applicable consumer-law standards.</p>
      </>
    ),
  },
  {
    id: "billing-orders",
    title: "Billing and order information",
    content: (
      <>
        <p>We may refuse, limit or cancel an order where there is an obvious pricing or availability error, suspected fraud, misuse, or another lawful reason. If we change or cancel an accepted order, we will use the contact details supplied with the order and provide any refund due.</p>
        <p>You agree to provide current, complete and accurate order and contact information so we can process payment, fulfil the order and contact you when necessary. See our <Link href="/returns">Returns & Cancellations Policy</Link> for remedies and refunds.</p>
      </>
    ),
  },
  {
    id: "payment-processing",
    title: "Payment processing",
    content: (
      <>
        <p>You can choose an available hosted checkout provider at checkout. Stripe or Worldpay collects card details, performs any required cardholder authentication, and returns a payment result to us. We use signed provider notifications and authenticated checks to confirm payment status.</p>
        <p>An order is not treated as paid merely because a browser reaches a success page. Our records must receive or verify successful confirmation from the payment provider. If payment is refused, cancelled, expires or cannot be verified, the order will not move into paid fulfilment.</p>
        <p>Charges are shown in pounds sterling unless stated otherwise. Your card issuer may apply its own terms, checks or fees.</p>
      </>
    ),
  },
  {
    id: "optional-tools",
    title: "Optional third-party tools",
    content: (
      <>
        <p>We may provide access to third-party tools that we do not control. Those tools may be offered “as is” and “as available” under the provider’s own terms. You should review and approve those terms before using them.</p>
        <p>Future features and services introduced through the Site will also be subject to these Terms.</p>
      </>
    ),
  },
  {
    id: "third-party-links",
    title: "Third-party links",
    content: (
      <>
        <p>The Site may link to third-party websites or services. We are not responsible for examining or guaranteeing their content, accuracy, policies, products or services.</p>
        <p>Please review a third party’s policies before transacting with it. Complaints about a third-party product or service should be directed to that provider, without affecting any legal claim you may have against us.</p>
      </>
    ),
  },
  {
    id: "submissions",
    title: "Comments, feedback and submissions",
    content: (
      <>
        <p>If you send ideas, suggestions, proposals or other material, you grant us permission to use and adapt that material for our business unless we agree otherwise in writing. We are not obliged to keep unsolicited submissions confidential, compensate you, or respond.</p>
        <p>We may monitor, edit or remove content we reasonably consider unlawful, offensive, threatening, defamatory, obscene, infringing or otherwise in breach of these Terms.</p>
        <p>Your submissions must not violate another person’s rights, contain unlawful or abusive material, contain malware, or mislead us about their origin. You are responsible for the accuracy and legality of what you submit.</p>
      </>
    ),
  },
  {
    id: "personal-information",
    title: "Personal information",
    content: <p>Personal information submitted through the Site is handled under our <Link href="/privacy">Privacy Policy</Link>. Card details are handled directly by the selected hosted payment provider.</p>,
  },
  {
    id: "errors",
    title: "Errors, inaccuracies and omissions",
    content: (
      <>
        <p>Site information may occasionally contain typographical errors, inaccuracies or omissions relating to descriptions, pricing, offers, delivery charges, timing or availability.</p>
        <p>We may correct errors, update information or cancel an affected order where lawful, including after submission. If we cancel an order you have paid for, we will return the amount due. We will make updates required by law but are not obliged to refresh every item merely because another part of the Site changes.</p>
      </>
    ),
  },
  {
    id: "prohibited-uses",
    title: "Prohibited uses",
    content: (
      <>
        <p>You must not use the Site or its content to:</p>
        <ul>
          <li>commit, solicit or assist unlawful activity;</li>
          <li>infringe intellectual property, privacy or other legal rights;</li>
          <li>harass, abuse, threaten, defame or unlawfully discriminate;</li>
          <li>submit false or misleading information;</li>
          <li>upload malware or interfere with the Site, another website or the internet;</li>
          <li>collect or track personal information unlawfully, spam, phish, scrape, or bypass security controls.</li>
        </ul>
        <p>We may terminate access for a material violation of these restrictions.</p>
      </>
    ),
  },
  {
    id: "warranties-liability",
    title: "Service availability and liability",
    content: (
      <>
        <p>We do not guarantee that the Site will always be uninterrupted, timely or error-free. We may suspend it for maintenance or operational reasons.</p>
        <p>Nothing in these Terms excludes or limits liability where doing so would be unlawful, including liability for death or personal injury caused by negligence, fraud, or your statutory consumer rights. Subject to that, we are not responsible for losses that were not reasonably foreseeable when the contract was formed, or for business losses arising from consumer use of the Site.</p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "Responsibility for breach",
    content: <p>To the extent permitted by law, you are responsible for losses and reasonable costs caused by your unlawful use of the Site, your material breach of these Terms, or your violation of another person’s rights.</p>,
  },
  {
    id: "severability",
    title: "Severability",
    content: <p>If a provision of these Terms is found unlawful, void or unenforceable, it will be limited or severed only to the extent necessary. The remaining provisions will continue in effect.</p>,
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <p>Obligations and liabilities incurred before termination survive where their nature requires it. You may stop using the Site at any time.</p>
        <p>If you materially breach these Terms, we may restrict or terminate access where lawful. Termination does not remove payment or other obligations already incurred.</p>
      </>
    ),
  },
  {
    id: "entire-agreement",
    title: "Entire agreement",
    content: <p>These Terms and the policies they incorporate form the agreement governing your use of the Site, alongside any order-specific terms presented at checkout. A failure to enforce a provision immediately is not a waiver of that provision.</p>,
  },
  {
    id: "governing-law",
    title: "Governing law",
    content: <p>These Terms and contracts formed through the Site are governed by the laws applicable in Scotland. If you are a consumer, you retain any mandatory protections and rights to bring proceedings available to you under applicable law.</p>,
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: <p>You can review the current version on this page. We may update these Terms by publishing a revised version. Changes will apply from publication unless another date is stated and will not unfairly remove rights relating to an order already accepted.</p>,
  },
  {
    id: "messages",
    title: "Service and marketing messages",
    content: (
      <>
        <p>We may send necessary transactional messages about an order using the contact details you provide. These messages are part of providing the service.</p>
        <p>If optional email or SMS marketing is introduced, we will only send it where there is a valid legal basis and will provide an appropriate way to unsubscribe. Consent to marketing is not a condition of purchase. See our <Link href="/privacy">Privacy Policy</Link>.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact information",
    content: <p>Questions about payments or these Terms should be sent to <a href="mailto:reservations@malabarcoast.co.uk">reservations@malabarcoast.co.uk</a> or by post to Malabar Coast, 33 Main Street, Holytown, ML1 4TH, United Kingdom.</p>,
  },
];

export default function PaymentsPage() {
  return <LegalPage eyebrow="Secure checkout · Website terms" title="Payments & terms" summary="The terms governing online ordering, hosted card payments, use of this website and related customer services." sections={sections} />;
}
