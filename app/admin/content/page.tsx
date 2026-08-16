import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { AdminFrame, AdminPageHeader } from "../components/admin-ui";

export const dynamic = "force-dynamic";

function getStudioUrl() {
  const configured = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function AdminContentPage() {
  const session = await getAdminSession("content:write");
  if (!session) redirect("/admin/login");

  const studioUrl = getStudioUrl();
  const projectReady = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "x3srlrl4"
    && process.env.NEXT_PUBLIC_SANITY_DATASET === "production";

  return <AdminFrame active="/admin/content" session={session}>
    <AdminPageHeader
      eyebrow="Website content"
      title="Your website, in your hands."
      description="Open the secure Malabar Coast Content Studio to update menu items, prices, availability, imagery, page copy, contact details and social links."
      actions={studioUrl
        ? <a className="adminButton" href={studioUrl} target="_blank" rel="noreferrer">Open Content Studio</a>
        : <Link className="adminButton isSecondary" href="/admin/settings">Review setup</Link>}
    />

    <section className="adminContentGrid" aria-label="Content management areas">
      <article className="adminPanel"><span>01</span><h2>Menu & ordering</h2><p>Edit categories, dishes, descriptions, prices, dietary labels, availability and whether an item can be ordered online.</p></article>
      <article className="adminPanel"><span>02</span><h2>Pages & imagery</h2><p>Manage homepage and restaurant copy, section images, calls to action, SEO details, testimonials and frequently asked questions.</p></article>
      <article className="adminPanel"><span>03</span><h2>Brand & contact</h2><p>Update logos, address, telephone, email, opening hours, announcements and social media links from one place.</p></article>
    </section>

    <section className="adminPanel adminStudioStatus">
      <div className="adminPanelHeading"><div><p>Connection</p><h2>Content Studio status</h2></div><b className={projectReady && studioUrl ? "isReady" : "isMissing"}>{projectReady && studioUrl ? "Ready" : "Action needed"}</b></div>
      <div>
        <p><strong>Sanity project</strong><span>{projectReady ? "Connected to Malabar Coast production content." : "Project or dataset configuration is missing."}</span></p>
        <p><strong>Studio access</strong><span>{studioUrl ? "The standalone editor is linked from this admin page." : "Set NEXT_PUBLIC_SANITY_STUDIO_URL to the deployed Studio address."}</span></p>
        <p><strong>Publishing</strong><span>Only published changes appear publicly; the website keeps safe checked-in fallbacks if Sanity is temporarily unavailable.</span></p>
      </div>
    </section>
  </AdminFrame>;
}
