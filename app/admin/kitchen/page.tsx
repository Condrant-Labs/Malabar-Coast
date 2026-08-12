import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { activeOrderStatuses, displayDate, money } from "../../lib/admin-reporting";
import { listOrdersForReport } from "../../lib/order-store";
import { getAllowedAdminTransitions, orderStatusLabels, type OrderStatus } from "../../lib/orders";
import { AdminFrame, AdminPageHeader, EmptyState, StatusBadge } from "../components/admin-ui";
import { RealtimePageRefresh } from "../components/realtime-page-refresh";

export const dynamic = "force-dynamic";

const lanes: { status: OrderStatus; title: string; detail: string }[] = [
  { status: "paid", title: "New · to do", detail: "Payment confirmed" },
  { status: "confirmed", title: "Accepted", detail: "Ready for kitchen" },
  { status: "preparing", title: "Making", detail: "In preparation" },
  { status: "ready", title: "Ready", detail: "Awaiting hand-off" },
  { status: "out_for_delivery", title: "Delivery", detail: "With the driver" },
];

export default async function AdminKitchenPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const orders = await listOrdersForReport(undefined, undefined, { statuses: activeOrderStatuses });
  const active = orders.filter((order) => lanes.some((lane) => lane.status === order.status));
  const realtimeUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const realtimePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  return <AdminFrame active="/admin/kitchen" csrfToken={session.csrfToken}>
    <AdminPageHeader eyebrow="Live fulfilment" title="The kitchen, in motion." description="A single board for new, making, ready and delivery orders. Payment status remains provider-verified." actions={<><RealtimePageRefresh supabaseUrl={realtimeUrl} publishableKey={realtimePublishableKey} /><Link className="adminButton isSecondary" href="/admin/orders">Order register</Link></>} />
    {active.length ? <section className="adminKitchenBoard" aria-label="Kitchen order board">{lanes.map((lane) => {
      const laneOrders = active.filter((order) => order.status === lane.status).sort((a, b) => a.requestedTime.localeCompare(b.requestedTime));
      return <section className="adminKitchenLane" key={lane.status}>
        <header><div><StatusBadge status={lane.status} /><h2>{lane.title}</h2><p>{lane.detail}</p></div><strong>{laneOrders.length}</strong></header>
        <div className="adminKitchenCards">{laneOrders.length ? laneOrders.map((order) => {
          const next = getAllowedAdminTransitions(order)[0];
          return <article className="adminKitchenCard" key={order.id}>
            <div className="adminKitchenCardTop"><Link href={`/admin/orders/${order.id}`}>{order.id.slice(-8).toUpperCase()}</Link><strong>{money(order.totalPence)}</strong></div>
            <div className="adminKitchenCustomer"><strong>{order.customer.name}</strong><span>{order.fulfilment} · {order.requestedTime.replace("T", " ")}</span></div>
            <ul>{order.lines.map((line) => <li key={line.menuItemId}><b>{line.quantity}×</b><span>{line.name}{line.note && <small>{line.note}</small>}</span></li>)}</ul>
            {order.orderNote && <p className="adminKitchenNote"><strong>Customer note</strong>{order.orderNote}</p>}
            {order.adminNotes && <p className="adminKitchenNote isInternal"><strong>Kitchen note</strong>{order.adminNotes}</p>}
            <footer><small>Placed {displayDate(order.createdAt)}</small>{next && <form action={`/api/admin/orders/${order.id}/status`} method="post"><input type="hidden" name="csrf" value={session.csrfToken} /><input type="hidden" name="status" value={next} /><input type="hidden" name="returnTo" value="/admin/kitchen" /><button type="submit">{next === "completed" ? "Complete" : `Move to ${orderStatusLabels[next]}`}</button></form>}</footer>
          </article>;
        }) : <div className="adminLaneEmpty">No orders in this stage</div>}</div>
      </section>;
    })}</section> : <section className="adminPanel"><EmptyState title="The live board is clear" detail="Paid orders appear here automatically and move across the board as staff advance them." /></section>}
  </AdminFrame>;
}
