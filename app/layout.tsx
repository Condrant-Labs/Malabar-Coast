import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./menu/menu.css";
import "./editorial.css";
import "./order.css";
import "./faq/faq.css";
import "./legal.css";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { SmoothScroll } from "./components/smooth-scroll";
import { CartProvider } from "./components/cart-provider";
import { JsonLd } from "./components/json-ld";
import { absoluteUrl, site } from "./lib/site";
import { getMenuContent } from "@/sanity/lib/menu";
import { getSiteSettings } from "@/sanity/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Malabar Coast | Southern Indian Restaurant in Holytown",
    template: "%s | Malabar Coast",
  },
  description: site.description,
  applicationName: site.name,
  generator: "Codrant Labs",
  category: "restaurant",
  creator: site.name,
  publisher: site.name,
  keywords: [
    "South Indian restaurant Holytown",
    "Kerala restaurant Holytown",
    "Indian restaurant North Lanarkshire",
    "Malabar cuisine Scotland",
    "South Indian seafood",
    "Kerala food delivery Holytown",
    "Southern Indian restaurant Scotland",
    "private event hall Holytown",
    "function hall North Lanarkshire",
    "private dining Holytown",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: site.name,
    title: "Malabar Coast | Southern Indian Restaurant in Holytown",
    description: site.description,
    images: [
      {
        url: "/malabar-restaurant-hero-v2.jpg",
        width: 1672,
        height: 941,
        alt: "A Kerala-inspired restaurant table with coastal dishes in a warm dining room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malabar Coast | Southern Indian Restaurant in Holytown",
    description: site.shortDescription,
    images: ["/malabar-restaurant-hero-v2.jpg"],
  },
  icons: { icon: "/icon.svg" },
  formatDetection: { address: false, email: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#071310",
  colorScheme: "dark",
};

const globalSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": `${site.url}/#restaurant`,
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      logo: absoluteUrl("/malabar af.svg"),
      image: [
        absoluteUrl("/restaurant/dining-room.png"),
        absoluteUrl("/menu/calicut-pepper-prawns.png"),
        absoluteUrl("/restaurant/table-for-two.png"),
        absoluteUrl("/Hall1.jpeg"),
      ],
      description: site.description,
      priceRange: site.priceRange,
      servesCuisine: site.cuisine,
      hasMenu: absoluteUrl("/menu"),
      hasMap: "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH",
      address: {
        "@type": "PostalAddress",
        ...site.address,
      },
      geo: {
        "@type": "GeoCoordinates",
        ...site.geo,
      },
      areaServed: ["Holytown", "North Lanarkshire"],
      containsPlace: {
        "@type": "EventVenue",
        "@id": `${absoluteUrl("/hall")}#venue`,
        name: "Private Event Hall at Malabar Coast",
        url: absoluteUrl("/hall"),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.shortDescription,
      inLanguage: "en-GB",
      publisher: { "@id": `${site.url}/#restaurant` },
      creator: { "@id": "https://codrantlabs.in/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://codrantlabs.in/#organization",
      name: "Codrant Labs",
      url: "https://codrantlabs.in/",
      description: "Website design and development studio credited with creating the Malabar Coast website.",
    },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{items: currentMenuItems}, siteSettings] = await Promise.all([getMenuContent(), getSiteSettings()]);
  return (
    <html lang="en">
      <body>
        <JsonLd data={globalSchema} />
        <SmoothScroll />
        <CartProvider catalogue={currentMenuItems}>
          <SiteHeader settings={siteSettings} />
          {children}
          <SiteFooter settings={siteSettings} />
        </CartProvider>
      </body>
    </html>
  );
}
