import {createReadStream, existsSync} from "node:fs";
import {basename, join} from "node:path";
import {createClient} from "next-sanity";
import {faqItems} from "../app/lib/faq";
import {menuCategories, menuItems} from "../app/lib/menu";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();

if (!projectId || !token) throw new Error("Sanity project configuration or server token is missing.");

const client = createClient({projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false});
const publicDirectory = join(process.cwd(), "public");

const imageFiles = {
  logo: "malabar af.svg",
  lightLogo: "logo-white.png",
  hero: "malabar-restaurant-hero-v2.jpg",
  hallOne: "Hall1.jpeg",
  hallTwo: "Hall2.jpeg",
  hallThree: "Hall3.jpeg",
  diningRoom: "restaurant/dining-room.png",
  tableForTwo: "restaurant/table-for-two.png",
  archedPassage: "restaurant/arched-passage.png",
  storyPort: "story/calicut-spice-port.png",
  storyPepper: "story/pepper-balance.png",
  storyGhats: "story/western-ghats.png",
  calicutPrawns: "menu/calicut-pepper-prawns.png",
  malindiFish: "menu/malindi-sea-bass.png",
  mozambiqueShellfish: "menu/mozambique-lobster.png",
  capeLamb: "menu/cape-malay-lamb.png",
  lisbonDessert: "menu/lisbon-custard-tart.png",
  scotlandFish: "menu/scotland-haddock.png",
} as const;

type AssetKey = keyof typeof imageFiles;
const assetIds = new Map<AssetKey, string>();

