import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { displayDay, getReportRange, money, summariseOrders, type ReportPeriod } from "../../lib/admin-reporting";
import { listOrdersForReport } from "../../lib/order-store";
import { AdminFrame, AdminPageHeader, EmptyState, MetricCard } from "../components/admin-ui";

export const dynamic = "force-dynamic";

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" }, { value: "year", label: "This year" }, { value: "all", label: "All time" },
];

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`));
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const query = await searchParams;
  const period = periods.some((candidate) => candidate.value === query.period) ? query.period as ReportPeriod : "30d";
  const range = getReportRange(period);
  const orders = await listOrdersForReport(range.from, range.to);
  const report = summariseOrders(orders);
  const recentDays = report.daily.slice(-31);
  const maxDay = Math.max(1, ...recentDays.map((day) => day.salesPence));
  const maxDish = Math.max(1, ...report.topDishes.map((dish) => dish.units));

  return <AdminFrame active="/admin/reports" csrfToken={session.csrfToken}>
    <AdminPageHeader eyebrow="Sales and performance" title="Know every service." description="Confirmed online sales, daily collections, monthly movement and dish demand—calculated directly from order records." actions={<nav className="adminPeriodTabs" aria-label="Report period">{periods.map((item) => <a className={period === item.value ? "isActive" : undefined} key={item.value} href={`/admin/reports?period=${item.value}`}>{item.label}</a>)}</nav>} />
    <section className="adminMetrics" aria-label="Report summary">
      <MetricCard label="Confirmed sales" value={money(report.confirmedSalesPence)} detail={`${report.paidOrders.length} paid orders`} tone="good" />
      <MetricCard label="Average order" value={money(report.averageOrderPence)} detail={`${report.totalUnits} dishes sold`} />
      <MetricCard label="Completed" value={report.completedOrders.length} detail={`${report.activeOrders.length} still in progress`} />
      <MetricCard label="Average kitchen time" value={report.averagePreparationMinutes === null ? "—" : `${report.averagePreparationMinutes}m`} detail="Confirmed to completed" />
    </section>

    <section className="adminSplitGrid adminReportGrid">
      <article className="adminPanel adminSalesChart">
        <div className="adminPanelHeading"><div><p>Day-to-day collection</p><h2>Confirmed sales by day</h2></div><span>Most recent 31 active days</span></div>
        {recentDays.length ? <div className="adminBars" role="img" aria-label="Daily confirmed sales chart">{recentDays.map((day) => <div key={day.date} title={`${displayDay(day.date)}: ${money(day.salesPence)}`}><i style={{ height: `${Math.max(4, Math.round((day.salesPence / maxDay) * 100))}%` }} /><span>{day.date.slice(8)}</span></div>)}</div> : <EmptyState title="No confirmed sales in this period" detail="Paid orders will populate the chart and collection ledger." />}
      </article>
      <article className="adminPanel adminMixPanel">
        <div className="adminPanelHeading"><div><p>Order mix</p><h2>How guests order</h2></div></div>
        <div className="adminMixRows">
          <div><span>Collection</span><strong>{report.collectionOrders}</strong><i><b style={{ width: `${report.paidOrders.length ? report.collectionOrders / report.paidOrders.length * 100 : 0}%` }} /></i></div>
          <div><span>Delivery</span><strong>{report.deliveryOrders}</strong><i><b style={{ width: `${report.paidOrders.length ? report.deliveryOrders / report.paidOrders.length * 100 : 0}%` }} /></i></div>
          <div><span>Stripe</span><strong>{report.stripeOrders}</strong><i><b style={{ width: `${report.paidOrders.length ? report.stripeOrders / report.paidOrders.length * 100 : 0}%` }} /></i></div>
          <div><span>Worldpay</span><strong>{report.worldpayOrders}</strong><i><b style={{ width: `${report.paidOrders.length ? report.worldpayOrders / report.paidOrders.length * 100 : 0}%` }} /></i></div>
        </div>
      </article>
    </section>

    <section className="adminSplitGrid adminReportGrid">
      <article className="adminPanel adminTopDishes adminDishReport">
        <div className="adminPanelHeading"><div><p>Menu intelligence</p><h2>Best-selling dishes</h2></div><span>Paid quantities</span></div>
        {report.topDishes.length ? <ol>{report.topDishes.map((dish, index) => <li key={dish.name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{dish.name}</strong><i><b style={{ width: `${dish.units / maxDish * 100}%` }} /></i></div><b>{dish.units}<small>{money(dish.salesPence)}</small></b></li>)}</ol> : <p className="adminSubtle">Dish performance will appear after confirmed sales.</p>}
      </article>
      <article className="adminPanel adminLedger">
        <div className="adminPanelHeading"><div><p>Monthly tracking</p><h2>Month-by-month</h2></div><span>Confirmed sales</span></div>
        {report.monthly.length ? <div className="adminLedgerRows">{report.monthly.slice(-12).reverse().map((month) => <div key={month.month}><span>{monthLabel(month.month)}</span><strong>{money(month.salesPence)}</strong><small>{month.orders} order{month.orders === 1 ? "" : "s"}</small></div>)}</div> : <EmptyState title="No monthly history yet" detail="The last twelve active months will be shown here." />}
      </article>
    </section>

    <section className="adminPanel adminLedger">
      <div className="adminPanelHeading"><div><p>Daily ledger</p><h2>Day-by-day collection</h2></div><span>{report.daily.length} active day{report.daily.length === 1 ? "" : "s"}</span></div>
      {report.daily.length ? <div className="adminLedgerRows isDaily">{report.daily.slice(-31).reverse().map((day) => <div key={day.date}><span>{displayDay(day.date)}</span><strong>{money(day.salesPence)}</strong><small>{day.orders} order{day.orders === 1 ? "" : "s"}</small></div>)}</div> : <EmptyState title="No daily collection records" detail="Confirmed payment value is grouped here by restaurant-local order date." />}
    </section>
  </AdminFrame>;
}

