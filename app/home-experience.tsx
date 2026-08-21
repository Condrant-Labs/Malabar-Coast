"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeStoryScroll } from "./components/home-story-scroll";
import { HomeSignatures } from "./components/home-signatures";
import { HomeTestimonials } from "./components/home-testimonials";
import type {MenuItem} from "./lib/menu";
import type {TestimonialRecord} from "@/sanity/lib/testimonials";
import type {Promotion} from "@/sanity/lib/promotions";
import {PromotionPopup} from "./components/promotion-popup";

const REDUCED_MOTION_INTRO_DELAY_MS = 120;
const REPLAY_INTRO_EVENT = "malabar:replay-intro";
const HERO_FOOTER_SCROLL_THRESHOLD = 4;
const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH";
const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=33+Main+Street,+Holytown,+North+Lanarkshire,+ML1+4TH&output=embed";

export type HomeCmsContent = {
  heroEyebrow?: string;
  heroHeading?: string;
  heroText?: string;
  heroImage?: {url: string; alt: string};
  heroPrimaryLink?: {label: string; href: string};
  heroSecondaryLink?: {label: string; href: string};
  overviewEyebrow?: string;
  overviewHeading?: string;
  overviewText?: string;
  reservationEyebrow?: string;
  reservationHeading?: string;
  reservationText?: string;
  reservationPrimaryLink?: {label: string; href: string};
  reservationSecondaryLink?: {label: string; href: string};
  testimonials?: TestimonialRecord[];
};

function CompassMark() {
  return (
    <svg aria-hidden="true" className="compass" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="19.5" />
      <path d="M22 6v32M6 22h32" />
      <path className="compassNeedle" d="m22 10 3.2 9L22 34l-3.2-15L22 10Z" />
    </svg>
  );
}

