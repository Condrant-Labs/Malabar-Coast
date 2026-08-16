import {faqItems as fallbackFaqItems} from "@/app/lib/faq";
import {getSanityClient} from "./client";
import {faqItemsQuery} from "./queries";

export type FaqItem = {id: string; question: string; answer: string; category?: string};

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getFaqItems(): Promise<FaqItem[]> {
  const client = getSanityClient();
  if (!client) return [...fallbackFaqItems];
  try {
    const items = await client.fetch(faqItemsQuery, {}, {next: {revalidate: 60, tags: ["sanity-faq"]}}) as Array<Omit<FaqItem, "id">>;
    return items?.length ? items.map((item) => ({...item, id: slugify(item.question)})) : [...fallbackFaqItems];
  } catch (error) {
    console.error("Sanity FAQ fetch failed; using checked-in answers.", error instanceof Error ? error.name : "UnknownError");
    return [...fallbackFaqItems];
  }
}
