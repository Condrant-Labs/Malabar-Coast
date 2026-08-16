import {defineQuery} from "next-sanity";

export const menuContentQuery = defineQuery(`{
  "categories": *[_type == "menuCategory" && published != false] | order(orderRank asc) {
    "slug": slug.current,
    title,
    "note": coalesce(shortTitle, title),
    "description": coalesce(description, ""),
    orderRank
  },
  "items": *[_type == "menuItem"] | order(category->orderRank asc, displayOrder asc) {
    "id": sourceKey,
    "category": category->slug.current,
    name,
    "description": coalesce(description, ""),
    subheading,
    pricePence,
    priceLabel,
    hidePrice,
    isAlcoholic,
    isVegetarian,
    isVegan,
    dietaryReviewStatus,
    "allergens": coalesce(allergens, []),
    spiceLevel,
    available,
    onlineOrdering,
    featured,
    displayOrder,
    image {
      alt,
      caption,
      "url": asset->url,
      "dimensions": asset->metadata.dimensions
    }
  },
  "page": *[_id == "menuPage"][0] {
    eyebrow,
    headingLineOne,
    headingLineTwo,
    introduction,
    journeyLinkLabel,
    manifestEyebrow,
    manifestHeading,
    manifestIntroduction,
    dietaryNotice,
    alcoholNotice,
    voyageStops[] {
      "itemId": dish->sourceKey,
      port,
      region,
      coordinates,
      "year": yearLabel,
      "course": courseLabel,
      description,
      image {
        alt,
        "url": asset->url,
        "dimensions": asset->metadata.dimensions
      }
    },
    seo
  }
}`);

export const checkoutMenuItemQuery = defineQuery(`*[_type == "menuItem" && sourceKey == $id][0] {
  "id": sourceKey,
  name,
  pricePence,
  available,
  onlineOrdering,
  isAlcoholic
}`);

export const siteSettingsQuery = defineQuery(`*[_id == "siteSettings"][0] {
  restaurantName,
  legalName,
  shortDescription,
  description,
  siteUrl,
  phone,
  email,
  reservationEmail,
  address,
  coordinates,
  mapUrl,
  openingHours,
  socialLinks,
  primaryNavigation,
  footerNavigation,
  announcement,
  copyrightText,
  defaultSeo,
  logo {alt, "url": asset->url},
  lightLogo {alt, "url": asset->url},
  favicon {alt, "url": asset->url}
}`);

export const marketingPageQuery = defineQuery(`*[_type == "marketingPage" && pageKey == $pageKey][0] {
  pageKey,
  title,
  eyebrow,
  heroHeading,
  heroText,
  heroImage {alt, caption, "url": asset->url, "dimensions": asset->metadata.dimensions},
  heroPrimaryLink,
  heroSecondaryLink,
  sections[] {
    _key,
    _type,
    internalName,
    eyebrow,
    heading,
    body,
    text,
    image {alt, caption, "url": asset->url, "dimensions": asset->metadata.dimensions},
    secondaryImage {alt, caption, "url": asset->url, "dimensions": asset->metadata.dimensions},
    links,
    primaryLink,
    secondaryLink,
    shortLabel,
    note,
    theme
  },
  seo
}`);

export const faqItemsQuery = defineQuery(`*[_type == "faqItem" && published != false] | order(displayOrder asc) {
  question,
  answer,
  category,
  displayOrder
}`);

export const testimonialsQuery = defineQuery(`*[_type == "testimonial" && published != false] | order(displayOrder asc) {
  quote,
  name,
  source,
  rating,
  displayOrder
}`);
