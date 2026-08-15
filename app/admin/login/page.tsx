import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, isAdminConfigured } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  credentials: "The sign-in details were not accepted.",
  "rate-limit": "Too many sign-in attempts. Wait 15 minutes before trying again.",
  configuration: "Administrator access is not configured for this deployment.",
  service: "Supabase authentication is temporarily unavailable. Please try again.",
  request: "The sign-in request could not be verified.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <main className="adminShell adminLoginShell">
      <section className="adminLoginCard" aria-labelledby="admin-login-title">
        <p>Malabar Coast · Private operations</p>
        <h1 id="admin-login-title">Restaurant<br />control room.</h1>
        <span>Identity is verified by Supabase Auth. Access is role-controlled, rechecked on every request and limited to eight hours.</span>
        {error && errorMessages[error] && <div className="adminAlert isError" role="alert">{errorMessages[error]}</div>}
        {configured ? (
          <form action="/api/admin/login" method="post">
            <label>Administrator email<input name="email" type="email" autoComplete="username" inputMode="email" maxLength={254} required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} maxLength={256} required /></label>
            <button type="submit">Enter secure operations <span aria-hidden="true">→</span></button>
          </form>
        ) : (
          <div className="adminSetupNotice">
            <strong>Setup required</strong>
            <p>Add the Supabase URL, publishable and server keys, apply the current database schema, activate an administrator profile, and configure a 32-character session secret.</p>
          </div>
        )}
        <Link href="/">Return to the restaurant <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
