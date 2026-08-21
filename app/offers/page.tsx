import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {getActivePromotions} from "@/sanity/lib/promotions";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Offers & Promotions",
  description: "See the current dining, collection and seasonal offers from Malabar Coast in Holytown.",
  alternates: {canonical: "/offers"},
};

export default async function OffersPage() {
  const promotions = await getActivePromotions();

  return (
    <main className="offersPage">
      {promotions.length > 0 ? <section className="offersGrid" aria-label="Current promotions">
        {promotions.map((promotion, index) => (
          <article className="offerCard" key={promotion._id}>
            <div className="offerPoster">
              <Image
                src={promotion.poster.url}
                alt={promotion.poster.alt}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                priority={index < 2}
                placeholder={promotion.poster.lqip ? "blur" : "empty"}
                blurDataURL={promotion.poster.lqip}
              />
            </div>
            <div className="offerCardCopy">
              <p>{promotion.badge || "Current promotion"}</p>
              <h2>{promotion.title}</h2>
              {promotion.summary && <span>{promotion.summary}</span>}
              {promotion.offerCode && <strong>Offer code <b>{promotion.offerCode}</b></strong>}
              {promotion.validityLabel && <small>{promotion.validityLabel}</small>}
              <div>
                {promotion.callToAction?.href && <Link href={promotion.callToAction.href} target={promotion.callToAction.openInNewTab ? "_blank" : undefined} rel={promotion.callToAction.openInNewTab ? "noreferrer" : undefined}>{promotion.callToAction.label} <span aria-hidden="true">↗</span></Link>}
                <Link href="/menu">Explore the menu <span aria-hidden="true">→</span></Link>
              </div>
              {promotion.terms && <details><summary>Offer terms</summary><p>{promotion.terms}</p></details>}
            </div>
          </article>
        ))}
      </section> : <section className="offersEmpty">
        <p>No offer is live just now.</p>
        <h2>The next taste is never far away.</h2>
        <span>Our team will publish new promotions here as soon as they are available.</span>
        <Link href="/menu">Explore the current menu <span aria-hidden="true">→</span></Link>
      </section>}
    </main>
  );
}
