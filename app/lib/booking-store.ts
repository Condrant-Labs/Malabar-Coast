import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { defaultBookingSettings, type BookingSettings, type HallEnquiry, type HallEnquiryStatus, type ReservationStatus, type TableReservation } from "./bookings";
import { isSupabaseServerConfigured, supabaseServerRequest, supabaseServerRpc } from "./supabase/server";

const localPath = path.join(process.cwd(), ".data", "bookings.json");
let queue: Promise<void> = Promise.resolve();
type LocalData = { settings: BookingSettings; reservations: TableReservation[]; hallEnquiries: HallEnquiry[] };

async function readLocal(): Promise<LocalData> {
  try { return JSON.parse(await readFile(localPath, "utf8")) as LocalData; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { settings: defaultBookingSettings, reservations: [], hallEnquiries: [] }; throw error; }
}
async function writeLocal(data: LocalData) {
  await mkdir(path.dirname(localPath), { recursive: true });
  const temporary = `${localPath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), "utf8");
  await rename(temporary, localPath);
}
function id(prefix: string) { return `${prefix}_${randomBytes(18).toString("base64url")}`; }
function reference(prefix: string) { return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`; }

export async function getBookingSettings(): Promise<BookingSettings> {
  if (isSupabaseServerConfigured()) {
    try {
      const response = await supabaseServerRequest("restaurant_booking_settings?id=eq.1&select=capacity,sitting_minutes,slot_minutes,minimum_party_size,maximum_party_size,first_sitting,last_sitting,minimum_lead_minutes,advance_days,booking_enabled&limit=1");
      const row = (await response.json() as Record<string, unknown>[])[0];
      if (!row) return { ...defaultBookingSettings, bookingEnabled: false };
      return { capacity: Number(row.capacity), sittingMinutes: Number(row.sitting_minutes), slotMinutes: Number(row.slot_minutes), minimumPartySize: Number(row.minimum_party_size), maximumPartySize: Number(row.maximum_party_size), firstSitting: String(row.first_sitting).slice(0, 5), lastSitting: String(row.last_sitting).slice(0, 5), minimumLeadMinutes: Number(row.minimum_lead_minutes), advanceDays: Number(row.advance_days), bookingEnabled: Boolean(row.booking_enabled) };
    } catch {
      return { ...defaultBookingSettings, bookingEnabled: false };
    }
  }
  return (await readLocal()).settings;
}

export async function createReservation(input: Omit<TableReservation, "id" | "reference" | "createdAt" | "updatedAt" | "status" | "adminNotes">) {
  if (isSupabaseServerConfigured()) return supabaseServerRpc<TableReservation>("create_table_reservation", { p_data: input });
  if (process.env.NODE_ENV === "production") throw new Error("Reservation storage is not configured.");
  let result!: TableReservation;
  queue = queue.then(async () => {
    const data = await readLocal();
    const occupied = data.reservations.filter((item) => item.bookingDate === input.bookingDate && item.status === "confirmed" && item.startTime < input.endTime && item.endTime > input.startTime).reduce((sum, item) => sum + item.partySize, 0);
    if (occupied + input.partySize > data.settings.capacity) throw new Error("CAPACITY_EXCEEDED");
    const now = new Date().toISOString();
    result = { ...input, id: id("res"), reference: reference("MC-TABLE"), createdAt: now, updatedAt: now, status: "confirmed", adminNotes: "" };
    data.reservations.push(result); await writeLocal(data);
  });
  await queue; return result;
}

