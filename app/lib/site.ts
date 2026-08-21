const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveSiteUrl() {
  try {
    return new URL(configuredSiteUrl || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const site = {
  name: "Malabar Coast",
  legalName: "Malabar Coast",
  url: resolveSiteUrl(),
  description:
    "Malabar Coast is a Southern Indian coastal restaurant in Holytown, Scotland, serving Kerala-inspired seafood, curries, biriyani and plant-based dishes.",
  shortDescription: "Southern Indian coastal cooking from Malabar to Scotland.",
  cuisine: ["South Indian", "Kerala", "Indian", "Seafood"],
  priceRange: "££",
  lastUpdated: "2026-08-21",
  address: {
    streetAddress: "33 Main Street",
    addressLocality: "Holytown",
    addressRegion: "North Lanarkshire",
    postalCode: "ML1 4TH",
    addressCountry: "GB",
  },
  geo: {
    latitude: 55.8207,
    longitude: -3.9735,
  },
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, `${site.url}/`).toString();
}

