import { redirect } from "next/navigation";
import { getAdminSession, isAdminConfigured } from "../../lib/admin-auth";
import { isProductionOrderAccessConfigured } from "../../lib/order-access";
import { isDurableOrderStorageConfigured } from "../../lib/order-store";
import { isStripeConfigured } from "../../lib/payments/stripe";
import { isWorldpayCheckoutEnabled, isWorldpayWebhookSignatureConfigured } from "../../lib/payments/worldpay";
import { AdminFrame, AdminPageHeader } from "../components/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const canonicalReady = (() => { try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").protocol === "https:"; } catch { return false; } })();
  const checks = [
    { label: "Administrator authentication", ready: isAdminConfigured(), detail: "Signed, HTTP-only session with scrypt password verification" },
    { label: "Durable order database", ready: isDurableOrderStorageConfigured(), detail: "Supabase server-secret connection for private order access" },
    { label: "Customer order privacy", ready: isProductionOrderAccessConfigured(), detail: "Signed access grants prevent order-reference enumeration" },
    { label: "Stripe hosted checkout", ready: isStripeConfigured(), detail: "Hosted Checkout, authenticated queries and signed webhook reconciliation" },
    { label: "Worldpay hosted checkout", ready: isWorldpayCheckoutEnabled(), detail: "Hosted Payment Pages with API credentials and merchant entity" },
    { label: "Worldpay signed events", ready: isWorldpayWebhookSignatureConfigured(), detail: "Raw-body HMAC verification for payment lifecycle events" },
    { label: "Secure production origin", ready: canonicalReady, detail: "HTTPS canonical origin for secure cookies and return URLs" },
  ];
  const ready = checks.filter((check) => check.ready).length;

  return <AdminFrame active="/admin/settings" csrfToken={session.csrfToken}>
    <AdminPageHeader eyebrow="Deployment and security" title="A system you can trust." description="A read-only operational view of the environment contract. Secrets are never rendered in this portal." />
    <section className="adminSystemScore"><div><span>Production readiness</span><strong>{ready}<small> / {checks.length}</small></strong><p>{ready === checks.length ? "All required controls report ready." : `${checks.length - ready} control${checks.length - ready === 1 ? " needs" : "s need"} deployment attention.`}</p></div><i style={{ "--score": `${ready / checks.length * 100}%` } as React.CSSProperties}><b>{Math.round(ready / checks.length * 100)}%</b></i></section>
    <section className="adminPanel">
      <div className="adminPanelHeading"><div><p>Environment contract</p><h2>Readiness checks</h2></div><span>No secret values displayed</span></div>
      <div className="adminChecks">{checks.map((check) => <article key={check.label} className={check.ready ? "isReady" : "isMissing"}><i aria-hidden="true" /><div><strong>{check.label}</strong><span>{check.detail}</span></div><b>{check.ready ? "Ready" : "Action needed"}</b></article>)}</div>
    </section>
    <section className="adminPanel adminSystemNotes">
      <div className="adminPanelHeading"><div><p>Operational contract</p><h2>What this portal protects</h2></div></div>
      <div><article><span>01</span><h3>Payment truth</h3><p>Signed provider webhooks and authenticated provider queries establish payment state. Staff operate fulfilment only after payment is confirmed.</p></article><article><span>02</span><h3>Customer privacy</h3><p>Orders and personal details are fetched only on the server through the service role, with no public table policies.</p></article><article><span>03</span><h3>Auditable progress</h3><p>Every fulfilment transition is validated atomically in the database and added to the order’s status history.</p></article></div>
    </section>
  </AdminFrame>;
}
