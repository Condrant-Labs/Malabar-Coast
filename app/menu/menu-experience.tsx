"use client";

import Image from "next/image";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {MenuCategory, MenuItem} from "../lib/menu";
import {formatPrice} from "../lib/menu";
import type {MenuPageContent} from "@/sanity/lib/menu";
import {AddToOrder} from "../components/add-to-order";
import {DietaryMarker} from "../components/dietary-marker";

function ShipMark() {
  return <svg viewBox="0 0 88 42" aria-hidden="true"><path d="M7 31h70l-8 7H17L7 31Z" /><path d="M42 4v27M44 7c13 3 22 10 25 20H44V7ZM39 12c-9 3-15 8-19 15h19V12Z" /><path d="M2 40c8-4 14 4 22 0 8-4 14 4 22 0 8-4 14 4 22 0 7-3 12 1 18 1" /></svg>;
}

export function MenuExperience({categories, items, page}: {categories: MenuCategory[]; items: MenuItem[]; page: MenuPageContent}) {
  const voyageRef = useRef<HTMLElement>(null);
  const [activeStop, setActiveStop] = useState(0);
  const itemById = useMemo(() => new Map(items.map((menuItem) => [menuItem.id, menuItem])), [items]);
  const voyageStops = page.voyageStops.filter((stop) => itemById.has(stop.itemId));

  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (window.innerWidth <= 820 || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const section = voyageRef.current;
        if (!section || voyageStops.length < 2) return;
        const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max((window.scrollY - section.offsetTop) / distance, 0), 1);
        section.style.setProperty("--voyage-progress", String(progress));
        const next = Math.min(Math.round(progress * (voyageStops.length - 1)), voyageStops.length - 1);
        setActiveStop((current) => current === next ? current : next);
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, {passive: true});
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [voyageStops.length]);

  const handleStopSelect = useCallback((index: number) => {
    const section = voyageRef.current;
    if (!section) return;
    if (window.innerWidth <= 820) return document.getElementById(`port-${index}`)?.scrollIntoView({behavior: "smooth"});
    const distance = section.offsetHeight - window.innerHeight;
    window.scrollTo({top: section.offsetTop + distance * (index / Math.max(voyageStops.length - 1, 1)), behavior: "smooth"});
  }, [voyageStops.length]);

  return (
    <main className="menuPage">
      <section className="menuPrologue" aria-labelledby="menu-title">
        <div className="prologueMap" aria-hidden="true"><span className="mapArc arcOne" /><span className="mapArc arcTwo" /><span className="mapDot dotIndia" /><span className="mapDot dotEurope" /></div>
        <p className="menuKicker">{page.eyebrow}</p>
        <h1 id="menu-title"><span>{page.headingLineOne}</span><span>{page.headingLineTwo}</span></h1>
        <p className="prologueCopy">{page.introduction}</p>
        {voyageStops.length > 0 && <a className="beginVoyage" href="#voyage">{page.journeyLinkLabel} <span aria-hidden="true">↓</span></a>}
        <div className="prologueCoordinates" aria-hidden="true"><span>11.2588° N</span><i /><span>55.8207° N</span></div>
      </section>

      {voyageStops.length > 0 && <section className="menuVoyage" id="voyage" ref={voyageRef} style={{"--voyage-progress": 0} as React.CSSProperties} aria-label="Culinary voyage from Calicut to Scotland">
        <div className="voyageStage">
          <div className="voyageTrack">
            {voyageStops.map((stop, index) => {
              const dish = itemById.get(stop.itemId)!;
              return (
                <article className="portPanel" id={`port-${index}`} key={`${stop.port}-${stop.itemId}`}>
                  <div className="portImage"><Image src={stop.image.url} alt={stop.image.alt} fill sizes="(max-width: 820px) 100vw, 58vw" priority={index === 0} /><div className="portImageShade" /><span className="portNumeral">{String(index + 1).padStart(2, "0")}</span></div>
                  <div className="portContent">
                    <div className="portMeta"><span>{stop.coordinates}</span><span>{stop.year}</span></div>
                    <p className="portRegion">Port {String(index + 1).padStart(2, "0")} · {stop.region}</p>
                    <h2>{stop.port}</h2><div className="dishRule" /><p className="courseLabel">{stop.course}</p><h3>{dish.name}</h3>
                    <p className="dishDescription">{stop.description}</p>
                    <div className="dishFooter"><strong>{formatPrice(dish.pricePence, dish.priceLabel)}</strong><DietaryMarker status={dish.dietaryStatus} compact />{dish.dietaryReviewStatus === "needs-review" && dish.dietaryStatus !== "notApplicable" && <span className="dishAttribute">Recipe check pending</span>}</div>
                    {dish.onlineOrdering && <AddToOrder id={dish.id} />}
                  </div>
                </article>
              );
            })}
          </div>
          {voyageStops.length > 1 && <div className="routeNavigator" aria-label="Choose a port"><div className="routeLineBase"><div /></div><div className="routeShip"><ShipMark /></div>{voyageStops.map((stop, index) => <button type="button" key={`${stop.port}-${index}`} className={index === activeStop ? "isActive" : ""} onClick={() => handleStopSelect(index)} aria-label={`Travel to ${stop.port}`} aria-current={index === activeStop ? "step" : undefined}><i /><span>{stop.port}</span></button>)}</div>}
          <div className="voyageInstruction" aria-hidden="true"><span>Scroll to sail</span><i><b /></i></div>
        </div>
      </section>}

      <section className="manifest" aria-labelledby="manifest-title">
        <div className="manifestIntro"><p className="menuKicker">{page.manifestEyebrow} · {items.length} listings</p><h2 id="manifest-title">{page.manifestHeading}</h2><p>{page.manifestIntroduction}</p></div>
        <nav className="menuCategoryNav" aria-label="Menu categories">{categories.map((category) => <a href={`#${category.slug}`} key={category.slug}>{category.note}</a>)}</nav>
        <div className="manifestGrid">
          {categories.map((category) => {
            const categoryItems = items.filter((menuItem) => menuItem.category === category.slug);
            if (!categoryItems.length) return null;
            let previousSubheading = "";
            return (
              <article className="manifestCard" id={category.slug} key={category.slug}>
                <div className="manifestHeading"><span>{category.number}</span><div><p>{category.note}</p><h3>{category.title}</h3></div></div>
                <ul>{categoryItems.map((dish) => {
                  const showSubheading = Boolean(dish.subheading && dish.subheading !== previousSubheading);
                  previousSubheading = dish.subheading || previousSubheading;
                  return (
                    <li key={dish.id} className={!dish.available ? "isUnavailable" : undefined}>
                      <div className="manifestDish">
                        {showSubheading && <em className="manifestSubheading">{dish.subheading}</em>}
                        <strong>{dish.name}</strong>
                        {dish.description && <span>{dish.description}</span>}
                        <div className="manifestDishMeta">
                          <DietaryMarker status={dish.dietaryStatus} compact />
                          {dish.dietaryReviewStatus === "needs-review" && dish.dietaryStatus !== "notApplicable" && <small>Dietary details need restaurant confirmation</small>}
                          {dish.allergens.length > 0 && <small>Contains {dish.allergens.join(", ")}</small>}
                          {!dish.available && <small>Temporarily unavailable</small>}
                        </div>
                      </div>
                      <div className="manifestOrder"><b>{dish.hidePrice ? dish.priceLabel || "Ask our team" : formatPrice(dish.pricePence, dish.priceLabel)}</b>{dish.onlineOrdering && dish.available && <AddToOrder id={dish.id} compact />}</div>
                    </li>
                  );
                })}</ul>
              </article>
            );
          })}
        </div>
        <div className="menuNotices"><p>{page.dietaryNotice}</p><p>{page.alcoholNotice}</p></div>
        <div className="dietaryKey"><DietaryMarker status="vegan" /><DietaryMarker status="vegetarian" /><DietaryMarker status="nonVegetarian" /><DietaryMarker status="unconfirmed" /></div>
      </section>

      <footer className="menuFooter"><div><p>End of the chart</p><h2>Arrive hungry.</h2></div><div className="menuFooterActions"><Link href="/checkout">Review your order <span aria-hidden="true">→</span></Link><Link href="/#reservations">Reserve your table <span aria-hidden="true">↗</span></Link></div><small>33 Main Street · Holytown · ML1 4TH</small></footer>
    </main>
  );
}
