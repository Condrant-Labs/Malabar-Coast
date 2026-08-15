import { getSupabaseChannelClient } from "./config/supabase_channel";

export async function publishPaymentCompletionEvent(orderId: string) {
  let supabase: ReturnType<typeof getSupabaseChannelClient>;
  try {
    supabase = getSupabaseChannelClient();
  } catch (error) {
    console.warn("Payment was recorded, but the admin notification client is unavailable.", error instanceof Error ? error.name : "UnknownError");
    return false;
  }

  const channel = supabase.channel("admin-orders");
  try {
    const result = await channel.httpSend("orders-changed", {
      orderId,
      changedAt: new Date().toISOString(),
    });

    if (!result.success) {
      console.warn("Payment was recorded, but the admin notification could not be published.");
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Payment was recorded, but the admin notification failed.", error instanceof Error ? error.name : "UnknownError");
    return false;
  } finally {
    void supabase.removeChannel(channel);
  }
}
