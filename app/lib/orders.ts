import { getMenuItem } from "./menu";

export type PaymentProvider = "stripe" | "worldpay";
export type FulfilmentMethod = "collection" | "delivery";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "partially_refunded"
  | "refunded"
  | "disputed"
  | "reversed";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "payment_failed"
  | "cancelled"
  | "expired"
  | "payment_partially_refunded"
  | "refunded"
  | "payment_disputed"
  | "payment_reversed";

export type OrderStatusHistoryEntry = {
  status: OrderStatus;
  at: string;
  actor: "system" | "payment_provider" | "admin";
  note?: string;
};

export type CheckoutCartItem = { id: string; quantity: number; note?: string };
export type OrderLine = {
  menuItemId: string;
  name: string;
  unitPricePence: number;
  quantity: number;
  note: string;
  lineTotalPence: number;
};

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
};

export type DeliveryAddress = {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
};

export type OrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  provider: PaymentProvider;
  providerReference?: string;
  providerCheckoutUrl?: string;
  providerOutcome?: string;
  processedWebhookIds?: string[];
  idempotencyKeyHash?: string;
  requestFingerprint?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  customer: CustomerDetails;
  fulfilment: FulfilmentMethod;
  requestedTime: string;
  deliveryAddress?: DeliveryAddress;
  orderNote: string;
  adminNotes?: string;
  lines: OrderLine[];
  subtotalPence: number;
  deliveryFeePence: number;
  totalPence: number;
  currency: "GBP";
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  payment_failed: "Payment failed",
  cancelled: "Cancelled",
  expired: "Payment expired",
  payment_partially_refunded: "Partially refunded",
  refunded: "Refunded",
  payment_disputed: "Payment disputed",
  payment_reversed: "Payment reversed",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  disputed: "Disputed",
  reversed: "Reversed",
};

const adminStatusTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ["confirmed"],
  confirmed: ["preparing"],
  preparing: ["ready"],
  ready: ["out_for_delivery", "completed"],
  out_for_delivery: ["completed"],
};

export function getAllowedAdminTransitions(order: Pick<OrderRecord, "status" | "fulfilment" | "paymentStatus">) {
  if (inferPaymentStatus(order) !== "paid") return [];
  const transitions = adminStatusTransitions[order.status] ?? [];
  return order.fulfilment === "collection"
    ? transitions.filter((status) => status !== "out_for_delivery")
    : transitions;
}

export function inferPaymentStatus(order: Pick<OrderRecord, "status" | "paymentStatus">): PaymentStatus {
  if (order.paymentStatus) return order.paymentStatus;
  if (["paid", "confirmed", "preparing", "ready", "out_for_delivery", "completed"].includes(order.status)) return "paid";
  if (order.status === "payment_failed") return "failed";
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "expired") return "expired";
  if (order.status === "payment_partially_refunded") return "partially_refunded";
  if (order.status === "refunded") return "refunded";
  if (order.status === "payment_disputed") return "disputed";
  if (order.status === "payment_reversed") return "reversed";
  return "pending";
}

export function isPaymentConfirmed(order: Pick<OrderRecord, "status" | "paymentStatus">) {
  return inferPaymentStatus(order) === "paid";
}

const irreversiblePaymentStates: PaymentStatus[] = ["partially_refunded", "refunded", "disputed", "reversed"];

export function resolvePaymentTransition(
  order: Pick<OrderRecord, "status" | "paymentStatus">,
  incoming: PaymentStatus,
): { paymentStatus: PaymentStatus; orderStatus: OrderStatus } {
  const currentPayment = inferPaymentStatus(order);

  if (irreversiblePaymentStates.includes(currentPayment) && incoming === "paid") {
    return { paymentStatus: currentPayment, orderStatus: order.status };
  }
  if (currentPayment === "refunded") {
    return { paymentStatus: currentPayment, orderStatus: order.status };
  }
  if (incoming === "refunded") return { paymentStatus: incoming, orderStatus: "refunded" };
  if (incoming === "disputed") return { paymentStatus: incoming, orderStatus: "payment_disputed" };
  if (incoming === "reversed") return { paymentStatus: incoming, orderStatus: "payment_reversed" };
  if (incoming === "partially_refunded") return { paymentStatus: incoming, orderStatus: "payment_partially_refunded" };

  if (["failed", "cancelled", "expired"].includes(incoming) && currentPayment === "paid") {
    return { paymentStatus: "reversed", orderStatus: "payment_reversed" };
  }
  if (incoming === "paid" && ["pending_payment", "payment_failed", "cancelled", "expired"].includes(order.status)) {
    return { paymentStatus: incoming, orderStatus: "paid" };
  }
  if (incoming === "failed" && order.status === "pending_payment") {
    return { paymentStatus: incoming, orderStatus: "payment_failed" };
  }
  if (incoming === "cancelled" && ["pending_payment", "payment_failed"].includes(order.status)) {
    return { paymentStatus: incoming, orderStatus: "cancelled" };
  }
  if (incoming === "expired" && ["pending_payment", "payment_failed"].includes(order.status)) {
    return { paymentStatus: incoming, orderStatus: "expired" };
  }
  if (incoming === "pending" && currentPayment !== "pending") {
    return { paymentStatus: currentPayment, orderStatus: order.status };
  }
  return { paymentStatus: incoming, orderStatus: order.status };
}

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

