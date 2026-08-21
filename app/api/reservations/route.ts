import { createReservation, getBookingSettings } from "../../lib/booking-store";
import { BookingValidationError, validateReservation } from "../../lib/bookings";
import { notifyReservation } from "../../lib/email/notifications";
import { checkRateLimit, getClientAddress, isTrustedOrigin, noStoreJson, readLimitedJson, RequestBodyTooLargeError } from "../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) return noStoreJson({ error: "Invalid request origin." }, { status: 403 });
    const rate = checkRateLimit("table-reservation", getClientAddress(request), 6, 60 * 60_000);
    if (!rate.allowed) return noStoreJson({ error: "Too many booking attempts. Please wait before trying again." }, { status: 429 });
    const settings = await getBookingSettings();
    const input = validateReservation(await readLimitedJson(request, 32_000), settings);
    const reservation = await createReservation(input);
    await notifyReservation(reservation);
    return noStoreJson({ reference: reservation.reference, bookingDate: reservation.bookingDate, startTime: reservation.startTime, endTime: reservation.endTime, partySize: reservation.partySize }, { status: 201 });
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : error instanceof BookingValidationError || error instanceof SyntaxError ? 400 : 409;
    const message = error instanceof BookingValidationError ? error.message : status === 413 ? "Booking request is too large." : status === 409 ? "That sitting has just reached capacity. Please choose another time." : "Booking details are invalid.";
    if (status >= 500) console.error("Table reservation failed.", error instanceof Error ? error.name : "UnknownError");
    return noStoreJson({ error: message }, { status });
  }
}
