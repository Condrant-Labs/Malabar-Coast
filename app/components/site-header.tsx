"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";
import type { SiteSettings } from "@/sanity/lib/site";

const NAV_REVEAL_SCROLL_THRESHOLD = 4;

export function SiteHeader({settings}: {settings: SiteSettings}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpenedOnPath, setMenuOpenedOnPath] = useState<string | null>(null);
  const [homeNavScrolled, setHomeNavScrolled] = useState(false);
  const isMenuOpen = menuOpenedOnPath === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const { itemCount, openCart, hydrated } = useCart();
  const navMinimal = isHome && !homeNavScrolled;

  useEffect(() => {
    if (!isHome) return;

    const checkScroll = () => {
      if (window.scrollY > NAV_REVEAL_SCROLL_THRESHOLD) setHomeNavScrolled(true);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, [isHome]);

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;

    event.preventDefault();
    setMenuOpenedOnPath(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    window.dispatchEvent(new Event("malabar:replay-intro"));
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenedOnPath(null);
        return;
      }

      if (event.key !== "Tab") return;

      const panel = menuPanelRef.current;
      const toggle = menuButtonRef.current;
      if (!panel || !toggle) return;

      const panelLinks = Array.from(panel.querySelectorAll<HTMLElement>("a[href]"));
      const focusableElements = [toggle, ...panelLinks];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      menuPanelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className={`nav siteHeader ${navMinimal ? "navMinimal" : ""}`} aria-label="Primary navigation">
        <Link className="bookButton" href="/#reservations" inert={navMinimal}>
          <span>Plan your visit</span>
          <span className="arrow" aria-hidden="true">↗</span>
        </Link>

        <Link className="brand" href="/" aria-label={`${settings.restaurantName} home`} onClick={handleBrandClick}>
          <Image src={settings.logo.url} alt={settings.logo.alt} width={2383} height={2402} priority />
        </Link>

        <div className="headerActions" inert={navMinimal}>
          <button className="cartButton" type="button" onClick={openCart} aria-label={`Open order, ${itemCount} items`}>
            <span>Order</span><b aria-live="polite">{hydrated ? itemCount : 0}</b>
          </button>
          <button
            ref={menuButtonRef}
            className={`menuButton ${isMenuOpen ? "isOpen" : ""}`}
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="site-navigation"
            onClick={() => setMenuOpenedOnPath((currentPath) => currentPath === pathname ? null : pathname)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <button
        className={`siteMenuScrim ${isMenuOpen ? "isOpen" : ""}`}
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setMenuOpenedOnPath(null)}
      />

      <aside
        ref={menuPanelRef}
        className={`menuPanel siteMenuPanel ${isMenuOpen ? "isOpen" : ""}`}
        id="site-navigation"
        role="dialog"
        aria-label="Site navigation"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
      >
        <div className="menuInner">
          <p>Navigate the coast</p>
          <nav aria-label="Menu">
            {settings.primaryNavigation.map((link, index) => (
              <Link href={link.href} key={`${link.href}-${link.label}`} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab ? "noreferrer" : undefined} onClick={() => setMenuOpenedOnPath(null)}>
                <span>{String(index + 1).padStart(2, "0")}</span>{link.label}
              </Link>
            ))}
          </nav>
          <small>{settings.address.streetAddress} · {settings.address.locality} · {settings.address.postalCode}</small>
        </div>
      </aside>
    </>
  );
}
