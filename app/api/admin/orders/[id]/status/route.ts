import { NextResponse } from "next/server";
import { getAdminSession, verifyAdminCsrf } from "../../../../../lib/admin-auth";
import { transitionOrderStatus } from "../../../../../lib/order-store";
import { orderStatusLabels, type OrderStatus } from "../../../../../lib/orders";
import { configuredSiteOrigin, isTrustedOrigin, isValidOrderId, readLimitedFormData } from "../../../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession("orders:transition");
  if (!isTrustedOrigin(request) || !session) return new NextResponse("Forbidden", { status: 403 });
  let form: URLSearchParams;
  try {
    form = await readLimitedFormData(request, 16_000);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", { status: 403 });

  const { id } = await context.params;
  const nextStatus = String(form.get("status") || "") as OrderStatus;
  if (!isValidOrderId(id) || !Object.prototype.hasOwnProperty.call(orderStatusLabels, nextStatus)) {
    return new NextResponse("Invalid status request", { status: 400 });
  }

  const updated = await transitionOrderStatus(id, nextStatus, session.userId);
  const requestedReturn = String(form.get("returnTo") || "");
  const safeReturn = requestedReturn.startsWith("/admin") && !requestedReturn.startsWith("//")
    ? requestedReturn
    : `/admin/orders/${encodeURIComponent(id)}`;
  const url = new URL(safeReturn, configuredSiteOrigin(request));
  url.searchParams.set("update", updated ? "success" : "rejected");
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
