"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { OrderRecord } from "../../lib/orders";
import { OrderTable } from "./admin-ui";
import { armOrderNotificationSound, playOrderNotificationSound } from "./order-notification-sound";

type BroadcastPayload = {
  orderId?: unknown;
};

type ConnectionState = "connecting" | "live" | "unavailable";

const orderIdPattern = /^ord_[A-Za-z0-9_-]{20,60}$/;

export function LiveRecentOrders({
  initialOrders,
  csrfToken,
  supabaseUrl,
  publishableKey,
}: {
  initialOrders: OrderRecord[];
  csrfToken?: string;
  supabaseUrl: string;
  publishableKey: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [connection, setConnection] = useState<ConnectionState>(
    supabaseUrl && publishableKey ? "connecting" : "unavailable",
  );

  useEffect(() => {
    if (!supabaseUrl || !publishableKey) return;

    const armSound = () => {
      void armOrderNotificationSound();
    };
    window.addEventListener("pointerdown", armSound, { once: true });
    window.addEventListener("keydown", armSound, { once: true });

    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const pendingRequests = new Set<string>();

    const loadOrder = async (payload: BroadcastPayload) => {
      const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
      if (!orderIdPattern.test(orderId) || pendingRequests.has(orderId)) return;

      pendingRequests.add(orderId);
      try {
        const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) return;

        const body = await response.json() as { order?: OrderRecord };
        if (!body.order || body.order.id !== orderId) return;

        playOrderNotificationSound();
        setOrders((current) => [
          body.order!,
          ...current.filter((order) => order.id !== orderId),
        ].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 8));
      } catch (error) {
        console.error("Could not load the new order.", error);
      } finally {
        pendingRequests.delete(orderId);
      }
    };

    const channel = supabase
      .channel("admin-orders")
      .on("broadcast", { event: "orders-changed" }, ({ payload }) => {
        void loadOrder(payload as BroadcastPayload);
      })
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") setConnection("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnection("unavailable");
          if (error) console.error("Admin Realtime subscription failed.", error);
        }
      });

    return () => {
      window.removeEventListener("pointerdown", armSound);
      window.removeEventListener("keydown", armSound);
      pendingRequests.clear();
      void supabase.removeChannel(channel);
    };
  }, [publishableKey, supabaseUrl]);

  const connectionLabel = connection === "live"
    ? "Live updates on"
    : connection === "connecting"
      ? "Connecting live updates"
      : "Live updates unavailable";

  return <>
    <span className={`adminLive adminRealtimeState is-${connection}`} role="status">
      <i aria-hidden="true" />{connectionLabel}
    </span>
    <OrderTable orders={orders} csrfToken={csrfToken} returnTo="/admin" />
  </>;
}
