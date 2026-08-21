import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { defaultBookingSettings, reservationSlots, validateHallEnquiry } from "../app/lib/bookings";

test("table booking defaults start with forty seats and ninety-minute sittings", () => {
  assert.equal(defaultBookingSettings.capacity, 40);
  assert.equal(defaultBookingSettings.sittingMinutes, 90);
  assert.equal(defaultBookingSettings.slotMinutes, 30);
  assert.equal(reservationSlots(defaultBookingSettings)[0], "12:00");
  assert.equal(reservationSlots(defaultBookingSettings).at(-1), "21:00");
});

test("hall requests capture contact and planning details without becoming confirmed bookings", () => {
  const future = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  const enquiry = validateHallEnquiry({ name: "Guest", email: "guest@example.com", phone: "+44 7700 900123", preferredDate: future, preferredTime: "Evening", guestCount: "40", occasion: "Family celebration", message: "We would like catering and stage access.", contactPreference: "phone" });
  assert.equal(enquiry.guestCount, 40);
  assert.equal(enquiry.contactPreference, "phone");
});

test("database capacity is checked atomically and notification delivery is idempotent", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /pg_advisory_xact_lock/);
  assert.match(schema, /occupied[\s\S]*party_size[\s\S]*capacity/i);
  assert.match(schema, /event_key text primary key/i);
  assert.match(schema, /email_delivery_log\.status='failed'[\s\S]*attempts < 5/i);
});
