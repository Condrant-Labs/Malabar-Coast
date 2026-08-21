export const reservationStatuses = ["confirmed", "cancelled", "completed", "no_show"] as const;
export type ReservationStatus = typeof reservationStatuses[number];
export const hallEnquiryStatuses = ["new", "contacted", "approved", "declined"] as const;
export type HallEnquiryStatus = typeof hallEnquiryStatuses[number];

export type BookingSettings = {
  capacity: number;
  sittingMinutes: number;
  slotMinutes: number;
  minimumPartySize: number;
  maximumPartySize: number;
  firstSitting: string;
  lastSitting: string;
  minimumLeadMinutes: number;
  advanceDays: number;
  bookingEnabled: boolean;
};

export const defaultBookingSettings: BookingSettings = {
  capacity: 40,
  sittingMinutes: 90,
  slotMinutes: 30,
  minimumPartySize: 1,
  maximumPartySize: 12,
  firstSitting: "12:00",
  lastSitting: "21:00",
  minimumLeadMinutes: 120,
  advanceDays: 90,
  bookingEnabled: true,
};

export type TableReservation = {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  status: ReservationStatus;
  name: string;
  email: string;
  phone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  occasion: string;
  accessibilityNeeds: string;
  dietaryRequirements: string;
  notes: string;
  adminNotes: string;
};

export type HallEnquiry = {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  status: HallEnquiryStatus;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate: string;
  guestCount: number | null;
  occasion: string;
  message: string;
  contactPreference: "phone" | "email";
  adminNotes: string;
};

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingValidationError";
  }
}

function text(value: unknown, label: string, max: number, required = true) {
  const result = typeof value === "string" ? value.trim().slice(0, max) : "";
  if (required && !result) throw new BookingValidationError(`${label} is required.`);
  return result;
}

function email(value: unknown) {
  const result = text(value, "Email", 160).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(result)) throw new BookingValidationError("Enter a valid email address.");
  return result;
}

function phone(value: unknown) {
  const result = text(value, "Phone number", 40);
  if (!/^[+()\d][+()\d\s.-]{6,38}$/.test(result)) throw new BookingValidationError("Enter a valid phone number.");
  return result;
}

function date(value: unknown, label: string) {
  const result = text(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T12:00:00Z`))) {
    throw new BookingValidationError(`Choose a valid ${label.toLowerCase()}.`);
  }
  return result;
}

function time(value: unknown, label: string) {
  const result = text(value, label, 5);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(result)) throw new BookingValidationError(`Choose a valid ${label.toLowerCase()}.`);
  return result;
}

export function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function timeFromMinutes(value: number) {
  const safe = Math.max(0, Math.min(24 * 60 - 1, value));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function restaurantNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).reduce<Record<string, string>>((all, part) => {
    if (part.type !== "literal") all[part.type] = part.value;
    return all;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function reservationSlots(settings: BookingSettings) {
  const slots: string[] = [];
  for (let current = minutes(settings.firstSitting); current <= minutes(settings.lastSitting); current += settings.slotMinutes) {
    slots.push(timeFromMinutes(current));
  }
  return slots;
}

export function validateReservation(input: unknown, settings: BookingSettings) {
  if (!settings.bookingEnabled) throw new BookingValidationError("Online table booking is temporarily paused. Please contact the restaurant.");
  if (!input || typeof input !== "object") throw new BookingValidationError("Booking details are missing.");
  const body = input as Record<string, unknown>;
  const bookingDate = date(body.bookingDate, "Booking date");
  const startTime = time(body.startTime, "Booking time");
  const partySize = Number(body.partySize);
  if (!Number.isInteger(partySize) || partySize < settings.minimumPartySize || partySize > settings.maximumPartySize) {
    throw new BookingValidationError(`Online bookings are available for ${settings.minimumPartySize} to ${settings.maximumPartySize} guests.`);
  }
  if (!reservationSlots(settings).includes(startTime)) throw new BookingValidationError("Choose one of the available booking times.");
  const requested = `${bookingDate}T${startTime}`;
  const now = restaurantNow();
  const leadCutoff = new Date(Date.now() + settings.minimumLeadMinutes * 60_000);
  const maxDate = new Date(Date.now() + settings.advanceDays * 86_400_000).toISOString().slice(0, 10);
  const localLead = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(leadCutoff).replace(" ", "T");
  if (requested < localLead || requested <= now) throw new BookingValidationError(`Bookings need at least ${Math.ceil(settings.minimumLeadMinutes / 60)} hours' notice.`);
  if (bookingDate > maxDate) throw new BookingValidationError(`Bookings are available up to ${settings.advanceDays} days ahead.`);
  return {
    name: text(body.name, "Name", 100), email: email(body.email), phone: phone(body.phone),
    bookingDate, startTime, endTime: timeFromMinutes(minutes(startTime) + settings.sittingMinutes), partySize,
    occasion: text(body.occasion, "Occasion", 80, false),
    accessibilityNeeds: text(body.accessibilityNeeds, "Accessibility requirements", 400, false),
    dietaryRequirements: text(body.dietaryRequirements, "Dietary requirements", 400, false),
    notes: text(body.notes, "Booking notes", 600, false),
  };
}

export function validateHallEnquiry(input: unknown) {
  if (!input || typeof input !== "object") throw new BookingValidationError("Enquiry details are missing.");
  const body = input as Record<string, unknown>;
  const guestCount = body.guestCount === "" || body.guestCount == null ? null : Number(body.guestCount);
  if (guestCount !== null && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 500)) throw new BookingValidationError("Enter a sensible estimated guest count.");
  const contactPreference: "email" | "phone" = body.contactPreference === "email" ? "email" : "phone";
  const preferredDate = date(body.preferredDate, "Preferred date");
  const alternativeDate = body.alternativeDate ? date(body.alternativeDate, "Alternative date") : "";
  const today = restaurantNow().slice(0, 10);
  if (preferredDate < today || (alternativeDate && alternativeDate < today)) throw new BookingValidationError("Hall enquiry dates must be today or later.");
  return {
    name: text(body.name, "Name", 100), email: email(body.email), phone: phone(body.phone),
    preferredDate,
    preferredTime: text(body.preferredTime, "Preferred time", 40, false),
    alternativeDate,
    guestCount, occasion: text(body.occasion, "Occasion", 100, false),
    message: text(body.message, "What are you planning", 1_000), contactPreference,
  };
}