export async function listReservations(limit = 500) {
  if (isSupabaseServerConfigured()) {
    const response = await supabaseServerRequest(`table_reservations?select=*&order=booking_date.asc,start_time.asc&limit=${Math.min(limit, 1000)}`);
    return (await response.json() as Record<string, unknown>[]).map(mapReservation);
  }
  return (await readLocal()).reservations.sort((a, b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
}

function mapReservation(row: Record<string, unknown>): TableReservation { return { id: String(row.id), reference: String(row.reference), createdAt: String(row.created_at), updatedAt: String(row.updated_at), status: row.status as ReservationStatus, name: String(row.name), email: String(row.email), phone: String(row.phone), bookingDate: String(row.booking_date), startTime: String(row.start_time).slice(0, 5), endTime: String(row.end_time).slice(0, 5), partySize: Number(row.party_size), occasion: String(row.occasion || ""), accessibilityNeeds: String(row.accessibility_needs || ""), dietaryRequirements: String(row.dietary_requirements || ""), notes: String(row.notes || ""), adminNotes: String(row.admin_notes || "") }; }

export async function updateReservationStatus(reservationId: string, status: ReservationStatus, adminNotes: string, actorUserId: string) {
  if (isSupabaseServerConfigured()) return supabaseServerRpc<TableReservation | null>("update_table_reservation", { p_reservation_id: reservationId, p_status: status, p_admin_notes: adminNotes, p_actor_user_id: actorUserId });
  let result: TableReservation | null = null; queue = queue.then(async () => { const data = await readLocal(); const index = data.reservations.findIndex((item) => item.id === reservationId); if (index < 0) return; data.reservations[index] = { ...data.reservations[index], status, adminNotes, updatedAt: new Date().toISOString() }; result = data.reservations[index]; await writeLocal(data); }); await queue; return result;
}

export async function updateBookingSettings(settings: BookingSettings, actorUserId: string) {
  if (isSupabaseServerConfigured()) return supabaseServerRpc<BookingSettings>("update_restaurant_booking_settings", { p_settings: settings, p_actor_user_id: actorUserId });
  queue = queue.then(async () => { const data = await readLocal(); data.settings = settings; await writeLocal(data); }); await queue; return settings;
}

export async function createHallEnquiry(input: Omit<HallEnquiry, "id" | "reference" | "createdAt" | "updatedAt" | "status" | "adminNotes">) {
  const now = new Date().toISOString();
  const enquiry: HallEnquiry = { ...input, id: id("hall"), reference: reference("MC-HALL"), createdAt: now, updatedAt: now, status: "new", adminNotes: "" };
  if (isSupabaseServerConfigured()) return supabaseServerRpc<HallEnquiry>("create_hall_enquiry", { p_data: enquiry });
  if (process.env.NODE_ENV === "production") throw new Error("Hall enquiry storage is not configured.");
  queue = queue.then(async () => { const data = await readLocal(); data.hallEnquiries.push(enquiry); await writeLocal(data); }); await queue; return enquiry;
}

export async function listHallEnquiries(limit = 500) {
  if (isSupabaseServerConfigured()) { const response = await supabaseServerRequest(`hall_enquiries?select=*&order=created_at.desc&limit=${Math.min(limit, 1000)}`); return (await response.json() as Record<string, unknown>[]).map(mapHall); }
  return (await readLocal()).hallEnquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function mapHall(row: Record<string, unknown>): HallEnquiry { return { id: String(row.id), reference: String(row.reference), createdAt: String(row.created_at), updatedAt: String(row.updated_at), status: row.status as HallEnquiryStatus, name: String(row.name), email: String(row.email), phone: String(row.phone), preferredDate: String(row.preferred_date), preferredTime: String(row.preferred_time || ""), alternativeDate: String(row.alternative_date || ""), guestCount: row.guest_count == null ? null : Number(row.guest_count), occasion: String(row.occasion || ""), message: String(row.message), contactPreference: row.contact_preference === "email" ? "email" : "phone", adminNotes: String(row.admin_notes || "") }; }
export async function updateHallEnquiryStatus(enquiryId: string, status: HallEnquiryStatus, adminNotes: string, actorUserId: string) { if (isSupabaseServerConfigured()) return supabaseServerRpc<HallEnquiry | null>("update_hall_enquiry", { p_enquiry_id: enquiryId, p_status: status, p_admin_notes: adminNotes, p_actor_user_id: actorUserId }); let result: HallEnquiry | null = null; queue = queue.then(async () => { const data = await readLocal(); const index = data.hallEnquiries.findIndex((item) => item.id === enquiryId); if (index < 0) return; data.hallEnquiries[index] = { ...data.hallEnquiries[index], status, adminNotes, updatedAt: new Date().toISOString() }; result = data.hallEnquiries[index]; await writeLocal(data); }); await queue; return result; }
