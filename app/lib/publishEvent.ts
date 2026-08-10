import { getSupabaseChannelClient } from "./config/supabase_channel";
import type { OrderRecord } from "./orders";

export async function publishPaymentCompletionEvent(order:OrderRecord){
    const supabase = getSupabaseChannelClient();
    const channel = supabase.channel("payments");
    try{
        const result = await channel.send({
        type:"broadcast",
        event:"payment-completed",
        payload:{
            orderId: order.id,
            createdAt:order.createdAt
        }
    })
    if (result !== "ok") {
      throw new Error(`Could not publish payment-completed event: ${result}`);
    }
    } finally{
        void supabase.removeChannel(channel);
    }
}