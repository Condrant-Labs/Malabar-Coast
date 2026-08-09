import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { displayDate, money } from "../../../lib/admin-reporting";
import { getAdminSession } from "../../../lib/admin-auth";
import { getOrder } from "../../../lib/order-store";
import { getAllowedAdminTransitions, inferPaymentStatus, orderStatusLabels, paymentStatusLabels } from "../../../lib/orders";
import { isValidOrderId } from "../../../lib/security";
import { AdminFrame, AdminPageHeader, StatusBadge } from "../../components/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ update?: string; notes?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  if (!isValidOrderId(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const query = await searchParams;
  const transitions = getAllowedAdminTransitions(order);
  const paymentStatus = inferPaymentStatus(order);
  const units = order.lines.reduce((total, line) => total + line.quantity, 0);

  return <AdminFrame active="/admin/orders" csrfToken={session.csrfToken}>
    <AdminPageHeader eyebrow="Order detail" title={order.id.slice(-12).toUpperCase()} description={`${order.customer.name} · ${order.fulfilment} · requested ${order.requestedTime.replace("T", " ")}`} actions={<><StatusBadge status={order.status} /><Link className="adminButton isSecondary" href="/admin/orders">Back to orders</Link></>} />
    {query.update === "success" && <div className="adminAlert isSuccess" role="status">Order advanced successfully. The change is now in its audit history.</div>}
    {query.update === "rejected" && <div className="adminAlert isError" role="alert">That change was rejected because the live state changed or the transition is not allowed.</div>}
    {query.notes === "saved" && <div className="adminAlert isSuccess" role="status">Internal operations note saved.</div>}
    {query.notes === "rejected" && <div className="adminAlert isError" role="alert">The internal note could not be saved.</div>}

    <section className="adminOrderGrid">
      <div>
        <article className="adminPanel adminLines">
          <div className="adminPanelHeading"><div><p>Kitchen ticket</p><h2>{units} item{units === 1 ? "" : "s"}</h2></div><strong>{money(order.totalPence)}</strong></div>
          {order.lines.map((line) => <article key={line.menuItemId}><div><span>{line.quantity} ×</span><strong>{line.name}</strong>{line.note && <small>{line.note}</small>}</div><b>{money(line.lineTotalPence)}</b></article>)}
          <dl><div><dt>Subtotal</dt><dd>{money(order.subtotalPence)}</dd></div><div><dt>Delivery</dt><dd>{money(order.deliveryFeePence)}</dd></div><div><dt>Total</dt><dd>{money(order.totalPence)}</dd></div></dl>
          {order.orderNote && <div className="adminOrderNote"><span>Customer note</span><p>{order.orderNote}</p></div>}
        </article>

        <article className="adminPanel adminTimeline">
          <div className="adminPanelHeading"><div><p>Immutable progress record</p><h2>Status history</h2></div></div>
          <ol>{(order.statusHistory || [{ status: order.status, at: order.createdAt, actor: "system" as const }]).slice().reverse().map((entry, index) => <li key={`${entry.at}-${index}`}><i /><div><strong>{orderStatusLabels[entry.status]}</strong><span>{entry.actor.replace("_", " ")} · {displayDate(entry.at)}</span>{entry.note && <p>{entry.note}</p>}</div></li>)}</ol>
        </article>
      </div>

      <aside>
        <article className="adminPanel adminOrderSummary">
          <div className="adminPanelHeading"><div><p>Operations</p><h2>Advance order</h2></div></div>
          {paymentStatus !== "paid" && <div className="adminAlert isError" role="alert">Fulfilment is locked until a signed event or authenticated provider query confirms the payment.</div>}
          {transitions.length ? <div className="adminTransitions">{transitions.map((status) => <form action={`/api/admin/orders/${order.id}/status`} method="post" key={status}><input type="hidden" name="csrf" value={session.csrfToken} /><input type="hidden" name="status" value={status} /><button type="submit">Move to {orderStatusLabels[status]} <span aria-hidden="true">→</span></button></form>)}</div> : paymentStatus === "paid" && <p className="adminSubtle">No further fulfilment transition is available for this order.</p>}
          <dl>
            <div><dt>Payment</dt><dd>{paymentStatusLabels[paymentStatus]}</dd></div><div><dt>Provider</dt><dd className="adminCapitalize">{order.provider}</dd></div>
            <div><dt>Provider reference</dt><dd>{order.providerReference || "Awaiting provider"}</dd></div><div><dt>Provider outcome</dt><dd>{order.providerOutcome || "Awaiting provider"}</dd></div>
            <div><dt>Fulfilment</dt><dd className="adminCapitalize">{order.fulfilment}</dd></div><div><dt>Requested</dt><dd>{order.requestedTime.replace("T", " ")}</dd></div>
            <div><dt>Placed</dt><dd>{displayDate(order.createdAt)}</dd></div><div><dt>Updated</dt><dd>{displayDate(order.updatedAt)}</dd></div>
          </dl>
        </article>

        <article className="adminPanel adminCustomer">
          <div className="adminPanelHeading"><div><p>Private customer data</p><h2>Customer</h2></div></div>
          <address><strong>{order.customer.name}</strong><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></address>
          {order.deliveryAddress && <address className="adminDeliveryAddress"><span>{order.deliveryAddress.line1}</span>{order.deliveryAddress.line2 && <span>{order.deliveryAddress.line2}</span>}<span>{order.deliveryAddress.city}</span><span>{order.deliveryAddress.postcode}</span></address>}
        </article>

        <article className="adminPanel adminNotesPanel">
          <div className="adminPanelHeading"><div><p>Private to staff</p><h2>Operations note</h2></div></div>
          <form action={`/api/admin/orders/${order.id}/notes`} method="post"><input type="hidden" name="csrf" value={session.csrfToken} /><label htmlFor="adminNotes">Kitchen, hand-off or customer-service context</label><textarea id="adminNotes" name="adminNotes" defaultValue={order.adminNotes || ""} maxLength={2000} rows={5} placeholder="Add a clear internal note…" /><button className="adminButton" type="submit">Save note</button></form>
        </article>
      </aside>
    </section>
  </AdminFrame>;
}
