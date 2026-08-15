import { NextResponse } from "next/server";
import { clearAdminSession, getAdminSession, recordAdminLogout, verifyAdminCsrf } from "../../../lib/admin-auth";
import { configuredSiteOrigin, isTrustedOrigin, readLimitedFormData } from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession();
  let form: URLSearchParams;
  try {
    form = await readLimitedFormData(request, 16_000);
  } catch {
    form = new URLSearchParams();
  }
  if (!isTrustedOrigin(request) || !session || !verifyAdminCsrf(session, String(form.get("csrf") || ""))) {
    return new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  await recordAdminLogout(session);
  const response = NextResponse.redirect(new URL("/admin/login", configuredSiteOrigin(request)), 303);
  clearAdminSession(response);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