async function uploadImage(key: AssetKey) {
  const relativePath = imageFiles[key];
  const absolutePath = join(publicDirectory, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Missing website image: ${relativePath}`);
  const filename = basename(relativePath);
  const existingId = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename});
  if (existingId) {
    assetIds.set(key, existingId);
    return existingId;
  }
  const asset = await client.assets.upload("image", createReadStream(absolutePath), {filename});
  assetIds.set(key, asset._id);
  return asset._id;
}

function image(key: AssetKey, alt: string) {
  const assetId = assetIds.get(key);
  if (!assetId) throw new Error(`Image was not uploaded: ${key}`);
  return {_type: "image", asset: {_type: "reference", _ref: assetId}, alt};
}

function block(text: string, key: string) {
  return {_type: "block", _key: key, style: "normal", markDefs: [], children: [{_type: "span", _key: `${key}-text`, text, marks: []}]};
}

async function upsertByField(type: string, field: string, value: string, document: Record<string, unknown>) {
  const existingId = await client.fetch<string | null>(`*[_type == $type && ${field} == $value][0]._id`, {type, value});
  if (existingId) {
    await client.patch(existingId).set(document).commit();
    return existingId;
  }
  const created = await client.create({_type: type, ...document});
  return created._id;
}

const pageSeeds = () => [
  {
    pageKey: "home",
    title: "Home",
    eyebrow: "Southern Indian coastal kitchen · Holytown",
    heroHeading: "From the Malabar Coast to Scotland.",
    heroText: "Kerala's pepper, coconut, curry leaf and hospitality, served at 33 Main Street in Holytown.",
    heroImage: image("hero", "A Kerala-inspired restaurant table with coastal dishes in a warm dining room"),
    heroPrimaryLink: {_type: "link", label: "Explore the menu", href: "/menu", openInNewTab: false},
    heroSecondaryLink: {_type: "link", label: "Plan your visit", href: "/#reservations", openInNewTab: false},
    sections: [
      {_type: "contentSection", _key: "home-overview", internalName: "What is Malabar Coast?", eyebrow: "Our restaurant", heading: "What is Malabar Coast?", body: [block("Malabar Coast is a Southern Indian coastal restaurant in Holytown, rooted in Kerala's food, welcome and Indian Ocean history.", "overview-copy")], image: image("diningRoom", "The warmly lit Malabar Coast dining room")},
      {_type: "contentSection", _key: "home-menu", internalName: "Signature menu", eyebrow: "From our kitchen", heading: "Come to the table.", body: [block("Pepper warmed over fire, coconut softened with lime and dishes prepared for sharing.", "menu-copy")], image: image("calicutPrawns", "A coastal prawn dish with curry leaf")},
      {_type: "contentSection", _key: "home-story", internalName: "Coastal story", eyebrow: "Our story", heading: "A coast that changed the table.", body: [block("Follow the old sea road from Calicut to the new coast in Scotland.", "story-copy")], image: image("storyPort", "A rain-washed historic spice port on the Malabar Coast")},
      {_type: "callToAction", _key: "home-reservations", eyebrow: "Reservations", heading: "Your table by the coast.", text: "Reservation details and opening hours can be updated here when confirmed by the restaurant.", primaryLink: {_type: "link", label: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH", openInNewTab: true}, image: image("tableForTwo", "An intimate table for two at Malabar Coast")},
    ],
    seo: {title: "Malabar Coast | Southern Indian Restaurant in Holytown", description: "Southern Indian coastal cooking from Malabar to Scotland."},
  },
  {
    pageKey: "restaurant",
    title: "Restaurant",
    eyebrow: "Our restaurant · Holytown",
    heroHeading: "Let us take you to the coast.",
    heroText: "A neighbourhood dining room for the bright, generous cooking of Kerala and India's southern coast.",
    heroImage: image("diningRoom", "The warmly lit Malabar Coast dining room with teak, cane and brass details"),
    sections: [
      {_type: "contentSection", _key: "restaurant-welcome", internalName: "Welcome", eyebrow: "A warm arrival", heading: "Welcomed like home.", body: [block("Come for a quick supper, a long family table or a celebration. The welcome is relaxed, the plates are made for sharing, and there is always room for one more.", "welcome-copy")], image: image("tableForTwo", "A warm table setting at Malabar Coast")},
      {_type: "contentSection", _key: "restaurant-room", internalName: "The room", eyebrow: "Material and memory", heading: "Grounded in the coast.", body: [block("Dark teak, aged brass, cane, lime plaster, linen and laterite tones bring Kerala's textures into a contemporary Scottish dining room.", "room-copy")], image: image("archedPassage", "A plaster arch and teak screen leading into the dining room")},
      {_type: "callToAction", _key: "restaurant-hall", eyebrow: "Private gatherings", heading: "A room of your own.", text: "A flexible private hall with a built-in bar, raised stage and open floor.", primaryLink: {_type: "link", label: "Explore the private hall", href: "/hall", openInNewTab: false}, image: image("hallThree", "The private hall with stage and flexible seating")},
    ],
    seo: {title: "Restaurant in Holytown", description: "Coastal South Indian cooking and warm hospitality at Malabar Coast in Holytown."},
  },
  {
    pageKey: "hall",
    title: "Private hall",
    eyebrow: "Private gatherings · Holytown",
    heroHeading: "A room of your own.",
    heroText: "A flexible event space within the restaurant with a built-in wooden bar, raised stage and open floor.",
    heroImage: image("hallOne", "The private hall at Malabar Coast with an open floor and built-in wooden bar"),
    sections: [
      {_type: "contentSection", _key: "hall-intro", internalName: "Gather by the coast", eyebrow: "The private hall", heading: "Gather by the coast.", body: [block("The room can move from an open reception to seated arrangements without losing its warm, understated character. Capacity, packages, catering choices and pricing remain subject to restaurant confirmation.", "hall-copy")], image: image("hallOne", "Open floor and built-in bar in the private hall")},
      {_type: "contentSection", _key: "hall-stage", internalName: "The stage", eyebrow: "A natural focal point", heading: "A natural focal point.", body: [block("The raised stage anchors the far end of the room for speeches, presentations and moments shared together.", "stage-copy")], image: image("hallTwo", "Wide view of the event hall showing its open floor and raised stage")},
      {_type: "contentSection", _key: "hall-gallery", internalName: "Set the scene", eyebrow: "The room", heading: "Set the scene.", image: image("hallThree", "The raised stage with chairs arranged across the hall floor")},
    ],
    seo: {title: "Private Event Hall in Holytown", description: "A private event hall at Malabar Coast with a bar, stage and flexible floor."},
  },
  {
    pageKey: "story",
    title: "Our story",
    eyebrow: "Our story · Chapter I",
    heroHeading: "A coast that changed the table.",
    heroText: "A coastline shaped by rain, trade and welcome, where food became a language long before it became a menu.",
    heroImage: image("storyPort", "A rain-washed historic spice port on the Malabar Coast"),
    sections: [
      {_type: "contentSection", _key: "story-pepper", internalName: "Pepper", eyebrow: "Chapter I", heading: "The pepper coast", body: [block("For over 3,000 years, travellers came for black pepper, cardamom, cinnamon and cloves.", "pepper-copy")], image: image("storyPepper", "Black pepper and coastal ingredients")},
      {_type: "contentSection", _key: "story-monsoon", internalName: "Monsoon", eyebrow: "Chapter II", heading: "The monsoon road", body: [block("Seasonal winds connected the Malabar Coast with distant ports across the Indian Ocean.", "monsoon-copy")], image: image("storyGhats", "The green Western Ghats in monsoon weather")},
      {_type: "callToAction", _key: "story-table", eyebrow: "The story made edible", heading: "History, served warm.", text: "The old sea road is still present in the pepper, coconut and cardamom cooked with every day.", primaryLink: {_type: "link", label: "View the menu", href: "/menu", openInNewTab: false}, image: image("scotlandFish", "Fish in a golden coastal curry")},
    ],
    seo: {title: "Our Story: From Malabar to Scotland", description: "Follow the food story from Calicut's spice ports to the Malabar Coast table in Holytown."},
  },
];

async function seed() {
  for (const key of Object.keys(imageFiles) as AssetKey[]) await uploadImage(key);

  const categoryIds = new Map<string, string>();
  for (const category of menuCategories) {
    const id = await upsertByField("menuCategory", "slug.current", category.slug, {
      title: category.title,
      slug: {_type: "slug", current: category.slug},
      shortTitle: category.note,
      eyebrow: category.note,
      description: category.description,
      orderRank: category.orderRank,
      published: true,
    });
    categoryIds.set(category.slug, id);
  }

  const itemIds = new Map<string, string>();
  const itemImages: Partial<Record<string, {key: AssetKey; alt: string}>> = {
    "malabar-coast-signature-konju-coconut-fry": {key: "calicutPrawns", alt: "A coastal prawn dish with curry leaf"},
    "malabar-coast-signature-masala-grilled-fish": {key: "malindiFish", alt: "Masala grilled fish with herbs and citrus"},
    "malabar-coast-signature-prawn-moilee": {key: "mozambiqueShellfish", alt: "Coastal shellfish with fragrant rice and lime"},
    "malabar-coast-signature-aattirachi-kurumulak": {key: "capeLamb", alt: "Pepper-spiced lamb with flaky porotta"},
    "desserts-malabar-coast-special-dessert": {key: "lisbonDessert", alt: "A warm spiced dessert"},
    "malabar-coast-signature-meen-moilee": {key: "scotlandFish", alt: "Fish in a golden coconut moilee"},
  };
  for (const menuItem of menuItems) {
    const categoryId = categoryIds.get(menuItem.category);
    if (!categoryId) throw new Error(`Category reference missing for ${menuItem.id}`);
    const imageSeed = itemImages[menuItem.id];
    const document: Record<string, unknown> = {
      name: menuItem.name,
      slug: {_type: "slug", current: menuItem.id},
      sourceKey: menuItem.id,
      category: {_type: "reference", _ref: categoryId},
      description: menuItem.description,
      subheading: menuItem.subheading,
      pricePence: menuItem.isAlcoholic ? null : menuItem.pricePence,
      priceLabel: menuItem.priceLabel,
      hidePrice: menuItem.isAlcoholic || menuItem.hidePrice,
      isAlcoholic: menuItem.isAlcoholic,
      isVegetarian: menuItem.dietaryStatus === "vegetarian" || menuItem.dietaryStatus === "vegan",
      isVegan: menuItem.dietaryStatus === "vegan",
      dietaryReviewStatus: "needs-review",
      dietaryNotes: menuItem.dietaryStatus === "notApplicable" ? "Dietary label not applicable." : "Classification inferred from the supplied menu name; the restaurant must confirm the current recipe.",
      allergens: [],
      allergenNotes: "The supplied menu did not include a confirmed allergen matrix. Restaurant confirmation is required before publishing allergens.",
      spiceLevel: "none",
      available: menuItem.available,
      onlineOrdering: menuItem.onlineOrdering,
      featured: menuItem.featured,
      displayOrder: menuItem.displayOrder,
      ...(imageSeed ? {image: image(imageSeed.key, imageSeed.alt)} : {}),
    };
    const id = await upsertByField("menuItem", "sourceKey", menuItem.id, document);
    itemIds.set(menuItem.id, id);
  }

  const voyageSeeds = [
    ["malabar-coast-signature-konju-coconut-fry", "Calicut", "Malabar Coast · India", "11.2588° N · 75.7804° E", "The point of origin", "House signature", "calicutPrawns", "A coastal prawn dish with curry leaf", "Coastal spice, coconut and the bright heat of the Malabar shore."],
    ["malabar-coast-signature-masala-grilled-fish", "Malindi", "Swahili Coast · Kenya", "3.2192° S · 40.1169° E", "Across the monsoon", "From the sea", "malindiFish", "Masala grilled fish with herbs and citrus", "Malabar seasoning meets the fire-led cooking of the Swahili coast."],
    ["malabar-coast-signature-prawn-moilee", "Mozambique", "Mozambique Island", "15.0360° S · 40.7327° E", "The chilli passage", "Coastal curry", "mozambiqueShellfish", "Coastal shellfish with fragrant rice and lime", "A coconut-led curry remembering the old Indian Ocean passage."],
    ["malabar-coast-signature-aattirachi-kurumulak", "The Cape", "Cape of Good Hope", "34.3568° S · 18.4740° E", "Where two oceans meet", "From the land", "capeLamb", "Pepper-spiced lamb with flaky porotta", "Lamb and black pepper carried around the Cape in a deeply warming plate."],
    ["desserts-malabar-coast-special-dessert", "Lisbon", "Tagus · Portugal", "38.7223° N · 9.1393° W", "Landfall in Europe", "Sweet passage", "lisbonDessert", "A warm spiced dessert", "A sweet finish shaped by the same spice route."],
    ["malabar-coast-signature-meen-moilee", "Holytown", "Scotland · The new coast", "55.8207° N · 3.9735° W", "The voyage continues", "Our coast", "scotlandFish", "Fish in a golden coconut moilee", "Kerala coconut and Scottish hospitality brought to one table."],
  ] as const;
  await client.createOrReplace({
    _id: "menuPage",
    _type: "menuPage",
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
    voyageStops: voyageSeeds.map(([itemId, port, region, coordinates, yearLabel, courseLabel, imageKey, alt, description], index) => ({
      _type: "object", _key: `voyage-${index + 1}`, dish: {_type: "reference", _ref: itemIds.get(itemId)!}, port, region, coordinates, yearLabel, courseLabel, image: image(imageKey, alt), description,
    })),
    seo: {title: "South Indian Menu", description: "The current Malabar Coast menu with food prices, ordering availability and carefully reviewed dietary status."},
  });

  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    restaurantName: "Malabar Coast",
    legalName: "Malabar Coast",
    shortDescription: "Southern Indian coastal cooking from Malabar to Scotland.",
    description: "Malabar Coast is a Southern Indian coastal restaurant in Holytown, Scotland, serving Kerala-inspired seafood, curries, biriyani and vegetarian dishes.",
    logo: image("logo", "Malabar Coast logo"),
    lightLogo: image("lightLogo", "Malabar Coast white logo"),
    siteUrl: "https://malabarcoast.co.uk",
    email: "reservations@malabarcoast.co.uk",
    reservationEmail: "reservations@malabarcoast.co.uk",
    address: {streetAddress: "33 Main Street", locality: "Holytown", region: "North Lanarkshire", postalCode: "ML1 4TH", country: "GB"},
    coordinates: {latitude: 55.8207, longitude: -3.9735},
    mapUrl: "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH",
    openingHours: [],
    socialLinks: [{_key: "instagram", platform: "Instagram", url: "https://www.instagram.com/malabarcoastuk"}],
    primaryNavigation: [
      {_type: "link", _key: "story", label: "Our story", href: "/story", openInNewTab: false},
      {_type: "link", _key: "menu", label: "The menu", href: "/menu", openInNewTab: false},
      {_type: "link", _key: "restaurant", label: "Our restaurant", href: "/restaurant", openInNewTab: false},
      {_type: "link", _key: "hall", label: "Private hall", href: "/hall", openInNewTab: false},
      {_type: "link", _key: "faq", label: "Good to know", href: "/faq", openInNewTab: false},
      {_type: "link", _key: "visit", label: "Plan your visit", href: "/#reservations", openInNewTab: false},
      {_type: "link", _key: "order", label: "Your order", href: "/checkout", openInNewTab: false},
    ],
    footerNavigation: [
      {_type: "link", _key: "payments", label: "Payments", href: "/payments", openInNewTab: false},
      {_type: "link", _key: "returns", label: "Returns", href: "/returns", openInNewTab: false},
      {_type: "link", _key: "cookie", label: "Cookie", href: "/cookie", openInNewTab: false},
      {_type: "link", _key: "privacy", label: "Privacy", href: "/privacy", openInNewTab: false},
    ],
    copyrightText: "© Malabar Coast 2026. All rights reserved.",
    defaultSeo: {title: "Malabar Coast | Southern Indian Restaurant in Holytown", description: "Southern Indian coastal cooking from Malabar to Scotland.", image: image("hero", "A Kerala-inspired restaurant table")},
  });

  const marketingPages = pageSeeds();
  for (const page of marketingPages) await upsertByField("marketingPage", "pageKey", page.pageKey, page);
  for (const [index, faq] of faqItems.entries()) await upsertByField("faqItem", "question", faq.question, {question: faq.question, answer: faq.answer, category: index >= 15 ? "Private hall" : "Restaurant", displayOrder: index, published: true});

  const testimonials = [
    {name: "Just Eat guests", source: "Independent delivery platform", rating: 4.75, quote: "Eight early diners placed Malabar Coast at 4.75 out of 5 — a warm first word from Holytown."},
    {name: "Uber Eats guests", source: "Independent delivery platform", rating: 5, quote: "The first two ratings arrived as a perfect 5.0 out of 5, carrying the earliest taste of the kitchen beyond our doors."},
  ];
  for (const [index, testimonial] of testimonials.entries()) await upsertByField("testimonial", "name", testimonial.name, {...testimonial, displayOrder: index, published: true});

  const legalSeeds = [
    {pageKey: "privacy", title: "Privacy Policy", summary: "How Malabar Coast collects, uses, shares and protects personal data under UK data protection law.", body: [block("The complete checked-in privacy policy remains the website fallback. Update and legally review the CMS version before publishing substantial policy changes.", "privacy-body")]},
    {pageKey: "cookie", title: "Cookie Policy", summary: "How essential storage and optional tracking technologies are used on the website.", body: [block("The complete checked-in cookie policy remains the website fallback. Update and legally review the CMS version before publishing substantial policy changes.", "cookie-body")]},
    {pageKey: "returns", title: "Returns and Refunds", summary: "Restaurant order cancellation, return and refund information.", body: [block("The complete checked-in returns policy remains the website fallback. Update and legally review the CMS version before publishing substantial policy changes.", "returns-body")]},
  ];
  for (const legal of legalSeeds) await upsertByField("legalPage", "pageKey", legal.pageKey, {...legal, lastUpdated: "2026-08-17"});

  console.log(JSON.stringify({categories: menuCategories.length, menuItems: menuItems.length, faqItems: faqItems.length, images: assetIds.size, pages: marketingPages.length}));
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : "Sanity seed failed.");
  process.exitCode = 1;
});
