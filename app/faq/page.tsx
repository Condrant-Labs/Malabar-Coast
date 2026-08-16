import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { absoluteUrl, site } from "../lib/site";
import {getFaqItems} from "@/sanity/lib/faq";

export const metadata: Metadata = {
  title: "Restaurant FAQs",
  description:
    "Answers about Malabar Coast in Holytown, including cuisine, location, private hall, ordering, delivery, dietary choices, allergens and spice levels.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: "/faq",
    title: "Restaurant FAQs | Malabar Coast",
    description: "Clear answers about dining, the private event hall, ordering and Southern Indian coastal food at Malabar Coast.",
    images: ["/restaurant/table-for-two.png"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Restaurant FAQs", item: absoluteUrl("/faq") },
  ],
};

export default async function FaqPage() {
  const faqItems = await getFaqItems();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl("/faq")}#faq`,
    url: absoluteUrl("/faq"),
    name: "Malabar Coast restaurant frequently asked questions",
    datePublished: site.lastUpdated,
    dateModified: site.lastUpdated,
    inLanguage: "en-GB",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      "@id": `${absoluteUrl("/faq")}#${item.id}`,
      name: item.question,
      datePublished: site.lastUpdated,
      dateModified: site.lastUpdated,
      acceptedAnswer: {"@type": "Answer", text: item.answer},
    })),
  };
  return (
    <main className="faqPage">
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <header className="faqHero">
        <p>Good to know · Clear answers</p>
        <h1 aria-label="Before you come ashore."><span>Before you</span><span>come ashore.</span></h1>
        <div>
          <p>
            Direct answers about the food, private hall, dietary choices, location and ordering
            at Malabar Coast in Holytown.
          </p>
          <time dateTime={site.lastUpdated}>Last reviewed 2 August 2026</time>
        </div>
      </header>

      <section className="faqList" aria-label="Frequently asked questions">
        {faqItems.map((item, index) => (
          <details id={item.id} key={item.id} open={index === 0}>
            <summary>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{item.question}</h2>
              <i aria-hidden="true" />
            </summary>
            <div>
              <p>{item.answer}</p>
              <a href={`#${item.id}`} aria-label={`Permanent link to ${item.question}`}>Permanent answer link</a>
            </div>
          </details>
        ))}
      </section>

      <footer className="faqFooter">
        <p>Ready for the table?</p>
        <h2>Follow the flavour.</h2>
        <div>
          <Link href="/menu">Explore the menu <span aria-hidden="true">↗</span></Link>
          <Link href="/hall">Explore the private hall <span aria-hidden="true">↗</span></Link>
          <Link href="/restaurant#location">Plan your visit <span aria-hidden="true">→</span></Link>
        </div>
      </footer>
    </main>
  );
}
