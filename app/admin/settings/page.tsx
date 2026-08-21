import { redirect } from "next/navigation";
import { checkAdminAuthSchema, getAdminSession } from "../../lib/admin-auth";
import { isProductionOrderAccessConfigured } from "../../lib/order-access";
import { isDurableOrderStorageConfigured } from "../../lib/order-store";
import { isStripeConfigured } from "../../lib/payments/stripe";
import { checkBrevoConnection } from "../../lib/email/brevo";
import { getAdminContentOverview } from "../../../sanity/lib/admin-content";
import { AdminFrame, AdminPageHeader } from "../components/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession("settings:read");
  if (!session) redirect("/admin/login");
  const [adminAuthReady, brevoReady, contentOverview] = await Promise.all([
    checkAdminAuthSchema(),
    checkBrevoConnection(),
    getAdminContentOverview(),
  ]);
  const canonicalReady = (() => { try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").protocol === "https:"; } catch { return false; } })();
  const studioReady = (() => {
    try {
      const studioUrl = new URL(process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "");
      return Boolean(contentOverview && (studioUrl.protocol === "https:" || studioUrl.protocol === "http:"));
    } catch {
      return false;
    }
  })();
  const checks = [
    { label: "Administrator authentication", ready: adminAuthReady, detail: "Supabase Auth identity, active staff profile, roles, session revocation and audit log" },
    { label: "Durable order database", ready: isDurableOrderStorageConfigured(), detail: "Supabase server-secret connection for private order access" },
    { label: "Customer order privacy", ready: isProductionOrderAccessConfigured(), detail: "Signed access grants prevent order-reference enumeration" },
    { label: "Stripe hosted checkout", ready: isStripeConfigured(), detail: "Hosted Checkout, authenticated queries and signed webhook reconciliation" },
    { label: "Brevo transactional email", ready: brevoReady, detail: "Authenticated API reachability plus idempotent customer and owner notices" },
    { label: "Sanity content operations", ready: studioReady, detail: "Published-content read access and a valid Studio destination for safe editing" },
    { label: "Secure production origin", ready: canonicalReady, detail: "HTTPS canonical origin for secure cookies and return URLs" },
  ];
  const ready = checks.filter((check) => check.ready).length;

  return <AdminFrame active="/admin/settings" session={session}>
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
