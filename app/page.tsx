import {getMarketingPage, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";
import {HomeExperience, type HomeCmsContent} from "./home-experience";
import {getMenuContent} from "@/sanity/lib/menu";
import {getTestimonials} from "@/sanity/lib/testimonials";
import {getActivePromotions} from "@/sanity/lib/promotions";

export const revalidate = 60;

export default async function HomePage() {
  const [page, {items: menuItems}, testimonials, promotions] = await Promise.all([getMarketingPage("home"), getMenuContent(), getTestimonials(), getActivePromotions()]);
  const overview = getPageSection(page, "home-overview");
  const reservations = getPageSection(page, "home-reservations");
  const content: HomeCmsContent = page ? {
    heroEyebrow: page.eyebrow,
    heroHeading: page.heroHeading,
    heroText: page.heroText,
    heroImage: page.heroImage,
    heroPrimaryLink: page.heroPrimaryLink,
    heroSecondaryLink: page.heroSecondaryLink,
    overviewEyebrow: overview?.eyebrow,
    overviewHeading: overview?.heading,
    overviewText: portableTextToPlainText(overview?.body),
    reservationEyebrow: reservations?.eyebrow,
    reservationHeading: reservations?.heading,
    reservationText: reservations?.text,
    reservationPrimaryLink: reservations?.primaryLink,
    reservationSecondaryLink: reservations?.secondaryLink,
    testimonials,
  } : {};
  return <HomeExperience content={content} menuItems={menuItems} promotions={promotions} />;
}
