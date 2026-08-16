import {getMenuItem, menuCategories, menuItems, type DietaryStatus, type MenuCategory, type MenuItem} from "@/app/lib/menu";
import {getSanityClient} from "./client";
import {checkoutMenuItemQuery, menuContentQuery} from "./queries";

export type CmsImage = {url: string; alt: string; dimensions?: {width: number; height: number; aspectRatio: number}};

export type MenuVoyageStop = {
  itemId: string;
  port: string;
  region: string;
  coordinates: string;
  year: string;
  course: string;
  image: CmsImage | {url: string; alt: string};
  description: string;
};

export type MenuPageContent = {
  eyebrow: string;
  headingLineOne: string;
  headingLineTwo: string;
  introduction: string;
  journeyLinkLabel: string;
  manifestEyebrow: string;
  manifestHeading: string;
  manifestIntroduction: string;
  dietaryNotice: string;
  alcoholNotice: string;
  voyageStops: MenuVoyageStop[];
};

const fallbackMenuPage: MenuPageContent = {
  eyebrow: "The culinary passage · East to West",
  headingLineOne: "Six ports.",
  headingLineTwo: "One table.",
  introduction: "A menu plotted across the old sea road. Each port leaves something on the plate: pepper, coconut, fire, smoke — and finally, Scotland.",
  journeyLinkLabel: "Begin the voyage",
  manifestEyebrow: "The full menu",
  manifestHeading: "What we carry to the table.",
  manifestIntroduction: "The current Malabar Coast menu, prepared for sharing and available to order online where shown.",
  dietaryNotice: "Dietary labels are based on the supplied menu names and still require confirmation from the restaurant. Please tell the team about allergies before ordering; the kitchen handles all 14 regulated allergens and cross-contact may occur.",
  alcoholNotice: "Alcoholic-drink prices are not published online. Please ask the restaurant team for the current bar price list. Alcohol is not available through online ordering.",
  voyageStops: [
    {itemId: "malabar-coast-signature-konju-coconut-fry", port: "Calicut", region: "Malabar Coast · India", coordinates: "11.2588° N · 75.7804° E", year: "The point of origin", course: "House signature", image: {url: "/menu/calicut-pepper-prawns.png", alt: "Prawns with curry leaves and charred lime"}, description: "Coastal spice, coconut and the bright heat of the Malabar shore."},
    {itemId: "malabar-coast-signature-masala-grilled-fish", port: "Malindi", region: "Swahili Coast · Kenya", coordinates: "3.2192° S · 40.1169° E", year: "Across the monsoon", course: "From the sea", image: {url: "/menu/malindi-sea-bass.png", alt: "Masala grilled fish with herbs and citrus"}, description: "Malabar seasoning meets the fire-led cooking of the Swahili coast."},
    {itemId: "malabar-coast-signature-prawn-moilee", port: "Mozambique", region: "Mozambique Island", coordinates: "15.0360° S · 40.7327° E", year: "The chilli passage", course: "Coastal curry", image: {url: "/menu/mozambique-lobster.png", alt: "Coastal shellfish with fragrant rice and lime"}, description: "A coconut-led coastal curry remembering the old Indian Ocean passage."},
    {itemId: "malabar-coast-signature-aattirachi-kurumulak", port: "The Cape", region: "Cape of Good Hope", coordinates: "34.3568° S · 18.4740° E", year: "Where two oceans meet", course: "From the land", image: {url: "/menu/cape-malay-lamb.png", alt: "Pepper-spiced lamb with flaky porotta"}, description: "Lamb and black pepper carried around the Cape in a deeply warming plate."},
    {itemId: "desserts-malabar-coast-special-dessert", port: "Lisbon", region: "Tagus · Portugal", coordinates: "38.7223° N · 9.1393° W", year: "Landfall in Europe", course: "Sweet passage", image: {url: "/menu/lisbon-custard-tart.png", alt: "A warm spiced dessert"}, description: "A sweet finish shaped by the same spice route."},
    {itemId: "malabar-coast-signature-meen-moilee", port: "Holytown", region: "Scotland · The new coast", coordinates: "55.8207° N · 3.9735° W", year: "The voyage continues", course: "Our coast", image: {url: "/menu/scotland-haddock.png", alt: "Fish in a golden coconut moilee"}, description: "Kerala coconut and Scottish hospitality brought to one table."},
  ],
};

