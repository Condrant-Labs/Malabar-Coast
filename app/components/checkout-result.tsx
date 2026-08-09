"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./cart-provider";

export function CheckoutResult({ kind, orderId }: { kind: "success" | "pending" | "cancelled" | "failure" | "expired"; orderId?: string }) {
  const { clearCart } = useCart();
  useEffect(() => {
    if (kind === "success") {
      const frame = window.requestAnimationFrame(clearCart);
      return () => window.cancelAnimationFrame(frame);
    }
  }, [clearCart, kind]);

  const content = kind === "success"
    ? { eyebrow: "Payment confirmed", title: "Thank you.", copy: "The payment provider has confirmed your payment. The restaurant can now move the order through its preparation and fulfilment stages." }
    : kind === "pending"
      ? { eyebrow: "Confirmation in progress", title: "Payment pending.", copy: "The return page cannot yet confirm cleared payment. Check the secure order page while the signed provider webhook completes the status update." }
    : kind === "cancelled"
      ? { eyebrow: "Payment cancelled", title: "Your order is saved.", copy: "Nothing has been charged. Your dishes are still in the cart, ready whenever you want to try again." }
      : kind === "expired"
        ? { eyebrow: "Payment session expired", title: "Your order is saved.", copy: "The secure payment window expired before checkout completed. Nothing has been confirmed; return to checkout when you are ready." }
      : { eyebrow: "Payment unsuccessful", title: "Let’s try again.", copy: "The payment did not complete. Check the details or choose another payment method; your cart has not been cleared." };

  return <main className={`checkoutResult is${kind}`}><div><p>{content.eyebrow}</p><h1>{content.title}</h1><span>{content.copy}</span>{orderId && <small>Order reference · {orderId}</small>}<div>{orderId && <Link href={`/order/${orderId}`}>Check order status <b>→</b></Link>}<Link href={kind === "success" ? "/menu" : "/checkout"}>{kind === "success" ? "Return to the menu" : "Return to checkout"} <b>→</b></Link><Link href="/">Home</Link></div></div></main>;
}
