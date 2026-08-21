import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${site.lastUpdated}T00:00:00.000Z`);

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/menu"), lastModified, changeFrequency: "weekly", priority: .95 },
    { url: absoluteUrl("/offers"), lastModified, changeFrequency: "daily", priority: .9 },
    { url: absoluteUrl("/book-a-table"), lastModified, changeFrequency: "weekly", priority: .95 },
    { url: absoluteUrl("/restaurant"), lastModified, changeFrequency: "monthly", priority: .9 },
    { url: absoluteUrl("/hall"), lastModified, changeFrequency: "monthly", priority: .9 },
    { url: absoluteUrl("/story"), lastModified, changeFrequency: "monthly", priority: .75 },
    { url: absoluteUrl("/story/calicut"), lastModified, changeFrequency: "yearly", priority: .6 },
    { url: absoluteUrl("/faq"), lastModified, changeFrequency: "monthly", priority: .8 },
    { url: absoluteUrl("/payments"), lastModified, changeFrequency: "yearly", priority: .35 },
    { url: absoluteUrl("/returns"), lastModified, changeFrequency: "yearly", priority: .35 },
    { url: absoluteUrl("/cookie"), lastModified, changeFrequency: "yearly", priority: .3 },
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: .3 },
  ];
}

