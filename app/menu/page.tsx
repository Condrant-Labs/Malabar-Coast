"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddToOrder } from "../components/add-to-order";
import { DietaryMarker } from "../components/dietary-marker";
import { categoryDetails, formatPrice, getMenuItem, menuItems, type MenuCategory } from "../lib/menu";

const voyageStops = [
  { itemId: "pepper-tiger-prawns", port: "Calicut", region: "Malabar Coast · India", coordinates: "11.2588° N · 75.7804° E", year: "The point of origin", course: "Small plate", image: "/menu/calicut-pepper-prawns.png", alt: "Black pepper tiger prawns with curry leaves and charred lime", description: "Wild tiger prawns, Tellicherry pepper, curry leaf, toasted coconut and charred lime. The first taste is the coast itself — bright, smoky and aromatic." },
  { itemId: "charred-sea-bass", port: "Malindi", region: "Swahili Coast · Kenya", coordinates: "3.2192° S · 40.1169° E", year: "Across the monsoon", course: "From the sea", image: "/menu/malindi-sea-bass.png", alt: "Charred sea bass with tamarind, coriander and cassava crisp", description: "Line-caught sea bass, tamarind glaze, green chilli, coriander oil and cassava crisp. Malabar coconut meets the fire-led cooking of the Swahili coast." },
  { itemId: "peri-peri-lobster", port: "Mozambique", region: "Mozambique Island", coordinates: "15.0360° S · 40.7327° E", year: "The chilli passage", course: "Captain’s plate", image: "/menu/mozambique-lobster.png", alt: "Peri-peri lobster tail with fragrant rice and lime", description: "Roasted lobster tail, fermented red chilli butter, coconut, lime and fragrant rice. Indian Ocean spice meets the Portuguese pepper route." },
  { itemId: "cape-malay-lamb", port: "The Cape", region: "Cape of Good Hope", coordinates: "34.3568° S · 18.4740° E", year: "Where two oceans meet", course: "From the land", image: "/menu/cape-malay-lamb.png", alt: "Slow-braised Cape Malay lamb curry with flaky parotta", description: "Slow-braised Highland lamb, cardamom, apricot, black pepper and crisp onion. Deep comfort carried around the Cape." },
  { itemId: "cardamom-nata", port: "Lisbon", region: "Tagus · Portugal", coordinates: "38.7223° N · 9.1393° W", year: "Landfall in Europe", course: "Sweet passage", image: "/menu/lisbon-custard-tart.png", alt: "Cardamom Portuguese custard tart with cashew praline", description: "Warm custard tart, green cardamom, cinnamon, black pepper caramel and roasted cashew. A classic remembering where its spice began." },
  { itemId: "haddock-moilee", port: "Holytown", region: "Scotland · The new coast", coordinates: "55.8207° N · 3.9735° W", year: "The voyage continues", course: "Our signature", image: "/menu/scotland-haddock.png", alt: "Scottish haddock in golden coconut moilee with charred leek", description: "Scottish haddock, golden coconut moilee, charred leek, mustard seed, curry leaf and sea herbs. Two coasts brought to one table." },
] as const;

const categories = Object.keys(categoryDetails) as MenuCategory[];

function ShipMark() {
  return <svg viewBox="0 0 88 42" aria-hidden="true"><path d="M7 31h70l-8 7H17L7 31Z" /><path d="M42 4v27M44 7c13 3 22 10 25 20H44V7ZM39 12c-9 3-15 8-19 15h19V12Z" /><path d="M2 40c8-4 14 4 22 0 8-4 14 4 22 0 8-4 14 4 22 0 7-3 12 1 18 1" /></svg>;
}

