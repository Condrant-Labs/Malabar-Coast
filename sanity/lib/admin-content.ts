import {defineQuery} from "next-sanity";
import {getSanityClient} from "./client";

export type AdminMenuRecord = {
  _id: string;
  name: string;
  category?: string;
  categorySlug?: string;
  pricePence?: number | null;
  available: boolean;
  onlineOrdering: boolean;
  featured: boolean;
  isAlcoholic: boolean;
  updatedAt: string;
};

export type AdminPromotionRecord = {
  _id: string;
  title: string;
  status: "active" | "paused";
  showOnHomepage: boolean;
  startsAt?: string;
  endsAt?: string;
  updatedAt: string;
  poster?: {url?: string; alt?: string};
};

export type AdminPageRecord = {
  _id: string;
  _type: "marketingPage" | "legalPage";
  title: string;
  pageKey: string;
  updatedAt: string;
};

export type AdminContentOverview = {
  menuItems: AdminMenuRecord[];
  promotions: AdminPromotionRecord[];
  pages: AdminPageRecord[];
  categoryCount: number;
  faqCount: number;
  testimonialCount: number;
  hasMenuPage: boolean;
  hasSiteSettings: boolean;
};

export const adminContentOverviewQuery = defineQuery(`{
  "menuItems": *[_type == "menuItem"] | order(category->orderRank asc, displayOrder asc, name asc) {
    _id,
    name,
    "category": category->title,
    "categorySlug": category->slug.current,
    pricePence,
    "available": coalesce(available, true),
    "onlineOrdering": coalesce(onlineOrdering, true),
    "featured": coalesce(featured, false),
    "isAlcoholic": coalesce(isAlcoholic, false),
    "updatedAt": _updatedAt
  },
  "promotions": *[_type == "promotion"] | order(displayOrder asc, _updatedAt desc) {
    _id,
    title,
    "status": coalesce(status, "paused"),
    "showOnHomepage": coalesce(showOnHomepage, false),
    startsAt,
    endsAt,
    "updatedAt": _updatedAt,
    poster {alt, "url": asset->url}
  },
  "pages": *[_type in ["marketingPage", "legalPage"]] | order(_type asc, pageKey asc) {
    _id,
    _type,
    title,
    pageKey,
    "updatedAt": _updatedAt
  },
  "categoryCount": count(*[_type == "menuCategory"]),
  "faqCount": count(*[_type == "faqItem"]),
  "testimonialCount": count(*[_type == "testimonial"]),
  "hasMenuPage": defined(*[_id == "menuPage"][0]._id),
  "hasSiteSettings": defined(*[_id == "siteSettings"][0]._id)
}`);

export async function getAdminContentOverview(): Promise<AdminContentOverview | null> {
  const client = getSanityClient();
  if (!client) return null;

  try {
    return await client.fetch(adminContentOverviewQuery, {}, {cache: "no-store"}) as AdminContentOverview;
  } catch (error) {
    console.error("Sanity admin content overview could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return null;
  }
}
