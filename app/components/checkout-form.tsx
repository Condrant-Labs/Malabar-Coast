"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatPrice } from "../lib/menu";
import type { FulfilmentMethod, PaymentProvider } from "../lib/orders";
import { useCart } from "./cart-provider";

type PaymentConfig = { stripe: boolean; worldpay: boolean; deliveryFeePence: number };

export function CheckoutForm() {
  const { lines, items, subtotalPence, setQuantity, removeItem, clearCart, hydrated } = useCart();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("collection");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/payment-config").then((response) => response.json()).then((value: PaymentConfig) => {
      if (!active) return;
      setConfig(value);
      if (!value.stripe && value.worldpay) setProvider("worldpay");
    }).catch(() => active && setError("Payment configuration could not be loaded."));
    return () => { active = false; };
  }, []);

  const deliveryFee = fulfilment === "delivery" ? config?.deliveryFeePence ?? 350 : 0;
  const totalPence = subtotalPence + deliveryFee;
  const selectedProviderAvailable = provider === "stripe" ? config?.stripe : config?.worldpay;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProviderAvailable) return setError("This payment method is not configured yet.");
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          provider, fulfilment, cart: items,
          customer: { name: data.get("name"), email: data.get("email"), phone: data.get("phone") },
          requestedTime: data.get("requestedTime"), orderNote: data.get("orderNote"),
          deliveryAddress: { line1: data.get("line1"), line2: data.get("line2"), city: data.get("city"), postcode: data.get("postcode") },
        }),
      });
      const result = await response.json() as { error?: string; redirectUrl?: string };
      if (!response.ok) throw new Error(result.error || "Payment could not be started.");
      if (result.redirectUrl) window.location.assign(result.redirectUrl);
      else throw new Error("The payment provider did not return a checkout destination.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not be started.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return <main className="checkoutPage"><div className="checkoutLoading">Preparing your order…</div></main>;
  if (lines.length === 0) return (
    <main className="checkoutPage checkoutEmptyPage"><div><p>Your order · 00</p><h1>The table is<br />still empty.</h1><span>Add a few dishes before continuing to checkout.</span><Link href="/menu">Explore the menu <b>→</b></Link></div></main>
  );

  return (
    <main className="checkoutPage">
      <form className="checkoutLayout" onSubmit={handleSubmit}>
        <div className="checkoutDetails">
          <section className="checkoutSection"><div className="checkoutSectionHeading"><span>01</span><div><p>Your details</p><h2>Who is collecting?</h2></div></div><div className="fieldGrid"><label>Full name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required /></label></div></section>

          <section className="checkoutSection"><div className="checkoutSectionHeading"><span>02</span><div><p>Fulfilment</p><h2>How should it arrive?</h2></div></div><div className="choiceCards"><label className={fulfilment === "collection" ? "isSelected" : ""}><input type="radio" name="fulfilment" value="collection" checked={fulfilment === "collection"} onChange={() => setFulfilment("collection")} /><strong>Collection</strong><span>Collect from 33 Main Street</span></label><label className={fulfilment === "delivery" ? "isSelected" : ""}><input type="radio" name="fulfilment" value="delivery" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} /><strong>Delivery</strong><span>{formatPrice(config?.deliveryFeePence ?? 350)} delivery fee</span></label></div><label className="fullField">Requested date &amp; time<input name="requestedTime" type="datetime-local" required /></label>{fulfilment === "delivery" && <div className="fieldGrid addressFields"><label>Address line 1<input name="line1" autoComplete="address-line1" required /></label><label>Address line 2<input name="line2" autoComplete="address-line2" /></label><label>Town or city<input name="city" autoComplete="address-level2" required /></label><label>Postcode<input name="postcode" autoComplete="postal-code" required /></label></div>}<label className="fullField">Order note<textarea name="orderNote" maxLength={500} placeholder="Anything the kitchen or front of house should know?" /></label></section>

          <section className="checkoutSection"><div className="checkoutSectionHeading"><span>03</span><div><p>Payment</p><h2>Choose your passage.</h2></div></div>{config && !config.stripe && !config.worldpay && <div className="paymentNotice">Payments are not enabled for this environment. Add the required values to <code>.env.local</code>, using <code>.env.example</code> only as the variable reference, then restart the server.</div>}<div className="choiceCards paymentChoices"><label className={provider === "stripe" ? "isSelected" : ""}><input type="radio" name="provider" value="stripe" checked={provider === "stripe"} onChange={() => setProvider("stripe")} /><strong>Stripe</strong><span>{config?.stripe ? "Secure hosted checkout" : "Setup incomplete"}</span></label><label className={provider === "worldpay" ? "isSelected" : ""}><input type="radio" name="provider" value="worldpay" checked={provider === "worldpay"} onChange={() => setProvider("worldpay")} /><strong>Worldpay</strong><span>{config?.worldpay ? "Secure hosted checkout" : "Setup incomplete"}</span></label></div><p className="providerExplanation">You will continue to {provider === "stripe" ? "Stripe" : "Worldpay"}&apos;s secure checkout to complete payment. Your order stays here; the provider handles card details and verification.</p></section>
        </div>

        <aside className="checkoutSummary"><div className="summaryHeading"><div><span>Your order</span><strong>{lines.length} {lines.length === 1 ? "line" : "lines"}</strong></div><Link href="/menu">Add dishes</Link></div><div className="summaryLines">{lines.map((line) => <article key={line.id}><div><strong>{line.menuItem.name}</strong><span>{line.menuItem.description}</span>{line.note && <small>Note: {line.note}</small>}</div><b>{formatPrice(line.lineTotalPence)}</b><div className="quantityControl"><button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)}>+</button><button type="button" className="removeLine" onClick={() => removeItem(line.id)}>Remove</button></div></article>)}</div><div className="summaryTotals"><p><span>Subtotal</span><b>{formatPrice(subtotalPence)}</b></p><p><span>Delivery</span><b>{deliveryFee ? formatPrice(deliveryFee) : "—"}</b></p><strong><span>Total</span><b>{formatPrice(totalPence)}</b></strong></div>{error && <div className="checkoutError" role="alert">{error}</div>}<button className="payButton" type="submit" disabled={submitting || !selectedProviderAvailable}>{submitting ? "Starting secure payment…" : `Pay ${formatPrice(totalPence)}`}<span>→</span></button><button className="clearOrder" type="button" onClick={clearCart}>Clear order</button><small>Totals are checked again on the server. By placing an order you confirm the details above are correct.</small></aside>
      </form>
    </main>
  );
}