export default function MenuPage() {
  const voyageRef = useRef<HTMLElement>(null);
  const [activeStop, setActiveStop] = useState(0);

  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (window.innerWidth <= 820) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const section = voyageRef.current;
        if (!section) return;
        const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max((window.scrollY - section.offsetTop) / distance, 0), 1);
        section.style.setProperty("--voyage-progress", String(progress));
        const next = Math.min(Math.round(progress * (voyageStops.length - 1)), voyageStops.length - 1);
        setActiveStop((current) => current === next ? current : next);
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleStopSelect = useCallback((index: number) => {
    const section = voyageRef.current;
    if (!section) return;
    if (window.innerWidth <= 820) return document.getElementById(`port-${index}`)?.scrollIntoView({ behavior: "smooth" });
    const distance = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.offsetTop + distance * (index / (voyageStops.length - 1)), behavior: "smooth" });
  }, []);

  return (
    <main className="menuPage">
      <section className="menuPrologue" aria-labelledby="menu-title">
        <div className="prologueMap" aria-hidden="true"><span className="mapArc arcOne" /><span className="mapArc arcTwo" /><span className="mapDot dotIndia" /><span className="mapDot dotEurope" /></div>
        <p className="menuKicker">The culinary passage · East to West</p>
        <h1 id="menu-title"><span>Six ports.</span><span>One table.</span></h1>
        <p className="prologueCopy">A menu plotted across the old sea road. Each port leaves something on the plate: pepper, coconut, fire, smoke — and finally, Scotland.</p>
        <a className="beginVoyage" href="#voyage">Begin the voyage <span aria-hidden="true">↓</span></a>
        <div className="prologueCoordinates" aria-hidden="true"><span>11.2588° N</span><i /><span>55.8207° N</span></div>
      </section>

      <section className="menuVoyage" id="voyage" ref={voyageRef} style={{ "--voyage-progress": 0 } as React.CSSProperties} aria-label="Culinary voyage from Calicut to Scotland">
        <div className="voyageStage">
          <div className="voyageTrack">
            {voyageStops.map((stop, index) => {
              const dish = getMenuItem(stop.itemId)!;
              return (
                <article className="portPanel" id={`port-${index}`} key={stop.port}>
                  <div className="portImage"><Image src={stop.image} alt={stop.alt} fill sizes="(max-width: 820px) 100vw, 58vw" priority={index === 0} /><div className="portImageShade" /><span className="portNumeral">{String(index + 1).padStart(2, "0")}</span></div>
                  <div className="portContent">
                    <div className="portMeta"><span>{stop.coordinates}</span><span>{stop.year}</span></div>
                    <p className="portRegion">Port {String(index + 1).padStart(2, "0")} · {stop.region}</p>
                    <h2>{stop.port}</h2><div className="dishRule" /><p className="courseLabel">{stop.course}</p><h3>{dish.name}</h3>
                    <p className="dishDescription">{stop.description}</p>
                    <div className="dishFooter"><strong>{formatPrice(dish.pricePence)}</strong><DietaryMarker dietary={dish.dietary} compact />{dish.dietary.filter((tag) => tag !== "V" && tag !== "VG").map((tag) => <span className="dishAttribute" key={tag}>{tag}</span>)}<span className="dishAttribute">{dish.spice}</span></div>
                    <AddToOrder id={dish.id} />
                  </div>
                </article>
              );
            })}
          </div>
          <div className="routeNavigator" aria-label="Choose a port"><div className="routeLineBase"><div /></div><div className="routeShip"><ShipMark /></div>{voyageStops.map((stop, index) => <button type="button" key={stop.port} className={index === activeStop ? "isActive" : ""} onClick={() => handleStopSelect(index)} aria-label={`Travel to ${stop.port}`} aria-current={index === activeStop ? "step" : undefined}><i /><span>{stop.port}</span></button>)}</div>
          <div className="voyageInstruction" aria-hidden="true"><span>Scroll to sail</span><i><b /></i></div>
        </div>
      </section>

      <section className="manifest" aria-labelledby="manifest-title">
        <div className="manifestIntro"><p className="menuKicker">The full manifest · {menuItems.length} dishes</p><h2 id="manifest-title">What we carry<br />to the table.</h2><p>The voyage above is our signature route. Below is the wider collection — practical to order, rooted in Malabar and made for sharing.</p></div>
        <nav className="menuCategoryNav" aria-label="Menu categories">{categories.map((category) => <a href={`#${category}`} key={category}>{categoryDetails[category].note}</a>)}</nav>
        <div className="manifestGrid">
          {categories.map((category) => {
            const detail = categoryDetails[category];
            return (
              <article className="manifestCard" id={category} key={category}>
                <div className="manifestHeading"><span>{detail.number}</span><div><p>{detail.note}</p><h3>{detail.title}</h3></div></div>
                <ul>{menuItems.filter((item) => item.category === category).map((dish) => (
                  <li key={dish.id}>
                    <div className="manifestDish"><strong>{dish.name}</strong><span>{dish.description}</span><div className="manifestDishMeta"><DietaryMarker dietary={dish.dietary} compact /><small>{dish.dietary.filter((tag) => tag !== "V" && tag !== "VG").join(" · ")}{dish.allergens.length ? `${dish.dietary.some((tag) => tag !== "V" && tag !== "VG") ? " · " : ""}Contains ${dish.allergens.join(", ")}` : ""}</small></div></div>
                    <div className="manifestOrder"><b>{formatPrice(dish.pricePence)}</b><AddToOrder id={dish.id} compact /></div>
                  </li>
                ))}</ul>
              </article>
            );
          })}
        </div>
        <div className="dietaryKey"><DietaryMarker dietary={["VG"]} /><DietaryMarker dietary={["V"]} /><DietaryMarker dietary={[]} /><span className="dietaryAbbreviation"><b>GF</b> Gluten free</span><span className="dietaryAbbreviation"><b>DF</b> Dairy free</span><p>Please tell us about allergies when ordering. Our kitchen handles all 14 regulated allergens and cross-contact may occur.</p></div>
      </section>

      <footer className="menuFooter"><div><p>End of the chart</p><h2>Arrive hungry.</h2></div><div className="menuFooterActions"><Link href="/checkout">Review your order <span aria-hidden="true">→</span></Link><Link href="/#reservations">Reserve your table <span aria-hidden="true">↗</span></Link></div><small>33 Main Street · Holytown · ML1 4TH</small></footer>
    </main>
  );
}
