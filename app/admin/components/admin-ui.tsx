import Link from "next/link";
import type { ReactNode } from "react";
import { getAllowedAdminTransitions, orderStatusLabels, type OrderRecord, type OrderStatus } from "../../lib/orders";
import { displayDate, money } from "../../lib/admin-reporting";

const navigation = [
  { href: "/admin", label: "Overview", mark: "01" },
  { href: "/admin/orders", label: "Orders", mark: "02" },
  { href: "/admin/kitchen", label: "Kitchen", mark: "03" },
  { href: "/admin/reports", label: "Reports", mark: "04" },
  { href: "/admin/settings", label: "System", mark: "05" },
];

export function AdminFrame({ active, csrfToken, children }: { active: string; csrfToken: string; children: ReactNode }) {
  return (
    <main className="adminShell adminPortal">
      <aside className="adminSidebar">
        <Link className="adminBrand" href="/admin" aria-label="Malabar Coast operations overview">
          <span>MC</span><div><strong>Malabar Coast</strong><small>Restaurant operations</small></div>
        </Link>
        <nav aria-label="Administration">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={active === item.href ? "isActive" : undefined}>
              <span>{item.mark}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="adminSidebarFooter">
          <div><i aria-hidden="true" /><span><strong>Secure session</strong><small>Private operations</small></span></div>
          <form action="/api/admin/logout" method="post">
            <input type="hidden" name="csrf" value={csrfToken} />
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="adminWorkspace">{children}</div>
    </main>
  );
}

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="adminPageHeader">
      <div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>
      {actions && <div className="adminHeaderActions">{actions}</div>}
    </header>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`adminStatus status_${status}`}>{orderStatusLabels[status]}</span>;
}

export function MetricCard({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone?: "good" | "attention" }) {
  return <article className={`adminMetricCard${tone ? ` is-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="adminEmpty"><b>0</b><strong>{title}</strong><span>{detail}</span></div>;
}

export function OrderTable({ orders, csrfToken, returnTo = "/admin/orders" }: { orders: OrderRecord[]; csrfToken?: string; returnTo?: string }) {
  if (!orders.length) return <EmptyState title="No matching orders" detail="New or matching orders will appear here automatically." />;
  return (
    <div className="adminTableWrap">
      <table className="adminOrdersTable">
        <thead><tr><th>Order</th><th>Customer</th><th>Due</th><th>Items</th><th>Fulfilment</th><th>Status</th><th>Total</th><th><span className="srOnly">Action</span></th></tr></thead>
        <tbody>{orders.map((order) => {
          const nextStatus = getAllowedAdminTransitions(order)[0];
          const units = order.lines.reduce((total, line) => total + line.quantity, 0);
          return <tr key={order.id}>
            <td><Link className="adminOrderReference" href={`/admin/orders/${order.id}`}>{order.id.slice(-8).toUpperCase()}</Link><small>{displayDate(order.createdAt)}</small></td>
            <td><strong>{order.customer.name}</strong><small>{order.customer.email}</small></td>
            <td>{order.requestedTime.replace("T", " ")}</td>
            <td>{units}<small>{order.lines.length} dish{order.lines.length === 1 ? "" : "es"}</small></td>
            <td className="adminCapitalize">{order.fulfilment}<small>{order.provider}</small></td>
            <td><StatusBadge status={order.status} /></td>
            <td><strong>{money(order.totalPence)}</strong></td>
            <td>{nextStatus && csrfToken ? <form action={`/api/admin/orders/${order.id}/status`} method="post" className="adminQuickAction">
              <input type="hidden" name="csrf" value={csrfToken} /><input type="hidden" name="status" value={nextStatus} /><input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" title={`Move to ${orderStatusLabels[nextStatus]}`}>Advance</button>
            </form> : <Link className="adminRowLink" href={`/admin/orders/${order.id}`} aria-label={`Open order ${order.id}`}>View</Link>}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}

