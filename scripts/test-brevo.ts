import { sendBrevoEmail } from "../app/lib/email/brevo";

process.loadEnvFile(".env.local");

const apiKey = process.env.BREVO_API_KEY?.trim();
const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase();
const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Malabar Coast";
const ownerEmail = process.env.BREVO_OWNER_EMAIL?.trim().toLowerCase();

if (!apiKey || !senderEmail || !ownerEmail) throw new Error("Brevo environment values are incomplete.");

async function brevoGet(pathname: string) {
  const response = await fetch(`https://api.brevo.com/v3/${pathname}`, {
    signal: AbortSignal.timeout(10_000),
    headers: { accept: "application/json", "api-key": apiKey! },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { code?: string; message?: string };
    const detail = [error.code, error.message].filter(Boolean).join(": ");
    throw new Error(`Brevo verification failed (${response.status}${detail ? `, ${detail}` : ""}).`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

async function main() {
  const [account, senderResponse] = await Promise.all([brevoGet("account"), brevoGet("senders")]);
  const senders = Array.isArray(senderResponse.senders) ? senderResponse.senders as Array<Record<string, unknown>> : [];
  const sender = senders.find((candidate) => String(candidate.email || "").toLowerCase() === senderEmail);

  if (!sender) throw new Error("The configured sender address is not registered in Brevo.");
  if (sender.active === false) throw new Error("The configured Brevo sender is not active.");

  const sent = await sendBrevoEmail({
    eventKey: `system:brevo:configuration-test:${Date.now()}`,
    category: "configuration_test",
    to: { email: ownerEmail!, name: "Malabar Coast team" },
    subject: "Malabar Coast email system · Test successful",
    html: `<html><body style="font-family:Arial,sans-serif;color:#10201c"><h1>Brevo is connected.</h1><p>This controlled test confirms that the Malabar Coast transactional email system can send from <strong>${senderName}</strong>.</p><p>Order, table reservation and hall enquiry messages will use this same verified route.</p></body></html>`,
    text: "Brevo is connected. This controlled test confirms that the Malabar Coast transactional email system can send order, table reservation and hall enquiry messages.",
  });

  if (!sent) throw new Error("Brevo accepted the account but the transactional test was not sent.");

  console.log(JSON.stringify({ apiAuthenticated: Boolean(account.email || account.companyName || account.plan), senderRegistered: true, senderActive: sender.active !== false, testAccepted: true }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Brevo test failed.");
  process.exitCode = 1;
});