export function HomeExperience({content, menuItems, promotions}: {content: HomeCmsContent; menuItems: MenuItem[]; promotions: Promotion[]}) {
  const [introActive, setIntroActive] = useState(true);
  const [heroFooterRevealed, setHeroFooterRevealed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion || !introActive) return;

    const introTimer = window.setTimeout(
      () => setIntroActive(false),
      REDUCED_MOTION_INTRO_DELAY_MS,
    );

    return () => window.clearTimeout(introTimer);
  }, [introActive]);

  useEffect(() => {
    const replayIntro = () => {
      setIntroActive(true);
      setHeroFooterRevealed(false);
    };
    window.addEventListener(REPLAY_INTRO_EVENT, replayIntro);
    return () => window.removeEventListener(REPLAY_INTRO_EVENT, replayIntro);
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > HERO_FOOTER_SCROLL_THRESHOLD) setHeroFooterRevealed(true);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <main
      className={`homePage ${introActive ? "introActive" : "introComplete"}`}
      aria-busy={introActive}
    >
      <PromotionPopup promotions={promotions} ready={!introActive} />
      <section className="hero" aria-labelledby="hero-title">
      {introActive && (
        <div
          className="intro"
          role="status"
          aria-label="Welcoming you to Malabar Coast"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target && event.animationName === "introExit") {
              setIntroActive(false);
            }
          }}
        >
          <div className="introScene" aria-hidden="true" />
          <div className="introBokeh" aria-hidden="true" />
          <div className="introShade" aria-hidden="true" />
          <div className="introKicker" aria-hidden="true">
            <span>Southern Indian coastal kitchen</span>
            <i />
            <span>Holytown, Scotland</span>
          </div>
          <div className="introLogo" aria-hidden="true">
            <Image
              src="/malabar af.svg"
              alt=""
              width={2383}
              height={2402}
              priority
            />
          </div>
          <p className="introTagline" aria-hidden="true">From one coast. To another.</p>
          <div className="introRule" aria-hidden="true" />
          <div className="introCoordinates" aria-hidden="true">
            <span>11.2588° N</span>
            <b>Malabar</b>
            <i />
            <b>Scotland</b>
            <span>55.8207° N</span>
          </div>
          <button
            className="skipIntro"
            type="button"
            onClick={() => setIntroActive(false)}
          >
            Skip intro
          </button>
        </div>
      )}

      <div className="heroImage" aria-hidden="true">
        <Image
          src={content.heroImage?.url || "/malabar-restaurant-hero-v2.jpg"}
          alt={content.heroImage?.alt || ""}
          fill
          sizes="100vw"
          priority
        />
      </div>
      <div className="seaShimmer" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <section className="heroContent" id="top" aria-labelledby="hero-title">
        <div className="eyebrow">
          <span>{content.heroEyebrow?.split(" · ")[0] || "Southern Indian coastal kitchen"}</span>
          <i aria-hidden="true" />
          <span>{content.heroEyebrow?.split(" · ").slice(1).join(" · ") || "Holytown · Scotland"}</span>
        </div>

        {content.heroHeading ? <h1 id="hero-title"><span>{content.heroHeading}</span></h1> : <h1 id="hero-title">
          <span>Shaped by sea.</span>
          <span className="indent">Grounded</span>
          <span>in land.</span>
        </h1>}

        <div className="storyNote">
          <CompassMark />
          <div>
            <p>
              {content.heroText || "Malabar Coast is a Southern Indian coastal restaurant in Holytown, bringing Kerala's pepper, coconut and seafood to a Scottish table."}
            </p>
            <div className="heroActions">
              <Link href={content.heroPrimaryLink?.href || "/menu"}>{content.heroPrimaryLink?.label || "Explore the menu"} <span aria-hidden="true">↗</span></Link>
              <Link href={content.heroSecondaryLink?.href || "/restaurant#location"}>{content.heroSecondaryLink?.label || "Plan your visit"} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <Link className="heroDish" href="/story" aria-label="Read the story behind Malabar Coast">
        <span className="heroDishImage">
          <Image
            src="/malabar-hero.jpg"
            alt="An uru vessel crossing the old Malabar spice route"
            fill
            sizes="180px"
            priority
          />
        </span>
        <span className="heroDishCopy">
          <small>The story behind the table</small>
          <strong>From one coast to another</strong>
          <i>Follow the voyage ↗</i>
        </span>
      </Link>


      <footer className={`heroFooter ${heroFooterRevealed ? "" : "heroFooterHidden"}`} aria-hidden={!heroFooterRevealed}>
        <div className="chapter">
          <span>Chapter I</span>
          <strong>The coast that changed the table</strong>
        </div>
        <div className="scrollCue" aria-hidden="true">
          <span>Begin the voyage</span>
          <i><b /></i>
        </div>
        <div className="year">
          <span>Est.</span>
          <strong>MMXXVI</strong>
        </div>
      </footer>
      </section>

      <section className="homeOverview" aria-labelledby="home-overview-title">
        <div className="homeOverviewMeta">
          <span>{content.overviewEyebrow || "Malabar Coast · In brief"}</span>
          <time dateTime="2026-08-02">Last reviewed 2 August 2026</time>
        </div>
        <div className="homeOverviewLead">
          <h2 id="home-overview-title">{content.overviewHeading || <>What is<br />Malabar Coast?</>}</h2>
          <div>
            <p>
              {content.overviewText || "Malabar Coast is a Southern Indian coastal restaurant at 33 Main Street in Holytown, Scotland. The kitchen connects Kerala's pepper, coconut, curry leaf and tamarind with Scottish seafood and produce in dishes designed for sharing."}
            </p>
            <Link href="/faq">Restaurant questions answered <span aria-hidden="true">↗</span></Link>
            <Link href="/hall">Discover the private hall <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <dl className="homeOverviewFacts">
          <div><dt>Cuisine</dt><dd>Kerala and Southern Indian coastal cooking</dd></div>
          <div><dt>Good to know</dt><dd>Vegetarian choices; ask about vegan and allergen needs</dd></div>
          <div><dt>Ways to enjoy</dt><dd>Dine in, collect or order delivery</dd></div>
          <div><dt>Private events</dt><dd>Flexible hall with a built-in bar and stage</dd></div>
        </dl>
      </section>

      <HomeSignatures items={menuItems} />

      <HomeStoryScroll />

      <HomeTestimonials records={content.testimonials} />

      <footer className="homeReservations" id="reservations" aria-labelledby="reservations-title">
        <div className="homeReservationsMeta">
          <span>{content.reservationEyebrow || "Plan your visit"}</span>
          <span>Holytown · Scotland</span>
        </div>
        <div className="homeReservationsGrid">
          <h2 id="reservations-title">{content.reservationHeading || <>Your table<br />by the coast.</>}</h2>
          <div>
            <p>
              {content.reservationText || "Join us at 33 Main Street for Southern Indian coastal cooking, warm hospitality, and a table shaped by the journey from Malabar to Scotland."}
            </p>
            <div className="homeReservationsActions">
              <Link href={content.reservationPrimaryLink?.href || "/restaurant#location"}>{content.reservationPrimaryLink?.label || "Plan your visit"} <span aria-hidden="true">→</span></Link>
              <Link href={content.reservationSecondaryLink?.href || "/menu"}>{content.reservationSecondaryLink?.label || "Explore the menu"} <span aria-hidden="true">↗</span></Link>
              <Link href="/hall">See the private hall <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
        <div className="homeReservationsLocation">
          <div className="homeReservationsMap">
            <iframe
              src={GOOGLE_MAPS_EMBED_URL}
              title="Map showing Malabar Coast at 33 Main Street in Holytown"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <span aria-hidden="true">Map · Holytown</span>
          </div>
          <div className="homeReservationsLocationCopy">
            <p>Find the table</p>
            <h3>33 Main Street</h3>
            <address>
              Holytown<br />
              North Lanarkshire · ML1 4TH
            </address>
            <div className="homeReservationsCoordinates" aria-label="Restaurant coordinates">
              <span>55.8207° N</span>
              <i aria-hidden="true" />
              <span>3.9735° W</span>
            </div>
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">
              Get Directions <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
