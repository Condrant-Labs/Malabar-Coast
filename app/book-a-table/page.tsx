import type { Metadata } from "next";
import { TableBookingForm } from "../components/table-booking-form";
import { getBookingSettings } from "../lib/booking-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book a Table", description: "Reserve a table at Malabar Coast in Holytown.", alternates: { canonical: "/book-a-table" } };

export default async function BookATablePage() {
  const settings = await getBookingSettings();
  return <main className="bookingPage">
    <section className="bookingIntro"><p>Tables · Holytown</p><h1>Come sit<br />by the coast.</h1><span>Choose a date, arrival time and party size. We check the restaurant&apos;s live {settings.capacity}-seat capacity before confirming your table.</span></section>
    <section className="bookingWorkspace"><div><p>Before you book</p><h2>A table prepared<br />for your people.</h2><ul><li><b>{settings.sittingMinutes} minutes</b><span>Reserved for each table</span></li><li><b>Up to {settings.maximumPartySize}</b><span>Guests per online booking</span></li><li><b>{Math.ceil(settings.minimumLeadMinutes/60)} hours</b><span>Minimum booking notice</span></li></ul></div><div className="bookingFormCard"><TableBookingForm settings={settings} /></div></section>
  </main>;
}
