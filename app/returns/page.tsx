import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Returns & Cancellations",
  description: "Malabar Coast policy for fresh food cancellations, order issues, delivery problems and refunds.",
  alternates: { canonical: "/returns" },
};

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: <p>At Malabar Coast, we prepare fresh, perishable food to order. Because of the nature of fresh food, this policy explains when refunds and remedies do and do not apply. Nothing in this policy affects your statutory rights.</p>,
  },
  {
    id: "fresh-food",
    title: "Fresh, perishable food — no change-of-mind refunds",
    content: <p>Our meals are freshly prepared, perishable goods made to order. For this reason, and in line with the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, the 14-day “cooling-off” cancellation right does <strong>not</strong> apply to our food products once your order has been placed and prepared. We are unable to offer refunds or accept returns for a change of mind.</p>,
  },
  {
    id: "order-problems",
    title: "If something is wrong with your order",
    content: <p>Where an item is missing or unavailable, we will replace it in a future delivery or refund the value of that item to your original payment method — whichever you prefer. From time to time we may also offer a refund, replacement or goodwill credit at our discretion as a gesture of goodwill; doing so does not change the terms of this policy.</p>,
  },
  {
    id: "delivery-issues",
    title: "Delivery issues",
    content: <p>If your order does not arrive on your selected delivery day, or there is a problem with delivery, please contact us within 48 hours and we will investigate with our delivery partner and make it right.</p>,
  },
  {
    id: "refunds",
    title: "How refunds are issued",
    content: <p>Where a refund is due, it will be made to your original payment method within a reasonable period, usually within 3–5 business days of us confirming the remedy. Your bank or payment provider may require additional processing time before the funds appear.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    content: <p>For any questions about this policy, email <a href="mailto:reservations@malabarcoast.co.uk">reservations@malabarcoast.co.uk</a>. This policy does not affect your statutory rights.</p>,
  },
];

export default function ReturnsPage() {
  return <LegalPage eyebrow="Customer care · Fresh food" title="Returns & cancellations" summary="A clear guide to cancellations, missing items, delivery problems and how eligible refunds are returned to you." sections={sections} />;
}
