"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { armOrderNotificationSound, playOrderNotificationSound } from "./order-notification-sound";

type ConnectionState = "connecting" | "live" | "unavailable";
type BroadcastPayload = { orderId?: unknown };

const orderIdPattern = /^ord_[A-Za-z0-9_-]{20,60}$/;

export function RealtimePageRefresh({
  supabaseUrl,
  publishableKey,
}: {
  supabaseUrl: string;
  publishableKey: string;
}) {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const scheduleRefresh = async (payload: BroadcastPayload) => {
      const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
      if (!orderIdPattern.test(orderId) || pendingRequests.has(orderId)) return;

      // Broadcast channels use the public Supabase client in the browser. Treat the
      // payload only as a hint and authenticate the order through our admin endpoint
      // before making noise or refreshing the page.
      pendingRequests.add(orderId);
      try {
        const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = await response.json() as { order?: { id?: string } };
        if (body.order?.id !== orderId) return;

        playOrderNotificationSound();
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
          router.refresh();
          refreshTimer.current = null;
        }, 250);
      } catch (error) {
        console.error("Could not verify the changed order.", error);
      } finally {
        pendingRequests.delete(orderId);
      }
    };

    const channel = supabase
      .channel("admin-orders")
      .on("broadcast", { event: "orders-changed" }, ({ payload }) => {
        void scheduleRefresh(payload as BroadcastPayload);
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
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      pendingRequests.clear();
      void supabase.removeChannel(channel);
    };
  }, [publishableKey, router, supabaseUrl]);

  const connectionLabel = connection === "live"
    ? "Live updates on"
    : connection === "connecting"
      ? "Connecting live updates"
      : "Live updates unavailable";

  return <span className={`adminLive is-${connection}`} role="status">
    <i aria-hidden="true" />{connectionLabel}
  </span>;
}
