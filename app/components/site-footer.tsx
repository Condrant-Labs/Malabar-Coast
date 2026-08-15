import Image from "next/image";
import Link from "next/link";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH";
const INSTAGRAM_URL = "https://www.instagram.com/malabarcoastuk";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="fill" cx="17.3" cy="6.8" r="1" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter" aria-label="Malabar Coast footer">
      <div className="siteFooterLead">
        <div className="siteFooterIntro">
          <p>Stay close to the coast</p>
          <h2>Our socials</h2>
          <span>Follow the kitchen, new dishes and moments from Malabar Coast.</span>
          <a className="siteFooterInstagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Follow Malabar Coast on Instagram">
            <i><InstagramIcon /></i>
            <span><small>Follow us on Instagram</small><strong>@malabarcoastuk</strong></span>
            <b aria-hidden="true">↗</b>
          </a>
        </div>

        <nav className="siteFooterNav" aria-label="Footer navigation">
          <p className="siteFooterSectionLabel">Explore</p>
          <Link href="/restaurant">Restaurant <span aria-hidden="true">↗</span></Link>
          <Link href="/hall">Private hall <span aria-hidden="true">↗</span></Link>
          <Link href="/menu">Menu <span aria-hidden="true">↗</span></Link>
          <Link href="/story">Our story <span aria-hidden="true">↗</span></Link>
          <Link href="/faq">Good to know <span aria-hidden="true">↗</span></Link>
          <Link href="/#reservations">Plan your visit <span aria-hidden="true">↗</span></Link>
        </nav>

        <address className="siteFooterAddress">
          <p>Come ashore</p>
          <strong>33 Main Street</strong>
          <span>Holytown, North Lanarkshire</span>
          <span>ML1 4TH · Scotland</span>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
        </address>
      </div>

      <div className="siteFooterBrand" aria-hidden="true">
        <i />
        <Image src="/malabar af.svg" alt="" width={2383} height={2402} sizes="(max-width: 600px) 28vw, 7rem" />
        <i />
      </div>

      <div className="siteFooterLegal">
        <div aria-label="Legal and policy pages">
          <Link href="/payments">Payments</Link>
          <i>·</i>
          <Link href="/returns">Returns</Link>
          <i>·</i>
          <Link href="/cookie">Cookie</Link>
          <i>·</i>
          <Link href="/privacy">Privacy</Link>
        </div>
        <p>© Malabar Coast 2026. All rights reserved.</p>
      </div>

      <a className="siteFooterCredit" href="https://codrantlabs.in/" target="_blank" rel="noreferrer" aria-label="Website made by Codrant Labs">
        Made by <span> Codrantlabs.in</span>
      </a>
    </footer>
  );
}
