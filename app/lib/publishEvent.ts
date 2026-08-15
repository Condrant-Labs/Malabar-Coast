import { getSupabaseChannelClient } from "./config/supabase_channel";

export async function publishPaymentCompletionEvent(orderId: string) {
  const supabase = getSupabaseChannelClient();
  const channel = supabase.channel("admin-orders");
  try {
    const result = await channel.httpSend("orders-changed", {
      orderId,
      changedAt: new Date().toISOString(),
    });

    if (!result.success) {
      throw new Error(`Could not publish payment-completed event: ${result.error}`);
    }
  } finally {
    void supabase.removeChannel(channel);
  }
}
