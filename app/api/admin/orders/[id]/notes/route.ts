import { NextResponse } from "next/server";
import { getAdminSession, verifyAdminCsrf } from "../../../../../lib/admin-auth";
import { updateOrderAdminNotes } from "../../../../../lib/order-store";
import { configuredSiteOrigin, isTrustedOrigin, isValidOrderId, readLimitedFormData } from "../../../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession("orders:notes");
  if (!isTrustedOrigin(request) || !session) return new NextResponse("Forbidden", { status: 403 });
  let form: URLSearchParams;
  try {
    form = await readLimitedFormData(request, 8_000);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", { status: 403 });

  const { id } = await context.params;
  const adminNotes = String(form.get("adminNotes") || "").trim();
  if (!isValidOrderId(id) || adminNotes.length > 2_000) return new NextResponse("Invalid note request", { status: 400 });
  const updated = await updateOrderAdminNotes(id, adminNotes, session.userId);
  const url = new URL(`/admin/orders/${encodeURIComponent(id)}`, configuredSiteOrigin(request));
  url.searchParams.set("notes", updated ? "saved" : "rejected");
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
