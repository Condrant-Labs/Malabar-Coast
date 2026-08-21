import { NextResponse } from "next/server";
import { getAdminSession, verifyAdminCsrf } from "../../../../lib/admin-auth";
import { updateHallEnquiryStatus } from "../../../../lib/booking-store";
import { hallEnquiryStatuses, type HallEnquiryStatus } from "../../../../lib/bookings";
import { notifyHallDecision } from "../../../../lib/email/notifications";
import { configuredSiteOrigin, isTrustedOrigin, readLimitedFormData } from "../../../../lib/security";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const session=await getAdminSession("hall:write");if(!session||!isTrustedOrigin(request))return new NextResponse("Forbidden",{status:403});const form=await readLimitedFormData(request,16_000);if(!verifyAdminCsrf(session,String(form.get("csrf")||"")))return new NextResponse("Forbidden",{status:403});const {id}=await params;const status=String(form.get("status")||"") as HallEnquiryStatus;const valid=/^hall_[A-Za-z0-9_-]{16,80}$/.test(id)&&(hallEnquiryStatuses as readonly string[]).includes(status);const updated=valid?await updateHallEnquiryStatus(id,status,String(form.get("adminNotes")||"").slice(0,1000),session.userId):null;if(updated)await notifyHallDecision(updated);return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${updated?"success":"rejected"}`,configuredSiteOrigin(request)),303);}
