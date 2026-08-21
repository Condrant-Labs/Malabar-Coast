import { isSupabaseServerConfigured, supabaseServerRpc } from "../supabase/server";

type EmailMessage = { eventKey: string; category: string; to: { email: string; name?: string }; subject: string; html: string; text: string };
export function isBrevoConfigured() { return Boolean(process.env.BREVO_API_KEY?.trim() && process.env.BREVO_SENDER_EMAIL?.trim() && process.env.BREVO_OWNER_EMAIL?.trim()); }
export function ownerEmail() { return process.env.BREVO_OWNER_EMAIL?.trim() || ""; }

let connectionCache: { checkedAt: number; ready: boolean } | undefined;
export async function checkBrevoConnection() {
  if (!isBrevoConfigured()) return false;
  if (connectionCache && Date.now() - connectionCache.checkedAt < 5 * 60_000) return connectionCache.ready;
  try {
    const response = await fetch("https://api.brevo.com/v3/account", {
      signal: AbortSignal.timeout(5_000),
      headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY!.trim() },
      cache: "no-store",
    });
    connectionCache = { checkedAt: Date.now(), ready: response.ok };
  } catch {
    connectionCache = { checkedAt: Date.now(), ready: false };
  }
  return connectionCache.ready;
}

export async function sendBrevoEmail(message: EmailMessage) {
  const apiKey=process.env.BREVO_API_KEY?.trim(); const senderEmail=process.env.BREVO_SENDER_EMAIL?.trim();
  if(!apiKey||!senderEmail||!message.to.email)return false;
  let claimed=true;
  if(isSupabaseServerConfigured()) claimed=await supabaseServerRpc<boolean>("claim_email_delivery",{p_event_key:message.eventKey,p_category:message.category,p_recipient:message.to.email});
  if(!claimed)return true;
  try{
    const response=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",signal:AbortSignal.timeout(8_000),headers:{"api-key":apiKey,"Content-Type":"application/json","accept":"application/json"},body:JSON.stringify({sender:{email:senderEmail,name:process.env.BREVO_SENDER_NAME?.trim()||"Malabar Coast"},to:[message.to],subject:message.subject,htmlContent:message.html,textContent:message.text})});
    if(!response.ok)throw new Error(`Brevo returned ${response.status}`);
    if(isSupabaseServerConfigured())await supabaseServerRpc("complete_email_delivery",{p_event_key:message.eventKey,p_sent:true,p_error:""});
    return true;
  }catch(error){const detail=error instanceof Error?error.message:"Email delivery failed";if(isSupabaseServerConfigured())await supabaseServerRpc("complete_email_delivery",{p_event_key:message.eventKey,p_sent:false,p_error:detail}).catch(()=>undefined);console.error("Transactional email could not be delivered.",detail);return false;}
}
