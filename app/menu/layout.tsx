import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { absoluteUrl, site } from "../lib/site";
import { getMenuContent } from "@/sanity/lib/menu";

export const metadata: Metadata = {
  title: "South Indian Menu",
  description:
    "Explore Malabar Coast's current Southern Indian menu in Holytown, with Kerala seafood, curries, biriyani, vegetarian choices and published food prices.",
  alternates: { canonical: "/menu" },
  openGraph: {
    type: "website",
    url: "/menu",
    title: "South Indian Menu | Malabar Coast Holytown",
    description: "Kerala-inspired seafood, curries, biriyani and vegetarian choices with current food prices and clear dietary-review notices.",
    images: ["/menu/calicut-pepper-prawns.png"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Menu", item: absoluteUrl("/menu") },
  ],
};

export default async function MenuLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const {categories, items} = await getMenuContent();
  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${absoluteUrl("/menu")}#menu`,
    name: "Malabar Coast menu",
    url: absoluteUrl("/menu"),
    inLanguage: "en-GB",
    dateModified: site.lastUpdated,
    mainEntityOfPage: absoluteUrl("/menu"),
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.title,
      description: category.description,
      hasMenuItem: items.filter((item) => item.category === category.slug).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description || undefined,
        identifier: item.id,
        ...(item.pricePence !== null && !item.hidePrice ? {offers: {
          "@type": "Offer",
          price: (item.pricePence / 100).toFixed(2),
          priceCurrency: "GBP",
          availability: item.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${absoluteUrl("/menu")}#${category.slug}`,
        }} : {}),
      })),
    })),
  };
  return (
    <>
      <JsonLd data={[menuSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}

