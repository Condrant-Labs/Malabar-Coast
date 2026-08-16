import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../lib/admin-auth";
import { adminCan } from "../lib/admin-permissions";
import { activeOrderStatuses, getReportRange, money, requestedToday, summariseOrders } from "../lib/admin-reporting";
import { listOrdersForReport, listOrdersPage } from "../lib/order-store";
import { orderStatusLabels } from "../lib/orders";
import { AdminFrame, AdminPageHeader, MetricCard, StatusBadge } from "./components/admin-ui";
import { LiveRecentOrders } from "./components/live-recent-orders";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession("dashboard:read");
  if (!session) redirect("/admin/login");
  const range = getReportRange("30d");
  const [recentOrders, reportingOrders, liveOrders] = await Promise.all([
    listOrdersPage({ limit: 500 }),
    listOrdersForReport(range.from, range.to),
    listOrdersForReport(undefined, undefined, { statuses: activeOrderStatuses }),
  ]);
  const report = summariseOrders(reportingOrders);
  const todayOrders = recentOrders.filter((order) => requestedToday(order));
  const flow = ["paid", "confirmed", "preparing", "ready", "out_for_delivery"] as const;
  const realtimeUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const realtimePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  return <AdminFrame active="/admin" session={session}>
    <AdminPageHeader
      eyebrow="Live restaurant overview"
      title="Good service starts here."
      description="A clear view of today’s kitchen, order demand and confirmed online sales."
      actions={<><Link className="adminButton isSecondary" href="/admin/content">Edit website</Link><Link className="adminButton isSecondary" href="/admin/orders">All orders</Link><Link className="adminButton" href="/admin/kitchen">Open kitchen board</Link></>}
    />

    <section className="adminMetrics" aria-label="Business summary">
      <MetricCard label="Confirmed sales · 30 days" value={money(report.confirmedSalesPence)} detail={`${report.paidOrders.length} paid order${report.paidOrders.length === 1 ? "" : "s"}`} tone="good" />
      <MetricCard label="Orders due today" value={todayOrders.length} detail={`${todayOrders.filter((order) => order.fulfilment === "collection").length} collection · ${todayOrders.filter((order) => order.fulfilment === "delivery").length} delivery`} />
      <MetricCard label="Live kitchen flow" value={liveOrders.length} detail="Paid orders still in progress" tone={liveOrders.length ? "attention" : undefined} />
      <MetricCard label="Average paid order" value={money(report.averageOrderPence)} detail={`${report.totalUnits} dishes sold in period`} />
    </section>

    <section className="adminSplitGrid">
      <article className="adminPanel adminFlowPanel">
        <div className="adminPanelHeading"><div><p>At a glance</p><h2>Kitchen flow</h2></div><Link href="/admin/kitchen">Manage board</Link></div>
        <div className="adminFlowList">{flow.map((status) => {
          const matching = liveOrders.filter((order) => order.status === status);
          return <Link href={`/admin/orders?status=${status}`} key={status}><StatusBadge status={status} /><strong>{matching.length}</strong><span>{orderStatusLabels[status]}</span></Link>;
        })}</div>
      </article>
      <article className="adminPanel adminTopDishes">
        <div className="adminPanelHeading"><div><p>Last 30 days</p><h2>Top dishes</h2></div><Link href="/admin/reports">Full report</Link></div>
        {report.topDishes.length ? <ol>{report.topDishes.slice(0, 5).map((dish, index) => <li key={dish.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{dish.name}</strong><b>{dish.units} sold</b></li>)}</ol> : <p className="adminSubtle">Paid dish performance will appear after the first order.</p>}
      </article>
    </section>

    <section className="adminPanel">
      <div className="adminPanelHeading"><div><p>Latest activity</p><h2>Recent orders</h2></div><Link href="/admin/orders">View every order</Link></div>
      <LiveRecentOrders
        initialOrders={recentOrders.slice(0, 8)}
        csrfToken={adminCan(session.role, "orders:transition") ? session.csrfToken : undefined}
        supabaseUrl={realtimeUrl}
        publishableKey={realtimePublishableKey}
      />
    </section>
  </AdminFrame>;
}
