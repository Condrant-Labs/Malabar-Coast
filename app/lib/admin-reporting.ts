import { inferPaymentStatus, type OrderRecord, type OrderStatus } from "./orders";

export type ReportPeriod = "today" | "7d" | "30d" | "90d" | "year" | "all";

export const activeOrderStatuses: OrderStatus[] = ["paid", "confirmed", "preparing", "ready", "out_for_delivery"];
export const attentionOrderStatuses: OrderStatus[] = [
  "payment_failed",
  "payment_disputed",
  "payment_reversed",
];

function londonParts(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).reduce<Record<string, string>>((parts, part) => {
    if (part.type !== "literal") parts[part.type] = part.value;
    return parts;
  }, {});
}

export function londonDateKey(value: string | Date) {
  const parts = londonParts(typeof value === "string" ? new Date(value) : value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export function displayDay(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function getReportRange(period: ReportPeriod, now = new Date()) {
  if (period === "all") return { from: undefined, to: undefined };
  const today = londonDateKey(now);
  const localCursor = new Date(`${today}T12:00:00Z`);
  const toCursor = new Date(localCursor);
  toCursor.setUTCDate(toCursor.getUTCDate() + 1);
  if (period === "7d") localCursor.setUTCDate(localCursor.getUTCDate() - 6);
  if (period === "30d") localCursor.setUTCDate(localCursor.getUTCDate() - 29);
  if (period === "90d") localCursor.setUTCDate(localCursor.getUTCDate() - 89);
  if (period === "year") localCursor.setUTCMonth(0, 1);

  const localMidnightUtc = (date: Date) => {
    const key = date.toISOString().slice(0, 10);
    const [year, month, day] = key.split("-").map(Number);
    const zoneName = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      timeZoneName: "longOffset",
      hour: "2-digit",
    }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "GMT";
    const match = zoneName.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    const offsetMinutes = match ? (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0)) : 0;
    return new Date(Date.UTC(year, month - 1, day) - offsetMinutes * 60_000).toISOString();
  };
  return { from: localMidnightUtc(localCursor), to: localMidnightUtc(toCursor) };
}

function durationMinutes(order: OrderRecord) {
  const history = order.statusHistory || [];
  const start = history.find((entry) => entry.status === "confirmed")?.at;
  const end = history.find((entry) => entry.status === "completed")?.at;
  if (!start || !end) return null;
  const duration = (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
  return duration >= 0 && duration < 24 * 60 ? duration : null;
}

export function summariseOrders(orders: OrderRecord[]) {
  const paidOrders = orders.filter((order) => inferPaymentStatus(order) === "paid");
  const activeOrders = orders.filter((order) => activeOrderStatuses.includes(order.status));
  const completedOrders = paidOrders.filter((order) => order.status === "completed");
  const confirmedSalesPence = paidOrders.reduce((total, order) => total + order.totalPence, 0);
  const totalUnits = paidOrders.reduce(
    (total, order) => total + order.lines.reduce((lineTotal, line) => lineTotal + line.quantity, 0),
    0,
  );
  const preparationTimes = completedOrders.map(durationMinutes).filter((value): value is number => value !== null);
  const averagePreparationMinutes = preparationTimes.length
    ? Math.round(preparationTimes.reduce((total, value) => total + value, 0) / preparationTimes.length)
    : null;

  const dishMap = new Map<string, { name: string; units: number; salesPence: number }>();
  for (const order of paidOrders) {
    for (const line of order.lines) {
      const current = dishMap.get(line.menuItemId) || { name: line.name, units: 0, salesPence: 0 };
      current.units += line.quantity;
      current.salesPence += line.lineTotalPence;
      dishMap.set(line.menuItemId, current);
    }
  }

  const dayMap = new Map<string, { orders: number; salesPence: number }>();
  const monthMap = new Map<string, { orders: number; salesPence: number }>();
  for (const order of paidOrders) {
    const key = londonDateKey(order.createdAt);
    const current = dayMap.get(key) || { orders: 0, salesPence: 0 };
    current.orders += 1;
    current.salesPence += order.totalPence;
    dayMap.set(key, current);
    const monthKey = key.slice(0, 7);
    const month = monthMap.get(monthKey) || { orders: 0, salesPence: 0 };
    month.orders += 1;
    month.salesPence += order.totalPence;
    monthMap.set(monthKey, month);
  }

  const statusCounts = Object.fromEntries(
    orders.reduce((counts, order) => counts.set(order.status, (counts.get(order.status) || 0) + 1), new Map<OrderStatus, number>()),
  ) as Partial<Record<OrderStatus, number>>;

  return {
    orders,
    paidOrders,
    activeOrders,
    completedOrders,
    confirmedSalesPence,
    averageOrderPence: paidOrders.length ? Math.round(confirmedSalesPence / paidOrders.length) : 0,
    totalUnits,
    averagePreparationMinutes,
    collectionOrders: paidOrders.filter((order) => order.fulfilment === "collection").length,
    deliveryOrders: paidOrders.filter((order) => order.fulfilment === "delivery").length,
    stripeOrders: paidOrders.filter((order) => order.provider === "stripe").length,
    worldpayOrders: paidOrders.filter((order) => order.provider === "worldpay").length,
    attentionOrders: orders.filter((order) => attentionOrderStatuses.includes(order.status)),
    statusCounts,
    topDishes: [...dishMap.values()].sort((left, right) => right.units - left.units).slice(0, 8),
    daily: [...dayMap.entries()]
      .map(([date, values]) => ({ date, ...values }))
      .sort((left, right) => left.date.localeCompare(right.date)),
    monthly: [...monthMap.entries()]
      .map(([month, values]) => ({ month, ...values }))
      .sort((left, right) => left.month.localeCompare(right.month)),
  };
}

export function requestedToday(order: OrderRecord, now = new Date()) {
  return order.requestedTime.slice(0, 10) === londonDateKey(now);
}
