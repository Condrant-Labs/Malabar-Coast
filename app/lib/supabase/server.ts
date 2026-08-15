function configuredSupabaseUrl() {
  const value = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getSupabaseServerKey() {
  return (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim() || null;
}

export function getSupabasePublishableKey() {
  return (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim() || null;
}

export function getSupabaseUrl() {
  return configuredSupabaseUrl();
}

export function isSupabaseServerConfigured() {
  return Boolean(configuredSupabaseUrl() && getSupabaseServerKey());
}

export function isSupabaseAuthConfigured() {
  return Boolean(configuredSupabaseUrl() && getSupabaseServerKey() && getSupabasePublishableKey());
}

export async function supabaseServerRequest(pathname: string, init: RequestInit = {}) {
  const url = configuredSupabaseUrl();
  const key = getSupabaseServerKey();
  if (!url || !key) throw new Error("Supabase server access is not configured.");

  const response = await fetch(`${url}/rest/v1/${pathname.replace(/^\/+/, "")}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10_000),
    headers: {
      apikey: key,
      // Current sb_secret keys are API keys, not JWTs. Legacy service-role JWTs
      // still need to be supplied as the PostgREST bearer credential.
      ...(!key.startsWith("sb_secret_") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Supabase server request failed (${response.status}).`);
  return response;
}

export async function supabaseServerRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await supabaseServerRequest(`rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  // PostgreSQL functions returning void are exposed by PostgREST as a successful
  // response with no body. Treat that as a valid result instead of turning a
  // completed login/logout audit write into an authentication service failure.
  const payload = await response.text();
  return (payload ? JSON.parse(payload) : undefined) as T;
}

export async function supabasePasswordSignIn(email: string, password: string) {
  const url = configuredSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();
  if (!url || !publishableKey) throw new Error("Supabase Auth is not configured.");

  return fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
}
