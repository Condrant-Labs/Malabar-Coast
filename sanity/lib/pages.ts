import {getSanityClient} from "./client";
import type {CmsImage} from "./menu";
import {marketingPageQuery} from "./queries";
import type {SiteLink} from "./site";

type PortableTextSpan = {_type?: string; text?: string};
type PortableTextBlock = {_type?: string; children?: PortableTextSpan[]};

export type MarketingSection = {
  _key: string;
  _type: "contentSection" | "callToAction";
  internalName?: string;
  eyebrow?: string;
  heading?: string;
  body?: PortableTextBlock[];
  text?: string;
  image?: CmsImage;
  secondaryImage?: CmsImage;
  links?: SiteLink[];
  primaryLink?: SiteLink;
  secondaryLink?: SiteLink;
  shortLabel?: string;
  note?: string;
  theme?: string;
};

export type MarketingPage = {
  pageKey: string;
  title: string;
  eyebrow?: string;
  heroHeading?: string;
  heroText?: string;
  heroImage?: CmsImage;
  heroPrimaryLink?: SiteLink;
  heroSecondaryLink?: SiteLink;
  sections?: MarketingSection[];
};

export async function getMarketingPage(pageKey: string): Promise<MarketingPage | null> {
  const client = getSanityClient();
  if (!client) return null;
  try {
    return await client.fetch(marketingPageQuery, {pageKey}, {next: {revalidate: 60, tags: [`sanity-page-${pageKey}`]}}) as MarketingPage | null;
  } catch (error) {
    console.error(`Sanity ${pageKey} page fetch failed; using checked-in page copy.`, error instanceof Error ? error.name : "UnknownError");
    return null;
  }
}

export function getPageSection(page: MarketingPage | null, key: string) {
  return page?.sections?.find((section) => section._key === key);
}

export function portableTextToPlainText(blocks?: PortableTextBlock[]) {
  return blocks?.map((block) => block.children?.map((child) => child.text || "").join("") || "").filter(Boolean).join("\n\n") || "";
}
