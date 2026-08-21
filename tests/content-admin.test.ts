import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("the content admin is a protected published-content command centre", async () => {
  const [page, content, permissions] = await Promise.all([
    readFile(new URL("../app/admin/content/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/admin-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/admin-permissions.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /getAdminSession\("content:write"\)/);
  assert.match(page, /intent\/create\/template=/);
  assert.match(page, /intent\/edit\/id=/);
  assert.match(page, /Pause before deleting/);
  assert.match(content, /cache: "no-store"/);
  assert.match(content, /category->slug\.current/);
  assert.match(permissions, /content:write/);
});

test("content management keeps secrets server-side and writes in Studio", async () => {
  const page = await readFile(new URL("../app/admin/content/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /SANITY_API_TOKEN/);
  assert.doesNotMatch(page, /client\.(create|delete|patch)/);
  assert.match(page, /Open Content Studio/);
});
