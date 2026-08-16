import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { Reveal } from "../components/reveal";
import { absoluteUrl, site } from "../lib/site";
import {getMarketingPage, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";

export const metadata: Metadata = {
  title: "Private Event Hall in Holytown",
  description:
    "Discover the private event hall at Malabar Coast restaurant in Holytown, with a flexible open floor, built-in bar and raised stage for celebrations and gatherings.",
  keywords: [
    "private event hall Holytown",
    "function hall Holytown",
    "party venue North Lanarkshire",
    "private dining Holytown",
    "celebration venue Holytown",
    "restaurant hall Motherwell",
    "Malabar Coast private hall",
  ],
  alternates: { canonical: "/hall" },
  openGraph: {
    type: "website",
    url: "/hall",
    title: "Private Event Hall at Malabar Coast, Holytown",
    description: "A flexible private room with its own bar and raised stage, within Malabar Coast restaurant at 33 Main Street, Holytown.",
    images: [
      {
        url: "/Hall1.jpeg",
        width: 1600,
        height: 1067,
        alt: "The private hall at Malabar Coast with an open floor and built-in wooden bar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Event Hall at Malabar Coast",
    description: "A flexible hall with a built-in bar and raised stage at Malabar Coast in Holytown.",
    images: ["/Hall1.jpeg"],
  },
};

const hallFaqs = [
  {
    id: "hall-what-is-it",
    question: "What is the private hall at Malabar Coast?",
    answer:
      "The private hall is a flexible event space within Malabar Coast restaurant at 33 Main Street, Holytown. The room has an open floor, a built-in wooden bar and a raised stage, creating a practical setting for private celebrations and community gatherings.",
  },
  {
    id: "hall-facilities",
    question: "What facilities are visible in the hall?",
    answer:
      "The Malabar Coast hall includes a dedicated built-in bar, a raised stage, ceiling lighting and a flexible open floor. Seating and event layouts can be arranged around the room, while final capacity and package details will be published after they are confirmed.",
  },
  {
    id: "hall-occasions",
    question: "Which occasions can the hall accommodate?",
    answer:
      "The hall is presented for private celebrations, family gatherings, community occasions and small events. The open floor supports different layouts, while the bar and stage provide useful focal points. Event suitability depends on the required setup and confirmed guest capacity.",
  },
  {
    id: "hall-booking",
    question: "How can guests enquire about the hall?",
    answer:
      "Hall booking, capacity, package, catering and pricing details are still being finalised. Guests can currently review the room photographs and restaurant location online. The official enquiry method will be added to this page when the restaurant supplies the confirmed contact details.",
  },
] as const;

const hallSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EventVenue",
      "@id": `${absoluteUrl("/hall")}#venue`,
      name: "Private Event Hall at Malabar Coast",
      url: absoluteUrl("/hall"),
      description:
        "A flexible private event hall with a built-in bar and raised stage inside Malabar Coast restaurant in Holytown, North Lanarkshire.",
      image: [absoluteUrl("/Hall1.jpeg"), absoluteUrl("/Hall2.jpeg"), absoluteUrl("/Hall3.jpeg")],
      address: { "@type": "PostalAddress", ...site.address },
      geo: { "@type": "GeoCoordinates", ...site.geo },
      isPartOf: { "@id": `${site.url}/#restaurant` },
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Built-in bar", value: true },
        { "@type": "LocationFeatureSpecification", name: "Raised stage", value: true },
        { "@type": "LocationFeatureSpecification", name: "Flexible open floor", value: true },
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/hall")}#webpage`,
      url: absoluteUrl("/hall"),
      name: "Private Event Hall at Malabar Coast",
      dateModified: site.lastUpdated,
      inLanguage: "en-GB",
      about: { "@id": `${absoluteUrl("/hall")}#venue` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Private Hall", item: absoluteUrl("/hall") },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/hall")}#faq-schema`,
      datePublished: site.lastUpdated,
      dateModified: site.lastUpdated,
      mainEntity: hallFaqs.map((item) => ({
        "@type": "Question",
        "@id": `${absoluteUrl("/hall")}#${item.id}`,
        name: item.question,
        datePublished: site.lastUpdated,
        dateModified: site.lastUpdated,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default async function HallPage() {
  const cmsPage = await getMarketingPage("hall");
  const introductionSection = getPageSection(cmsPage, "hall-intro");
  const stageSection = getPageSection(cmsPage, "hall-stage");
  const gallerySection = getPageSection(cmsPage, "hall-gallery");
  return (
    <main className="editorialPage hallPage">
      <JsonLd data={hallSchema} />

      <section className="hallHero" aria-labelledby="hall-title">
        <Image
          src={cmsPage?.heroImage?.url || "/Hall1.jpeg"}
          alt={cmsPage?.heroImage?.alt || "The private hall at Malabar Coast with an open floor and built-in wooden bar"}
          fill
          sizes="100vw"
          priority
        />
        <div className="hallHeroShade" />
        <div className="hallHeroCopy">
          <p>{cmsPage?.eyebrow || "Private gatherings · Holytown"}</p>
          <h1 id="hall-title">{cmsPage?.heroHeading ? <span>{cmsPage.heroHeading}</span> : <><span>A room</span><span>of your own.</span></>}</h1>
        </div>
        <div className="heroChapterMark"><span>Bar · Stage · Flexible floor</span><i /><span>33 Main Street</span></div>
      </section>

      <section className="hallIntroduction" aria-labelledby="hall-introduction-title">
        <Reveal className="chapterIndex">{introductionSection?.eyebrow || "The private hall · 01"}</Reveal>
        <Reveal as="h2" id="hall-introduction-title" delay={70}>{introductionSection?.heading || <>Gather by<br />the coast.</>}</Reveal>
        <div>
          {introductionSection ? <Reveal as="p">{portableTextToPlainText(introductionSection.body)}</Reveal> : <>
          <Reveal as="p">
            Malabar Coast&apos;s private hall is a flexible event space within the restaurant in
            Holytown. A built-in bar, raised stage and open floor create a calm setting for
            celebrations, family gatherings and community occasions.
          </Reveal>
          <Reveal as="p" delay={90}>
            The room can move from an open reception to seated arrangements without losing its
            warm, understated character. Final capacity, packages, catering choices and pricing
            will be added when those details are confirmed.
          </Reveal>
          </>}
          <Reveal delay={140}><time dateTime={site.lastUpdated}>Last reviewed 2 August 2026</time></Reveal>
        </div>
      </section>

      <section className="hallDetails" aria-label="Private hall features">
        <Reveal><span>01</span><p>Dedicated space</p><strong>A private room within the restaurant</strong></Reveal>
        <Reveal delay={60}><span>02</span><p>At one end</p><strong>A built-in wooden bar</strong></Reveal>
        <Reveal delay={120}><span>03</span><p>At the other</p><strong>A raised event stage</strong></Reveal>
        <Reveal delay={180}><span>04</span><p>Through the room</p><strong>A flexible open floor</strong></Reveal>
      </section>

      <section className="hallStagePortrait" aria-labelledby="hall-stage-title">
        <Reveal className="hallStageImage">
          <Image
            src={stageSection?.image?.url || "/Hall2.jpeg"}
            alt={stageSection?.image?.alt || "Wide view of the Malabar Coast event hall showing its open floor and raised stage"}
            fill
            sizes="(max-width: 860px) 100vw, 62vw"
          />
        </Reveal>
        <div className="hallStageCopy">
          <Reveal className="chapterIndex">{stageSection?.eyebrow || "The stage · 02"}</Reveal>
          <Reveal as="h2" id="hall-stage-title" delay={70}>{stageSection?.heading || <>A natural<br />focal point.</>}</Reveal>
          <Reveal as="p" delay={130}>
            {portableTextToPlainText(stageSection?.body) || "The raised stage anchors the far end of the room for speeches, presentations and moments shared together. Warm timber, a marble-toned backdrop and soft ceiling light keep the space simple enough to make your own."}
          </Reveal>
        </div>
      </section>

      <section className="hallGallery" aria-labelledby="hall-gallery-title">
        <div className="hallGalleryHeading">
          <Reveal className="chapterIndex">{gallerySection?.eyebrow || "The room · 03"}</Reveal>
          <Reveal as="h2" id="hall-gallery-title" delay={70}>{gallerySection?.heading || "Set the scene."}</Reveal>
        </div>
        <Reveal className="hallGalleryImage" delay={120}>
          <Image
            src={gallerySection?.image?.url || "/Hall3.jpeg"}
            alt={gallerySection?.image?.alt || "The raised stage in the Malabar Coast hall with chairs arranged across the floor"}
            fill
            sizes="100vw"
          />
          <span>Flexible seating · Stage view</span>
        </Reveal>
      </section>

      <section className="hallFaq" id="hall-faq" aria-labelledby="hall-faq-title">
        <div>
          <Reveal className="chapterIndex">Before you plan · 04</Reveal>
          <Reveal as="h2" id="hall-faq-title" delay={70}>Good to know.</Reveal>
        </div>
        <div className="hallFaqList">
          {hallFaqs.map((item, index) => (
            <Reveal as="article" id={item.id} key={item.id} delay={index * 55}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
              <a href={`#${item.id}`} aria-label={`Permanent link to ${item.question}`}>Permanent answer link</a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="hallClosing" aria-labelledby="hall-closing-title">
        <Reveal className="chapterIndex">Your occasion · Holytown</Reveal>
        <Reveal as="h2" id="hall-closing-title" delay={70}>Bring people<br />together.</Reveal>
        <Reveal as="p" delay={120}>
          Capacity, event packages, catering, availability and a direct enquiry route will be
          published after the restaurant confirms them.
        </Reveal>
        <Reveal className="hallClosingActions" delay={170}>
          <Link href="/restaurant#location">See the location <span aria-hidden="true">→</span></Link>
          <Link href="/faq">Read restaurant FAQs <span aria-hidden="true">↗</span></Link>
        </Reveal>
      </section>
    </main>
  );
}