function cleanText(value: unknown, label: string, maxLength: number, required = true) {
  const text = typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  if (required && !text) throw new CheckoutValidationError(`${label} is required.`);
  return text;
}

function formatRestaurantLocal(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((all, part) => {
    if (part.type !== "literal") all[part.type] = part.value;
    return all;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function validateRequestedTime(value: unknown) {
  const requested = cleanText(value, "Requested time", 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(requested)) {
    throw new CheckoutValidationError("Choose a valid requested date and time.");
  }
  const now = new Date();
  if (requested < formatRestaurantLocal(new Date(now.getTime() - 5 * 60_000))) {
    throw new CheckoutValidationError("Requested time must be in the future.");
  }
  if (requested > formatRestaurantLocal(new Date(now.getTime() + 90 * 24 * 60 * 60_000))) {
    throw new CheckoutValidationError("Requested time must be within the next 90 days.");
  }
  return requested;
}

export function getDeliveryFeePence() {
  const configured = Number(process.env.DELIVERY_FEE_PENCE);
  return Number.isInteger(configured) && configured >= 0 ? configured : 350;
}

export function validateCheckout(input: unknown) {
  if (!input || typeof input !== "object") throw new CheckoutValidationError("Checkout details are missing.");
  const body = input as Record<string, unknown>;
  if (body.provider !== "stripe" && body.provider !== "worldpay") throw new CheckoutValidationError("Choose a payment method.");
  const provider: PaymentProvider = body.provider;
  if (body.fulfilment !== "collection" && body.fulfilment !== "delivery") throw new CheckoutValidationError("Choose collection or delivery.");
  const fulfilment: FulfilmentMethod = body.fulfilment;

  const customerInput = body.customer && typeof body.customer === "object" ? body.customer as Record<string, unknown> : {};
  const customer: CustomerDetails = {
    name: cleanText(customerInput.name, "Name", 100),
    email: cleanText(customerInput.email, "Email", 160).toLowerCase(),
    phone: cleanText(customerInput.phone, "Phone", 40),
  };
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) throw new CheckoutValidationError("Enter a valid email address.");
  if (!/^[+()\d][+()\d\s.-]{6,38}$/.test(customer.phone)) throw new CheckoutValidationError("Enter a valid phone number.");

  const cart = Array.isArray(body.cart) ? body.cart : [];
  if (cart.length === 0) throw new CheckoutValidationError("Your order is empty.");
  if (cart.length > 60) throw new CheckoutValidationError("Your order contains too many lines.");

  const combined = new Map<string, CheckoutCartItem>();
  for (const entry of cart) {
    if (!entry || typeof entry !== "object") throw new CheckoutValidationError("An order line is invalid.");
    const candidate = entry as Record<string, unknown>;
    const id = cleanText(candidate.id, "Dish", 100);
    const quantity = Number(candidate.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new CheckoutValidationError("Dish quantities must be between 1 and 20.");
    const existing = combined.get(id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > 20) throw new CheckoutValidationError("A dish quantity cannot exceed 20.");
    combined.set(id, { id, quantity: nextQuantity, note: cleanText(candidate.note, "Dish note", 240, false) });
  }

  const lines: OrderLine[] = Array.from(combined.values()).map((entry) => {
    const item = getMenuItem(entry.id);
    if (!item?.available) throw new CheckoutValidationError("A dish in your order is no longer available. Please review your order.");
    return { menuItemId: item.id, name: item.name, unitPricePence: item.pricePence, quantity: entry.quantity, note: entry.note ?? "", lineTotalPence: item.pricePence * entry.quantity };
  });
  const totalUnits = lines.reduce((total, line) => total + line.quantity, 0);
  if (totalUnits > 100) throw new CheckoutValidationError("Your order contains too many items.");

  let deliveryAddress: DeliveryAddress | undefined;
  if (fulfilment === "delivery") {
    const address = body.deliveryAddress && typeof body.deliveryAddress === "object" ? body.deliveryAddress as Record<string, unknown> : {};
    deliveryAddress = {
      line1: cleanText(address.line1, "Address line 1", 120),
      line2: cleanText(address.line2, "Address line 2", 120, false),
      city: cleanText(address.city, "Town or city", 80),
      postcode: cleanText(address.postcode, "Postcode", 16).toUpperCase(),
    };
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(deliveryAddress.postcode)) {
      throw new CheckoutValidationError("Enter a valid UK postcode.");
    }
  }

  const subtotalPence = lines.reduce((total, line) => total + line.lineTotalPence, 0);
  const deliveryFeePence = fulfilment === "delivery" ? getDeliveryFeePence() : 0;
  const totalPence = subtotalPence + deliveryFeePence;
  const configuredMaximum = Number(process.env.MAX_ORDER_TOTAL_PENCE);
  const maximumTotal = Number.isInteger(configuredMaximum) && configuredMaximum > 0 ? configuredMaximum : 100_000;
  if (totalPence > maximumTotal) throw new CheckoutValidationError("This order is above the online checkout limit. Please contact the restaurant.");

  return {
    provider,
    fulfilment,
    customer,
    deliveryAddress,
    requestedTime: validateRequestedTime(body.requestedTime),
    orderNote: cleanText(body.orderNote, "Order note", 500, false),
    lines,
    subtotalPence,
    deliveryFeePence,
    totalPence,
  };
}
