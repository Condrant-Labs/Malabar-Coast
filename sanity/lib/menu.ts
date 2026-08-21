import {getMenuItem, menuCategories, menuItems, type DietaryStatus, type MenuCategory, type MenuItem} from "@/app/lib/menu";
import {getSanityClient} from "./client";
import {checkoutMenuItemQuery, menuContentQuery} from "./queries";

export type CmsImage = {url: string; alt: string; dimensions?: {width: number; height: number; aspectRatio: number}};

export type MenuVoyageStop = {
  _key?: string;
  itemId: string;
  area: string;
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
  eyebrow: "A taste of Kerala · North to South",
  headingLineOne: "Six regions.",
  headingLineTwo: "One Kerala.",
  introduction: "Travel through six Kerala food landscapes, from Malabar's biriyani kitchens to Kuttanad's banana-leaf fish and the coconut-rich curries of the southern coast.",
  journeyLinkLabel: "Explore Kerala",
  manifestEyebrow: "The full menu",
  manifestHeading: "What we carry to the table.",
  manifestIntroduction: "The current Malabar Coast menu, prepared for sharing and available to order online where shown.",
  dietaryNotice: "Dietary labels are based on the supplied menu names and still require confirmation from the restaurant. Please tell the team about allergies before ordering; the kitchen handles all 14 regulated allergens and cross-contact may occur.",
  alcoholNotice: "Alcoholic-drink prices are not published online. Please ask the restaurant team for the current bar price list. Alcohol is not available through online ordering.",
  voyageStops: [
    {itemId: "biriyani-chicken", area: "Kozhikode", region: "North Malabar", coordinates: "11.2588° N · 75.7804° E", year: "The biriyani capital", course: "Malabar rice", image: {url: "/menu/calicut-pepper-prawns.png", alt: "A warmly spiced Malabar dish served with Kerala accompaniments"}, description: "Kozhikode is one of Malabar cuisine's great centres, celebrated for fragrant dum biriyani and generous coastal hospitality."},
    {itemId: "malabar-coast-signature-konju-coconut-fry", area: "Kannur", region: "North Kerala coast", coordinates: "11.8745° N · 75.3704° E", year: "Coconut and coast", course: "Coastal fry", image: {url: "/menu/malindi-sea-bass.png", alt: "Prawns cooked with coconut, curry leaves and Kerala spices"}, description: "A northern coastal plate of prawns, coconut and curry leaves, carrying the bold savoury character of Kerala's Arabian Sea shore."},
    {itemId: "desserts-palada-payasam", area: "Palakkad", region: "The Kerala gap", coordinates: "10.7867° N · 76.6548° E", year: "Rice and harvest", course: "Festive sweet", image: {url: "/menu/lisbon-custard-tart.png", alt: "Creamy palada payasam served as a Kerala festive dessert"}, description: "Slow-cooked rice ada and milk give this beloved festive payasam its gentle sweetness and unmistakably Keralite finish."},
    {itemId: "malabar-coast-signature-prawn-moilee", area: "Kochi", region: "Central Kerala coast", coordinates: "9.9312° N · 76.2673° E", year: "Harbour kitchen", course: "Coconut curry", image: {url: "/menu/mozambique-lobster.png", alt: "Prawns in a golden coconut moilee with curry leaves"}, description: "A harbour-side style of mild coconut curry, bright with ginger, green chilli and curry leaf around tender prawns."},
    {itemId: "malabar-coast-signature-fish-pollichathu", area: "Kuttanad", region: "Alappuzha backwaters", coordinates: "9.4981° N · 76.3388° E", year: "Below sea level", course: "Banana-leaf fish", image: {url: "/menu/scotland-haddock.png", alt: "Spiced fish wrapped and cooked in banana leaf"}, description: "Kuttanad's backwater cooking is closely associated with fish pollichathu: spice-coated fish wrapped in banana leaf and cooked until aromatic."},
    {itemId: "malabar-coast-signature-beef-roast", area: "Kottayam", region: "Central Travancore", coordinates: "9.5916° N · 76.5222° E", year: "Pepper country", course: "Slow roast", image: {url: "/menu/cape-malay-lamb.png", alt: "Kerala-style beef roast with black pepper, shallots and curry leaves"}, description: "Deep-roasted meat, black pepper, coconut and curry leaves evoke the robust Syrian-Christian kitchens of central Travancore."},
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
