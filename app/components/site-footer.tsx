import Image from "next/image";
import Link from "next/link";
import {Fragment} from "react";
import type { SiteSettings } from "@/sanity/lib/site";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="fill" cx="17.3" cy="6.8" r="1" />
    </svg>
  );
}

export function SiteFooter({settings}: {settings: SiteSettings}) {
  const instagram = settings.socialLinks.find((link) => link.platform.toLowerCase() === "instagram") ?? settings.socialLinks[0];
  return (
    <footer className="siteFooter" aria-label={`${settings.restaurantName} footer`}>
      <div className="siteFooterLead">
        <div className="siteFooterIntro">
          <p>Stay close to the coast</p>
          <h2>Our socials</h2>
          <span>Follow the kitchen, new dishes and moments from Malabar Coast.</span>
          {instagram && <a className="siteFooterInstagram" href={instagram.url} target="_blank" rel="noreferrer" aria-label={`Follow ${settings.restaurantName} on ${instagram.platform}`}>
            <i><InstagramIcon /></i>
            <span><small>Follow us on {instagram.platform}</small><strong>{instagram.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</strong></span>
            <b aria-hidden="true">↗</b>
          </a>}
        </div>

        <nav className="siteFooterNav" aria-label="Footer navigation">
          <p className="siteFooterSectionLabel">Explore</p>
          {settings.primaryNavigation.filter((link) => link.href !== "/checkout").map((link) => (
            <Link href={link.href} key={`${link.href}-${link.label}`} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab ? "noreferrer" : undefined}>{link.label} <span aria-hidden="true">↗</span></Link>
          ))}
        </nav>

        <address className="siteFooterAddress">
          <p>Come ashore</p>
          <strong>{settings.address.streetAddress}</strong>
          <span>{settings.address.locality}, {settings.address.region}</span>
          <span>{settings.address.postalCode} · Scotland</span>
          <a href={settings.mapUrl} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
        </address>
      </div>

      <div className="siteFooterBrand" aria-hidden="true">
        <i />
        <Image src={settings.logo.url} alt="" width={2383} height={2402} sizes="(max-width: 600px) 28vw, 7rem" />
        <i />
      </div>

      <div className="siteFooterLegal">
        <div aria-label="Legal and policy pages">
          {settings.footerNavigation.map((link, index) => <Fragment key={`${link.href}-${link.label}`}><Link href={link.href}>{link.label}</Link>{index < settings.footerNavigation.length - 1 && <i>·</i>}</Fragment>)}
        </div>
        <p>{settings.copyrightText}</p>
      </div>

      <a className="siteFooterCredit" href="https://codrantlabs.in/" target="_blank" rel="noreferrer" aria-label="Website made by Codrant Labs">
        Made by <span> Codrantlabs.in</span>
      </a>
    </footer>
  );
}
