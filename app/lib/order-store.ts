import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllowedAdminTransitions, resolvePaymentTransition, type OrderRecord, type OrderStatus, type PaymentProvider, type PaymentStatus } from "./orders";
import { isSupabaseServerConfigured, supabaseServerRequest, supabaseServerRpc } from "./supabase/server";

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "orders.json");
const ORDER_DATABASE_CONTRACT_VERSION = "2026-08-15-supabase-admin-auth-v3";
let writeQueue: Promise<void> = Promise.resolve();

async function readLocalOrders(): Promise<OrderRecord[]> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as OrderRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalOrders(orders: OrderRecord[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(orders, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  if (isSupabaseServerConfigured()) {
    const response = await supabaseServerRequest(`orders?id=eq.${encodeURIComponent(id)}&select=data&limit=1`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows[0]?.data ?? null;
  }
  return (await readLocalOrders()).find((order) => order.id === id) ?? null;
}

export type AtomicCheckoutResult = {
  result: "created" | "existing" | "conflict";
  order: OrderRecord;
};

export async function createCheckoutOrderAtomic(order: OrderRecord): Promise<AtomicCheckoutResult> {
  if (!order.idempotencyKeyHash || !order.requestFingerprint) throw new Error("Checkout idempotency data is missing.");
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<AtomicCheckoutResult>("create_checkout_order", {
      p_id: order.id,
      p_provider: order.provider,
      p_idempotency_key_hash: order.idempotencyKeyHash,
      p_request_fingerprint: order.requestFingerprint,
      p_data: order,
      p_created_at: order.createdAt,
    });
  }
  if (process.env.NODE_ENV === "production") throw new Error("Order storage is not configured. Add Supabase environment variables.");

  let result: AtomicCheckoutResult | undefined;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const existing = orders.find((candidate) => candidate.idempotencyKeyHash === order.idempotencyKeyHash);
    if (existing) {
      result = { result: existing.requestFingerprint === order.requestFingerprint ? "existing" : "conflict", order: existing };
      return;
    }
    await writeLocalOrders([...orders, order]);
    result = { result: "created", order };
  });
  await writeQueue;
  if (!result) throw new Error("Atomic checkout creation did not return a result.");
  return result;
}

export function isDurableOrderStorageConfigured() {
  return isSupabaseServerConfigured();
}

export async function checkDurableOrderStorage() {
  if (!isSupabaseServerConfigured()) return false;
  try {
    const health = await supabaseServerRpc<{ version?: string }>("order_database_health", {});
    return health.version === ORDER_DATABASE_CONTRACT_VERSION;
  } catch {
    return false;
  }
}

export async function listOrders(limit = 100): Promise<OrderRecord[]> {
  const safeLimit = Math.min(250, Math.max(1, Math.floor(limit)));
  if (isSupabaseServerConfigured()) {
    const query = new URLSearchParams({ select: "data", order: "created_at.desc", limit: String(safeLimit) });
    const response = await supabaseServerRequest(`orders?${query}`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows.map((row) => row.data);
  }
  return (await readLocalOrders())
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, safeLimit);
}

export type OrderListOptions = {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  statuses?: OrderStatus[];
  fulfilment?: "collection" | "delivery";
  provider?: PaymentProvider;
};

export async function listOrdersPage(options: OrderListOptions = {}): Promise<OrderRecord[]> {
  const limit = Math.min(1_000, Math.max(1, Math.floor(options.limit ?? 100)));
  const offset = Math.max(0, Math.floor(options.offset ?? 0));
  if (isSupabaseServerConfigured()) {
    const query = new URLSearchParams({
      select: "data",
      order: "created_at.desc",
      limit: String(limit),
      offset: String(offset),
    });
    if (options.from) query.set("created_at", `gte.${options.from}`);
    if (options.to) query.append("created_at", `lt.${options.to}`);
    if (options.statuses?.length) query.set("status", `in.(${options.statuses.join(",")})`);
    if (options.fulfilment) query.set("data->>fulfilment", `eq.${options.fulfilment}`);
    if (options.provider) query.set("provider", `eq.${options.provider}`);
    const response = await supabaseServerRequest(`orders?${query}`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows.map((row) => row.data);
  }

  return (await readLocalOrders())
    .filter((order) => !options.from || order.createdAt >= options.from)
    .filter((order) => !options.to || order.createdAt < options.to)
    .filter((order) => !options.statuses?.length || options.statuses.includes(order.status))
    .filter((order) => !options.fulfilment || order.fulfilment === options.fulfilment)
    .filter((order) => !options.provider || order.provider === options.provider)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(offset, offset + limit);
}

export async function listOrdersForReport(
  from?: string,
  to?: string,
  filters: Pick<OrderListOptions, "statuses" | "fulfilment" | "provider"> = {},
): Promise<OrderRecord[]> {
  const orders: OrderRecord[] = [];
  const pageSize = 1_000;
  // PostgREST installations commonly cap a response at 1,000 rows. Page explicitly
  // so monthly and annual reports do not silently under-count a busy restaurant.
  for (let offset = 0; ; offset += pageSize) {
    const page = await listOrdersPage({ limit: pageSize, offset, from, to, ...filters });
    orders.push(...page);
    if (page.length < pageSize) break;
  }
  return orders;
}

export async function updateOrderAdminNotes(id: string, adminNotes: string, actorUserId: string) {
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<OrderRecord | null>("update_order_admin_notes", {
      p_order_id: id,
      p_admin_notes: adminNotes,
      p_actor_user_id: actorUserId,
    });
  }

  let result: OrderRecord | null = null;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index < 0) return;
    const now = new Date().toISOString();
    result = { ...orders[index], adminNotes, updatedAt: now };
    orders[index] = result;
    await writeLocalOrders(orders);
  });
  await writeQueue;
  return result;
}

