import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Malabar Coast uses cookies and similar storage technologies on malabarcoast.co.uk.",
  alternates: { canonical: "/cookie" },
};

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Cookie policy",
    content: <p>This Cookie Policy explains how malabarcoast.co.uk, trading as Malabar Coast, uses cookies and similar technologies on the Site. It should be read together with our <Link href="/privacy">Privacy Policy</Link>.</p>,
  },
  {
    id: "what-are-cookies",
    title: "What are cookies?",
    content: <p>Cookies are small text files placed on your device when you visit a website. Similar technologies include pixels, tags and local storage. They can help a site work, remember your preferences, keep checkout secure, and—where you consent—help a business understand and improve how its site is used.</p>,
  },
  {
    id: "categories",
    title: "How we categorise cookies",
    content: (
      <ul>
        <li><strong>Strictly necessary</strong> — required for the Site to function, remember your basket, enable secure checkout or order access, and keep the Site safe. These are always active and do not require consent.</li>
        <li><strong>Analytics & performance</strong> — help us understand how the Site is used so it can be improved. These must remain off unless you actively consent.</li>
        <li><strong>Marketing & advertising</strong> — help measure campaigns or deliver relevant advertising. These must remain off unless you actively consent.</li>
      </ul>
    ),
  },
  {
    id: "choices",
    title: "Your choices & consent",
    content: (
      <>
        <p>The current Site uses essential storage for features such as the basket, secure administration, checkout and protected order access. The application does not currently load the Google Analytics, Microsoft Clarity, Meta, TikTok or Google Ads tracking tools described in earlier versions of this policy.</p>
        <p>If we introduce analytics or marketing technologies, they will be switched off by default and will only be set after a clear, positive choice. You will be able to accept, decline, change or withdraw that choice with equal ease.</p>
        <p>You can also manage cookies through your browser settings. Blocking strictly necessary cookies or storage may prevent parts of the Site from working correctly.</p>
      </>
    ),
  },
  {
    id: "cookies-used",
    title: "The storage we use",
    content: (
      <ul>
        <li><strong>Basket and interface storage</strong> — remembers items you add and limited interface preferences on your device.</li>
        <li><strong>Order-access storage</strong> — helps keep customer order pages private after checkout.</li>
        <li><strong>Security and administration cookies</strong> — support secure, authenticated access to restricted staff areas.</li>
        <li><strong>Payment-provider storage</strong> — Stripe or Worldpay may set essential storage on their hosted checkout pages under their own policies.</li>
      </ul>
    ),
  },
  {
    id: "updates",
    title: "Changes to this policy",
    content: <p>The exact technologies in use can change as the Site develops. We will review this policy and update the list, purposes and available controls before enabling any new non-essential category.</p>,
  },
  {
    id: "more-information",
    title: "More information",
    content: <p>For details of how we handle personal data and your rights, read our <Link href="/privacy">Privacy Policy</Link> or email <a href="mailto:reservations@malabarcoast.co.uk">reservations@malabarcoast.co.uk</a>.</p>,
  },
];

export default function CookiePage() {
  return <LegalPage eyebrow="Your device · Your choice" title="Cookie policy" summary="What the site stores on your device, why essential storage is needed, and how consent will work before any optional tracking is enabled." sections={sections} />;
}
