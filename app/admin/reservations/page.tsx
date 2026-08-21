import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getBookingSettings, listReservations } from "../../lib/booking-store";
import { reservationStatuses } from "../../lib/bookings";
import { adminCan } from "../../lib/admin-permissions";
import { AdminFrame, AdminPageHeader, EmptyState, MetricCard } from "../components/admin-ui";

export const dynamic = "force-dynamic";
export default async function ReservationsAdminPage({ searchParams }: { searchParams: Promise<{ update?: string }> }) {
  const session = await getAdminSession("reservations:read"); if (!session) redirect("/admin/login");
  const [settings, reservations, query] = await Promise.all([getBookingSettings(), listReservations(), searchParams]);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London" }).format(new Date());
  const upcoming = reservations.filter((item) => item.bookingDate >= today && item.status === "confirmed");
  const todayBookings = upcoming.filter((item) => item.bookingDate === today);
  const todayGuests = todayBookings.reduce((sum, item) => sum + item.partySize, 0);
  const canWrite = adminCan(session.role, "reservations:write");
  return <AdminFrame active="/admin/reservations" session={session}>
    <AdminPageHeader eyebrow="Front of house" title="Table reservations." description="Live sittings, guest requirements and editable restaurant capacity." />
    {query.update && <p className={`adminAlert ${query.update === "success" ? "isSuccess" : "isError"}`}>{query.update === "success" ? "Reservation settings were updated." : "That update was rejected."}</p>}
    <section className="adminMetrics"><MetricCard label="Upcoming tables" value={upcoming.length} detail="Confirmed future reservations"/><MetricCard label="Guests today" value={todayGuests} detail={`${todayBookings.length} table${todayBookings.length===1?"":"s"}`} tone={todayGuests?"attention":undefined}/><MetricCard label="Seats per sitting" value={settings.capacity} detail={`${settings.sittingMinutes}-minute table duration`}/><MetricCard label="Largest online party" value={settings.maximumPartySize} detail={`${settings.slotMinutes}-minute arrival intervals`}/></section>
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Capacity controls</p><h2>Booking rules</h2></div><b>{settings.bookingEnabled?"Accepting bookings":"Paused"}</b></div>
      <form className="adminBookingSettings" method="post" action="/api/admin/reservations/settings">
        <input type="hidden" name="csrf" value={session.csrfToken}/><label>Total seats<input name="capacity" type="number" min="1" max="500" defaultValue={settings.capacity}/></label><label>Table duration<select name="sittingMinutes" defaultValue={settings.sittingMinutes}><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option><option value="150">150 minutes</option><option value="180">180 minutes</option></select></label><label>Arrival interval<select name="slotMinutes" defaultValue={settings.slotMinutes}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label><label>Maximum party<input name="maximumPartySize" type="number" min="1" max="100" defaultValue={settings.maximumPartySize}/></label><label>First sitting<input name="firstSitting" type="time" defaultValue={settings.firstSitting}/></label><label>Last sitting<input name="lastSitting" type="time" defaultValue={settings.lastSitting}/></label><label>Minimum notice (minutes)<input name="minimumLeadMinutes" type="number" min="0" max="10080" defaultValue={settings.minimumLeadMinutes}/></label><label>Book ahead (days)<input name="advanceDays" type="number" min="1" max="365" defaultValue={settings.advanceDays}/></label><label className="adminCheckField"><input name="bookingEnabled" type="checkbox" defaultChecked={settings.bookingEnabled}/>Online table booking enabled</label><button className="adminButton" disabled={!canWrite}>Save booking rules</button>
      </form>
    </section>
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Guest list</p><h2>Upcoming and recent</h2></div></div>
      {!reservations.length?<EmptyState title="No table reservations" detail="Confirmed customer bookings will appear here."/>:<div className="adminTableWrap"><table className="adminOrdersTable"><thead><tr><th>Reference</th><th>Date &amp; time</th><th>Guest</th><th>Party</th><th>Requirements</th><th>Status</th><th>Action</th></tr></thead><tbody>{reservations.map((item)=><tr key={item.id}><td><strong>{item.reference}</strong><small>{item.createdAt.slice(0,10)}</small></td><td><strong>{item.bookingDate}</strong><small>{item.startTime}–{item.endTime}</small></td><td><strong>{item.name}</strong><small>{item.phone} · {item.email}</small></td><td><strong>{item.partySize}</strong><small>{item.occasion||"No occasion"}</small></td><td><strong>{item.dietaryRequirements||"None noted"}</strong><small>{item.accessibilityNeeds||item.notes||"No other requirements"}</small></td><td><span className={`adminStatus booking_${item.status}`}>{item.status.replace("_"," ")}</span></td><td>{canWrite&&<form className="adminInlineUpdate" action={`/api/admin/reservations/${item.id}`} method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><select name="status" defaultValue={item.status}>{reservationStatuses.map(status=><option key={status}>{status}</option>)}</select><input name="adminNotes" defaultValue={item.adminNotes} placeholder="Staff note" maxLength={1000}/><button>Save</button></form>}</td></tr>)}</tbody></table></div>}
    </section>
  </AdminFrame>;
}
