import {site} from "@/app/lib/site";
import {getSanityClient} from "./client";
import {siteSettingsQuery} from "./queries";
import {sanitisePublicLink, type PublicContentLink} from "./links";

export type SiteLink = PublicContentLink;
export type SiteSettings = {
  restaurantName: string;
  legalName: string;
  shortDescription: string;
  description: string;
  siteUrl: string;
  phone: string;
  email: string;
  reservationEmail: string;
  address: {streetAddress: string; locality: string; region: string; postalCode: string; country: string};
  coordinates: {latitude: number; longitude: number};
  mapUrl: string;
  openingHours: Array<{days: string; hours: string}>;
  socialLinks: Array<{platform: string; url: string}>;
  primaryNavigation: SiteLink[];
  footerNavigation: SiteLink[];
  announcement: string;
  copyrightText: string;
  logo: {url: string; alt: string};
  lightLogo: {url: string; alt: string};
};

export const fallbackSiteSettings: SiteSettings = {
  restaurantName: site.name,
  legalName: site.legalName,
  shortDescription: site.shortDescription,
  description: site.description,
  siteUrl: site.url,
  phone: "",
  email: "reservations@malabarcoast.co.uk",
  reservationEmail: "reservations@malabarcoast.co.uk",
  address: {
    streetAddress: site.address.streetAddress,
    locality: site.address.addressLocality,
    region: site.address.addressRegion,
    postalCode: site.address.postalCode,
    country: site.address.addressCountry,
  },
  coordinates: site.geo,
  mapUrl: "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH",
  openingHours: [],
  socialLinks: [{platform: "Instagram", url: "https://www.instagram.com/malabarcoastuk"}],
  primaryNavigation: [
    {label: "Our story", href: "/story"},
    {label: "The menu", href: "/menu"},
    {label: "Offers", href: "/offers"},
    {label: "Book a table", href: "/book-a-table"},
    {label: "Our restaurant", href: "/restaurant"},
    {label: "Private hall", href: "/hall"},
    {label: "Good to know", href: "/faq"},
    {label: "Your order", href: "/checkout"},
  ],
  footerNavigation: [
    {label: "Payments", href: "/payments"},
    {label: "Returns", href: "/returns"},
    {label: "Cookie", href: "/cookie"},
    {label: "Privacy", href: "/privacy"},
  ],
  announcement: "",
  copyrightText: "© Malabar Coast 2026. All rights reserved.",
  logo: {url: "/malabar af.svg", alt: "Malabar Coast"},
  lightLogo: {url: "/logo-white.png", alt: "Malabar Coast"},
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const client = getSanityClient();
  if (!client) return fallbackSiteSettings;
  try {
    const settings = await client.fetch(siteSettingsQuery, {}, {next: {revalidate: 60, tags: ["sanity-site-settings"]}}) as Partial<SiteSettings> | null;
    if (!settings?.restaurantName) return fallbackSiteSettings;
    const safePrimaryNavigation = settings.primaryNavigation?.map(sanitisePublicLink).filter((link): link is SiteLink => Boolean(link)) ?? [];
    const safeFooterNavigation = settings.footerNavigation?.map(sanitisePublicLink).filter((link): link is SiteLink => Boolean(link)) ?? [];
    const primaryNavigation = safePrimaryNavigation.length ? safePrimaryNavigation : fallbackSiteSettings.primaryNavigation;
    const offersLink = {label: "Offers", href: "/offers"};
    const navigationWithOffers = primaryNavigation.some((link) => link.href === offersLink.href)
      ? primaryNavigation
      : [...primaryNavigation.slice(0, 2), offersLink, ...primaryNavigation.slice(2)];
    const bookingLink = {label: "Book a table", href: "/book-a-table"};
    const navigationWithBooking = navigationWithOffers.some((link) => link.href === bookingLink.href)
      ? navigationWithOffers
      : [...navigationWithOffers.slice(0, 3), bookingLink, ...navigationWithOffers.slice(3)];
    return {
      ...fallbackSiteSettings,
      ...settings,
      address: {...fallbackSiteSettings.address, ...(settings.address ?? {})},
      coordinates: {...fallbackSiteSettings.coordinates, ...(settings.coordinates ?? {})},
      logo: settings.logo?.url ? settings.logo : fallbackSiteSettings.logo,
      lightLogo: settings.lightLogo?.url ? settings.lightLogo : fallbackSiteSettings.lightLogo,
      primaryNavigation: navigationWithBooking,
      footerNavigation: safeFooterNavigation.length ? safeFooterNavigation : fallbackSiteSettings.footerNavigation,
      socialLinks: settings.socialLinks?.length ? settings.socialLinks : fallbackSiteSettings.socialLinks,
    };
  } catch (error) {
    console.error("Sanity site settings fetch failed; using the checked-in site fallback.", error instanceof Error ? error.name : "UnknownError");
    return fallbackSiteSettings;
  }
}