export async function attachCheckoutProviderReference(id: string, provider: PaymentProvider, providerReference?: string, providerCheckoutUrl?: string) {
  if (!providerReference && !providerCheckoutUrl) throw new Error("Provider checkout identity is missing.");
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<OrderRecord | null>("attach_checkout_provider_reference", {
      p_order_id: id,
      p_provider: provider,
      p_provider_reference: providerReference || null,
      p_provider_checkout_url: providerCheckoutUrl || null,
    });
  }

  let result: OrderRecord | null = null;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === id && order.provider === provider);
    if (index < 0) return;
    const current = orders[index];
    if (current.providerReference && providerReference && current.providerReference !== providerReference) return;
    if (current.providerCheckoutUrl && providerCheckoutUrl && current.providerCheckoutUrl !== providerCheckoutUrl) return;
    const now = new Date().toISOString();
    result = {
      ...current,
      providerReference: providerReference || current.providerReference,
      providerCheckoutUrl: providerCheckoutUrl || current.providerCheckoutUrl,
      updatedAt: now,
    };
    orders[index] = result;
    await writeLocalOrders(orders);
  });
  await writeQueue;
  return result;
}

export async function transitionOrderStatus(id: string, nextStatus: OrderStatus, actorUserId: string) {
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<OrderRecord | null>("transition_order_status", {
      p_order_id: id,
      p_next_status: nextStatus,
      p_actor_user_id: actorUserId,
    });
  }

  let result: OrderRecord | null = null;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index < 0 || !getAllowedAdminTransitions(orders[index]).includes(nextStatus)) return;
    const current = orders[index];
    const now = new Date().toISOString();
    const updated: OrderRecord = {
      ...current,
      status: nextStatus,
      updatedAt: now,
      statusHistory: [
        ...(current.statusHistory || []),
        { status: nextStatus, at: now, actor: "admin" as const },
      ].slice(-100),
    };
    orders[index] = updated;
    await writeLocalOrders(orders);
    result = updated;
  });
  await writeQueue;
  return result;
}

export async function applyPaymentEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  orderId: string;
  paymentStatus: PaymentStatus;
  outcome: string;
  providerReference?: string;
  amountPence?: number;
  currency?: string;
}) {
  if (isSupabaseServerConfigured()) {
    return supabaseServerRpc<boolean>("apply_order_payment_event", {
      p_provider: input.provider,
      p_event_id: input.eventId,
      p_order_id: input.orderId,
      p_payment_status: input.paymentStatus,
      p_outcome: input.outcome,
      p_provider_reference: input.providerReference || null,
      p_amount_pence: input.amountPence ?? null,
      p_currency: input.currency || null,
    });
  }

  let applied = false;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === input.orderId && order.provider === input.provider);
    if (index < 0) return;
    const current = orders[index];
    if (current.processedWebhookIds?.includes(input.eventId)) return;
    if (current.providerReference && input.providerReference && current.providerReference !== input.providerReference) return;
    if (input.amountPence !== undefined && input.amountPence !== current.totalPence) return;
    if (input.currency && input.currency.toUpperCase() !== current.currency) return;
    const identityRequired = ["paid", "partially_refunded", "refunded", "disputed", "reversed"].includes(input.paymentStatus);
    if (identityRequired && (!input.providerReference || input.amountPence !== current.totalPence || input.currency?.toUpperCase() !== current.currency)) return;
    const now = new Date().toISOString();
    const transition = resolvePaymentTransition(current, input.paymentStatus);
    orders[index] = {
      ...current,
      status: transition.orderStatus,
      paymentStatus: transition.paymentStatus,
      providerOutcome: input.outcome.slice(0, 180),
      providerReference: input.providerReference || current.providerReference,
      processedWebhookIds: [...(current.processedWebhookIds || []), input.eventId].slice(-50),
      statusHistory: transition.orderStatus === current.status
        ? current.statusHistory
        : [...(current.statusHistory || []), { status: transition.orderStatus, at: now, actor: "payment_provider" as const }].slice(-100),
      updatedAt: now,
    };
    await writeLocalOrders(orders);
    applied = true;
  });
  await writeQueue;
  return applied;
}
