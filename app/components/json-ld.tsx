import { headers } from "next/headers";

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

export async function JsonLd({ data }: { data: JsonLdValue }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  // The nonce is issued per request in proxy.ts. Without it this inline script is
  // refused by the policy that removed script-src 'unsafe-inline'.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // React deliberately drops `nonce` from the client-side element so it cannot be
      // read back out of the DOM, which makes the attribute differ from the server HTML.
      // The block is inert structured data, so the difference is expected and ignored.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
