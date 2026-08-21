import Image from "next/image";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin-auth";
import {money} from "../../lib/admin-reporting";
import {getAdminContentOverview, type AdminMenuRecord} from "@/sanity/lib/admin-content";
import {AdminFrame, AdminPageHeader, EmptyState, MetricCard} from "../components/admin-ui";

export const dynamic = "force-dynamic";

function getStudioUrl() {
  const configured = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

function studioIntent(studioUrl: string | null, action: "create" | "edit", type: string, id?: string) {
  if (!studioUrl) return null;
  if (action === "create") return `${studioUrl}/intent/create/template=${encodeURIComponent(type)};type=${encodeURIComponent(type)}`;
  return id ? `${studioUrl}/intent/edit/id=${encodeURIComponent(id)};type=${encodeURIComponent(type)}` : studioUrl;
}

function updatedLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently updated";
  return `Updated ${new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London"}).format(parsed)}`;
}

function menuIssue(item: AdminMenuRecord) {
  if (!item.categorySlug) return "Category required";
  if (item.onlineOrdering && item.pricePence == null) return "Price required";
  if (item.isAlcoholic && item.onlineOrdering) return "Disable online ordering";
  return null;
}

export default async function AdminContentPage({searchParams}: {searchParams: Promise<{q?: string}>}) {
  const session = await getAdminSession("content:write");
  if (!session) redirect("/admin/login");

  const [overview, query] = await Promise.all([getAdminContentOverview(), searchParams]);
  const studioUrl = getStudioUrl();
  const search = String(query.q || "").trim().toLocaleLowerCase("en-GB");
  const menuItems = (overview?.menuItems ?? []).filter((item) => !search || `${item.name} ${item.category || ""}`.toLocaleLowerCase("en-GB").includes(search));
  const orderableItems = overview?.menuItems.filter((item) => item.available && item.onlineOrdering && item.pricePence != null && !item.isAlcoholic) ?? [];
  const unavailableItems = overview?.menuItems.filter((item) => !item.available) ?? [];
  const activePromotions = overview?.promotions.filter((promotion) => promotion.status === "active") ?? [];
  const menuIssues = overview?.menuItems.map((item) => ({item, issue: menuIssue(item)})).filter((entry) => entry.issue) ?? [];
  const promotionIssues = overview?.promotions.filter((promotion) => !promotion.poster?.url || !promotion.poster.alt) ?? [];
  const projectReady = Boolean(overview && studioUrl);
  const createDish = studioIntent(studioUrl, "create", "menuItem");
  const createPromotion = studioIntent(studioUrl, "create", "promotion");

  return <AdminFrame active="/admin/content" session={session}>
    <AdminPageHeader
      eyebrow="Website command centre"
      title="Content, made operational."
      description="See exactly what guests can browse and order, then create, update, pause, archive or delete content through the secure Malabar Coast Studio."
      actions={<>
        <Link className="adminButton isSecondary" href="/menu" target="_blank">View live menu</Link>
        {createDish && <a className="adminButton isSecondary" href={createDish} target="_blank" rel="noreferrer">Create dish</a>}
        {studioUrl ? <a className="adminButton" href={studioUrl} target="_blank" rel="noreferrer">Open Content Studio</a> : <Link className="adminButton" href="/admin/settings">Review setup</Link>}
      </>}
    />

    <section className="adminMetrics" aria-label="Published content summary">
      <MetricCard label="Published dishes" value={overview?.menuItems.length ?? 0} detail={`${overview?.categoryCount ?? 0} menu categories`} tone={overview?.menuItems.length ? "good" : undefined}/>
      <MetricCard label="Orderable now" value={orderableItems.length} detail="Available with a valid online price" tone={orderableItems.length ? "good" : undefined}/>
      <MetricCard label="Paused dishes" value={unavailableItems.length} detail="Kept in CMS, hidden from ordering" tone={unavailableItems.length ? "attention" : undefined}/>
      <MetricCard label="Active offers" value={activePromotions.length} detail={`${activePromotions.filter((promotion) => promotion.showOnHomepage).length} in homepage popup`}/>
    </section>

    {!projectReady && <section className="adminAlert isError adminContentConnection">
      <strong>Content connection needs attention.</strong> The production Sanity project or Studio URL could not be reached. Existing public fallbacks remain safe, but CRUD links are unavailable until the connection is restored.
    </section>}

    <section className="adminContentWorkflow" aria-label="Content workflow">
      <article><span>01 · Create</span><h2>Start with the right record.</h2><p>Add a dish, category, promotion, FAQ or guest testimonial using its purpose-built Studio form.</p><div>{createDish && <a href={createDish} target="_blank" rel="noreferrer">New dish</a>}{createPromotion && <a href={createPromotion} target="_blank" rel="noreferrer">New promotion</a>}</div></article>
      <article><span>02 · Read</span><h2>Know what is live.</h2><p>This dashboard reads the same published catalogue used by guests and checkout, including current prices and availability.</p><div><Link href="/menu" target="_blank">Public menu</Link><Link href="/offers" target="_blank">Public offers</Link></div></article>
      <article><span>03 · Update</span><h2>Edit with context.</h2><p>Open any record directly from the tables below, publish it, and return here to verify the guest-facing result.</p></article>
      <article><span>04 · Retire</span><h2>Pause before deleting.</h2><p>Mark dishes unavailable or promotions paused for a recoverable change. Studio also provides unpublish and delete when removal is genuinely required.</p></article>
    </section>

    <section className="adminPanel adminContentHealth">
      <div className="adminPanelHeading"><div><p>Publishing guardrails</p><h2>Content health</h2></div><b className={!menuIssues.length && !promotionIssues.length ? "isReady" : "isMissing"}>{!menuIssues.length && !promotionIssues.length ? "All clear" : `${menuIssues.length + promotionIssues.length} to review`}</b></div>
      {!menuIssues.length && !promotionIssues.length ? <p className="adminContentHealthy"><i aria-hidden="true"/>Every published dish has the catalogue information checkout requires, and every promotion has an accessible poster.</p> : <div className="adminContentIssueList">
        {menuIssues.map(({item, issue}) => <a href={studioIntent(studioUrl, "edit", "menuItem", item._id) || studioUrl || "#"} target="_blank" rel="noreferrer" key={item._id}><span>Menu</span><strong>{item.name}</strong><b>{issue}</b></a>)}
        {promotionIssues.map((promotion) => <a href={studioIntent(studioUrl, "edit", "promotion", promotion._id) || studioUrl || "#"} target="_blank" rel="noreferrer" key={promotion._id}><span>Offer</span><strong>{promotion.title}</strong><b>Poster and alt text required</b></a>)}
      </div>}
    </section>

    <section className="adminPanel adminContentCatalogue">
      <div className="adminPanelHeading"><div><p>Published catalogue</p><h2>Menu inventory</h2></div><form className="adminContentSearch"><label className="srOnly" htmlFor="content-search">Search dishes</label><input id="content-search" name="q" defaultValue={query.q || ""} placeholder="Search dish or category"/><button>Search</button>{search && <Link href="/admin/content">Clear</Link>}</form></div>
      {!menuItems.length ? <EmptyState title={search ? "No matching dishes" : "No published dishes"} detail={search ? "Try another dish or category name." : "Create and publish the first menu item in Content Studio."}/> : <div className="adminTableWrap"><table className="adminOrdersTable adminContentTable">
        <thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Availability</th><th>Ordering</th><th>Last change</th><th><span className="srOnly">Manage</span></th></tr></thead>
        <tbody>{menuItems.map((item) => {
          const issue = menuIssue(item);
          return <tr key={item._id} className={issue ? "hasContentIssue" : undefined}>
            <td><strong>{item.name}</strong><small>{item.featured ? "Featured dish" : item.isAlcoholic ? "Alcoholic item" : "Standard dish"}</small></td>
            <td><strong>{item.category || "Uncategorised"}</strong><small>{item.categorySlug || "Category link missing"}</small></td>
            <td><strong>{item.pricePence == null ? "Not set" : money(item.pricePence)}</strong><small>{item.isAlcoholic ? "Not sold online" : "Server-checked price"}</small></td>
            <td><span className={`adminContentState ${item.available ? "isLive" : "isPaused"}`}>{item.available ? "Available" : "Paused"}</span>{issue && <small className="adminContentIssue">{issue}</small>}</td>
            <td><span className={`adminContentState ${item.onlineOrdering && !item.isAlcoholic ? "isLive" : "isNeutral"}`}>{item.onlineOrdering && !item.isAlcoholic ? "Enabled" : "Disabled"}</span></td>
            <td><small>{updatedLabel(item.updatedAt)}</small></td>
            <td><a className="adminRowLink" href={studioIntent(studioUrl, "edit", "menuItem", item._id) || studioUrl || "#"} target="_blank" rel="noreferrer">Edit / retire</a></td>
          </tr>;
        })}</tbody>
      </table></div>}
    </section>

    <section className="adminSplitGrid adminContentLowerGrid">
      <article className="adminPanel adminPromotionAdmin">
        <div className="adminPanelHeading"><div><p>Offers and posters</p><h2>Promotion library</h2></div>{createPromotion && <a href={createPromotion} target="_blank" rel="noreferrer">Create offer</a>}</div>
        {!overview?.promotions.length ? <EmptyState title="No promotions yet" detail="Create a poster-led offer and publish it when the restaurant is ready."/> : <div className="adminPromotionRows">{overview.promotions.map((promotion) => <a href={studioIntent(studioUrl, "edit", "promotion", promotion._id) || studioUrl || "#"} target="_blank" rel="noreferrer" key={promotion._id}>
          <span className="adminPromotionThumb">{promotion.poster?.url ? <Image src={promotion.poster.url} alt="" fill sizes="64px"/> : <b>No poster</b>}</span>
          <span><strong>{promotion.title}</strong><small>{promotion.showOnHomepage ? "Offers page · homepage popup" : "Offers page only"}</small></span>
          <b className={`adminContentState ${promotion.status === "active" ? "isLive" : "isPaused"}`}>{promotion.status}</b>
        </a>)}</div>}
      </article>

      <article className="adminPanel adminWebsiteSurfaces">
        <div className="adminPanelHeading"><div><p>Pages and trust content</p><h2>Website surfaces</h2></div></div>
        <div className="adminSurfaceRows">
          <a href={studioIntent(studioUrl, "edit", "siteSettings", "siteSettings") || studioUrl || "#"} target="_blank" rel="noreferrer"><span>Brand & contact</span><strong>{overview?.hasSiteSettings ? "Connected" : "Needs setup"}</strong></a>
          <a href={studioIntent(studioUrl, "edit", "menuPage", "menuPage") || studioUrl || "#"} target="_blank" rel="noreferrer"><span>Menu storytelling</span><strong>{overview?.hasMenuPage ? "Connected" : "Needs setup"}</strong></a>
          {overview?.pages.map((page) => <a href={studioIntent(studioUrl, "edit", page._type, page._id) || studioUrl || "#"} target="_blank" rel="noreferrer" key={page._id}><span>{page.title}</span><small>{page.pageKey} · {updatedLabel(page.updatedAt)}</small></a>)}
          <a href={studioUrl || "#"} target="_blank" rel="noreferrer"><span>FAQs</span><strong>{overview?.faqCount ?? 0}</strong></a>
          <a href={studioUrl || "#"} target="_blank" rel="noreferrer"><span>Testimonials</span><strong>{overview?.testimonialCount ?? 0}</strong></a>
        </div>
      </article>
    </section>
  </AdminFrame>;
}
