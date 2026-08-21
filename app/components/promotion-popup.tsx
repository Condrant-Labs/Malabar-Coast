"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import type {Promotion} from "@/sanity/lib/promotions";

const POPUP_DELAY_MS = 900;
const SLIDE_INTERVAL_MS = 6500;

export function PromotionPopup({promotions, ready}: {promotions: Promotion[]; ready: boolean}) {
  const popupPromotions = useMemo(() => promotions.filter((promotion) => promotion.showOnHomepage !== false), [promotions]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const storageKey = useMemo(() => `malabar-offers-seen:${popupPromotions.map((promotion) => promotion._id).join(",")}`, [popupPromotions]);

  useEffect(() => {
    if (!ready || popupPromotions.length === 0 || window.sessionStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setOpen(true), POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [popupPromotions.length, ready, storageKey]);

  useEffect(() => {
    if (!open || popupPromotions.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % popupPromotions.length), SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [open, popupPromotions.length]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.sessionStorage.setItem(storageKey, "1");
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, storageKey]);

  if (!open || popupPromotions.length === 0) return null;
  const activePromotion = popupPromotions[Math.min(activeIndex, popupPromotions.length - 1)];

  const close = () => {
    window.sessionStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  const selectPrevious = () => setActiveIndex((current) => (current - 1 + popupPromotions.length) % popupPromotions.length);
  const selectNext = () => setActiveIndex((current) => (current + 1) % popupPromotions.length);

  return (
    <div className="promotionPopup" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && close()}>
      <div ref={dialogRef} className="promotionPopupDialog" role="dialog" aria-modal="true" aria-labelledby="promotion-popup-title">
        <button ref={closeButtonRef} className="promotionPopupClose" type="button" onClick={close} aria-label="Close offers popup">×</button>
        <div className="promotionPopupPoster">
          <Image
            src={activePromotion.poster.url}
            alt={activePromotion.poster.alt}
            fill
            sizes="(max-width: 720px) 92vw, 480px"
            placeholder={activePromotion.poster.lqip ? "blur" : "empty"}
            blurDataURL={activePromotion.poster.lqip}
          />
        </div>
        <div className="promotionPopupCopy">
          <p>{activePromotion.badge || "Offer available"}</p>
          <h2 id="promotion-popup-title">{activePromotion.title}</h2>
          {activePromotion.summary && <span>{activePromotion.summary}</span>}
          {activePromotion.offerCode && <strong>Use code <b>{activePromotion.offerCode}</b></strong>}
          {activePromotion.validityLabel && <small>{activePromotion.validityLabel}</small>}
          <div className="promotionPopupActions">
            {activePromotion.callToAction?.href && <Link href={activePromotion.callToAction.href} target={activePromotion.callToAction.openInNewTab ? "_blank" : undefined} rel={activePromotion.callToAction.openInNewTab ? "noreferrer" : undefined} onClick={close}>{activePromotion.callToAction.label} <span aria-hidden="true">↗</span></Link>}
            <Link href="/offers" onClick={close}>View all offers <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        {popupPromotions.length > 1 && <div className="promotionPopupNav" aria-label="Choose an offer">
          <button type="button" onClick={selectPrevious} aria-label="Previous offer">←</button>
          <div>{popupPromotions.map((promotion, index) => <button type="button" key={promotion._id} className={index === activeIndex ? "isActive" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show offer ${index + 1}: ${promotion.title}`} aria-current={index === activeIndex ? "true" : undefined} />)}</div>
          <button type="button" onClick={selectNext} aria-label="Next offer">→</button>
        </div>}
      </div>
    </div>
  );
}