type RawMenuItem = Partial<MenuItem> & {
  id?: string;
  category?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  spiceLevel?: string;
};

function normaliseItem(raw: RawMenuItem): MenuItem | null {
  if (!raw.id || !raw.category || !raw.name) return null;
  const fallback = getMenuItem(raw.id);
  const isAlcoholic = raw.isAlcoholic ?? fallback?.isAlcoholic ?? false;
  const dietaryStatus: DietaryStatus = isAlcoholic
    ? "notApplicable"
    : raw.isVegan
      ? "vegan"
      : raw.isVegetarian
        ? "vegetarian"
        : raw.dietaryStatus ?? fallback?.dietaryStatus ?? "nonVegetarian";
  const pricePence = isAlcoholic ? null : typeof raw.pricePence === "number" ? raw.pricePence : raw.pricePence === null ? null : fallback?.pricePence ?? null;
  return {
    id: raw.id,
    category: raw.category,
    name: raw.name,
    description: raw.description ?? fallback?.description ?? "",
    subheading: raw.subheading ?? fallback?.subheading,
    pricePence,
    priceLabel: isAlcoholic ? "Ask our team" : raw.priceLabel ?? fallback?.priceLabel,
    hidePrice: isAlcoholic || (raw.hidePrice ?? fallback?.hidePrice ?? false),
    isAlcoholic,
    dietaryStatus,
    dietaryReviewStatus: raw.dietaryReviewStatus ?? fallback?.dietaryReviewStatus ?? "needs-review",
    dietary: dietaryStatus === "vegan" ? ["VG"] : dietaryStatus === "vegetarian" ? ["V"] : [],
    allergens: Array.isArray(raw.allergens) ? raw.allergens : fallback?.allergens ?? [],
    spice: ((raw.spiceLevel || raw.spice || fallback?.spice || "None").replace(/^./, (character) => character.toUpperCase())) as MenuItem["spice"],
    available: raw.available ?? fallback?.available ?? true,
    onlineOrdering: !isAlcoholic && pricePence !== null && (raw.onlineOrdering ?? fallback?.onlineOrdering ?? true),
    featured: raw.featured ?? fallback?.featured ?? false,
    displayOrder: raw.displayOrder ?? fallback?.displayOrder ?? 0,
  };
}

export async function getMenuContent() {
  const client = getSanityClient();
  if (!client) return {categories: menuCategories, items: menuItems, page: fallbackMenuPage, source: "fallback" as const};

  try {
    const result = await client.fetch(menuContentQuery, {}, {next: {revalidate: 60, tags: ["sanity-menu"]}}) as {
      categories?: Array<Partial<MenuCategory>>;
      items?: RawMenuItem[];
      page?: Partial<MenuPageContent>;
    };
    const cmsCategories = (result.categories ?? []).filter((category): category is MenuCategory => Boolean(category.slug && category.title));
    const categories = cmsCategories.length ? cmsCategories.map((category, index) => ({
      slug: category.slug,
      title: category.title,
      note: category.note || category.title,
      description: category.description || "",
      orderRank: category.orderRank ?? index,
      number: menuCategories[index]?.number || String(index + 1),
    })) : menuCategories;
    const cmsItems = (result.items ?? []).map(normaliseItem).filter((entry): entry is MenuItem => Boolean(entry));
    const items = cmsItems.length ? cmsItems : menuItems;
    const page = {...fallbackMenuPage, ...(result.page ?? {}), voyageStops: result.page?.voyageStops?.length ? result.page.voyageStops : fallbackMenuPage.voyageStops};
    return {categories, items, page, source: "sanity" as const};
  } catch (error) {
    console.error("Sanity menu fetch failed; using the checked-in menu fallback.", error instanceof Error ? error.name : "UnknownError");
    return {categories: menuCategories, items: menuItems, page: fallbackMenuPage, source: "fallback" as const};
  }
}

export async function getCheckoutMenuItem(id: string) {
  const fallback = getMenuItem(id);
  const client = getSanityClient();
  if (!client) return fallback;

  try {
    const raw = await client.fetch(checkoutMenuItemQuery, {id}, {cache: "no-store"}) as RawMenuItem | null;
    if (!raw) return undefined;
    return normaliseItem({...fallback, ...raw});
  } catch (error) {
    console.error("Sanity checkout catalogue fetch failed; using the checked-in price fallback.", error instanceof Error ? error.name : "UnknownError");
    return fallback;
  }
}

export {fallbackMenuPage};
