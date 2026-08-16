import {getSanityClient} from "./client";
import {testimonialsQuery} from "./queries";

export type TestimonialRecord = {
  rating: string;
  ratingLabel: string;
  ratingCount: string;
  text: string;
  author: string;
  role: string;
  sources: ReadonlyArray<{url: string; label: string}>;
};

export async function getTestimonials(): Promise<TestimonialRecord[] | undefined> {
  const client = getSanityClient();
  if (!client) return undefined;
  try {
    const records = await client.fetch(testimonialsQuery, {}, {next: {revalidate: 60, tags: ["sanity-testimonials"]}}) as Array<{quote?: string; name?: string; source?: string; rating?: number}>;
    if (!records || records.length < 2) return undefined;
    return records.filter((record) => record.quote && record.name && typeof record.rating === "number").map((record) => ({
      rating: record.rating!.toFixed(2).replace(/0$/, ""),
      ratingLabel: `Rated ${record.rating} out of 5`,
      ratingCount: "Published guest rating",
      text: record.quote!,
      author: record.name!,
      role: record.source || "Guest record",
      sources: [],
    }));
  } catch (error) {
    console.error("Sanity testimonials fetch failed; using checked-in guest records.", error instanceof Error ? error.name : "UnknownError");
    return undefined;
  }
}
