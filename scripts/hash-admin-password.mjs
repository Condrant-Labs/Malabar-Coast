import { randomBytes, scryptSync } from "node:crypto";

// Keep these in step with CURRENT_SCRYPT_COST in app/lib/admin-auth.ts.
const cost = { N: 32768, r: 8, p: 1 };

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/hash-admin-password.mjs \"a password of at least 12 characters\"");
  process.exitCode = 1;
} else {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64, { ...cost, maxmem: 256 * cost.N * cost.r }).toString("base64url");
  // Colon separated on purpose: Next.js reads .env files through dotenv-expand, which
  // would treat the segments of a dollar separated hash as variable references and
  // silently blank them out.
  console.log(`scrypt:N=${cost.N},r=${cost.r},p=${cost.p}:${salt}:${hash}`);
}
