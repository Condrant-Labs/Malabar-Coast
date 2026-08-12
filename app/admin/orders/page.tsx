import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { listOrdersForReport } from "../../lib/order-store";
import { orderStatusLabels, type OrderStatus } from "../../lib/orders";
import { AdminFrame, AdminPageHeader, OrderTable } from "../components/admin-ui";
import { RealtimePageRefresh } from "../components/realtime-page-refresh";

export const dynamic = "force-dynamic";
const pageSize = 25;

type Search = { q?: string; status?: string; fulfilment?: string; provider?: string; page?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const query = await searchParams;
  const q = (query.q || "").trim().toLowerCase().slice(0, 160);
  const status = Object.prototype.hasOwnProperty.call(orderStatusLabels, query.status || "") ? query.status as OrderStatus : "";
  const fulfilment = query.fulfilment === "collection" || query.fulfilment === "delivery" ? query.fulfilment : "";
  const provider = query.provider === "stripe" || query.provider === "worldpay" ? query.provider : "";
  const allOrders = await listOrdersForReport(undefined, undefined, {
    statuses: status ? [status] : undefined,
    fulfilment: fulfilment || undefined,
    provider: provider || undefined,
  });
  const filtered = allOrders.filter((order) => {
    if (!q) return true;
    const haystack = [order.id, order.customer.name, order.customer.email, order.customer.phone, order.requestedTime, ...order.lines.map((line) => line.name)].join(" ").toLowerCase();
    return haystack.includes(q);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(pages, Math.max(1, Number.parseInt(query.page || "1", 10) || 1));
  const orders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const currentParams = new URLSearchParams();
  if (q) currentParams.set("q", q);
  if (status) currentParams.set("status", status);
  if (fulfilment) currentParams.set("fulfilment", fulfilment);
  if (provider) currentParams.set("provider", provider);
  const returnTo = `/admin/orders${currentParams.size ? `?${currentParams}` : ""}`;
  const pageHref = (page: number) => {
    const params = new URLSearchParams(currentParams);
    params.set("page", String(page));
    return `/admin/orders?${params}`;
  };
  const realtimeUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const realtimePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  return <AdminFrame active="/admin/orders" csrfToken={session.csrfToken}>
    <AdminPageHeader eyebrow="Order management" title="Every order, under control." description="Search customer and dish details, isolate exceptions, and advance paid orders without leaving the list." actions={<><RealtimePageRefresh supabaseUrl={realtimeUrl} publishableKey={realtimePublishableKey} /><Link className="adminButton" href="/admin/kitchen">Kitchen board</Link></>} />
    <section className="adminPanel adminFilterPanel">
      <form method="get" action="/admin/orders" className="adminFilters">
        <label className="adminSearchField"><span>Search</span><input name="q" defaultValue={q} placeholder="Order, customer, email, phone or dish" /></label>
        <label><span>Status</span><select name="status" defaultValue={status}><option value="">All statuses</option>{Object.entries(orderStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label><span>Method</span><select name="fulfilment" defaultValue={fulfilment}><option value="">All methods</option><option value="collection">Collection</option><option value="delivery">Delivery</option></select></label>
        <label><span>Payment</span><select name="provider" defaultValue={provider}><option value="">All providers</option><option value="stripe">Stripe</option><option value="worldpay">Worldpay</option></select></label>
        <button className="adminButton" type="submit">Apply filters</button>
        {(q || status || fulfilment || provider) && <Link className="adminTextButton" href="/admin/orders">Clear</Link>}
      </form>
    </section>
    <section className="adminPanel">
      <div className="adminPanelHeading"><div><p>Order register</p><h2>{filtered.length} matching order{filtered.length === 1 ? "" : "s"}</h2></div><span>Newest first · complete register</span></div>
      <OrderTable orders={orders} csrfToken={session.csrfToken} returnTo={returnTo} />
      {pages > 1 && <nav className="adminPagination" aria-label="Order pages">
        <Link href={pageHref(Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1}>Previous</Link><span>Page {currentPage} of {pages}</span><Link href={pageHref(Math.min(pages, currentPage + 1))} aria-disabled={currentPage === pages}>Next</Link>
      </nav>}
    </section>
  </AdminFrame>;
}
