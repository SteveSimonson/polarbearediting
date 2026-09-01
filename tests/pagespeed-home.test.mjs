import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const html = readFileSync(join(PUBLIC, "index.html"), "utf8");
const css = readFileSync(join(PUBLIC, "assets/style.css"), "utf8");
const design = readFileSync(join(ROOT, "DESIGN.md"), "utf8");
const contact = readFileSync(join(PUBLIC, "contact/index.html"), "utf8");
const workerSrc = readFileSync(join(ROOT, "workers/site.js"), "utf8");

const { default: worker, cacheControlForPath } = await import(
  pathToFileURL(join(ROOT, "workers/site.js")).href
);

function walkHtml(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkHtml(p, out);
    else if (name.name.endsWith(".html")) out.push(p);
  }
  return out;
}

test("homepage self-hosts latin fonts and does not call Google Fonts", () => {
  assert.equal(html.includes("fonts.googleapis.com"), false);
  assert.equal(html.includes("fonts.gstatic.com"), false);
  assert.ok(css.includes("@font-face"));
  assert.ok(css.includes("font-display: swap"));
  assert.ok(css.includes("/assets/fonts/newsreader-latin-wght-normal.woff2"));
  assert.ok(css.includes("/assets/fonts/source-sans-3-latin-wght-normal.woff2"));
  assert.ok(css.includes("/assets/fonts/ibm-plex-mono-latin-500-normal.woff2"));
  assert.ok(
    html.includes('rel="preload" href="/assets/fonts/newsreader-latin-wght-normal.woff2"'),
  );
  assert.ok(
    html.includes('rel="preload" href="/assets/fonts/source-sans-3-latin-wght-normal.woff2"'),
  );
  assert.ok(design.includes("self-hosted"));
  for (const file of [
    "newsreader-latin-wght-normal.woff2",
    "newsreader-latin-wght-italic.woff2",
    "source-sans-3-latin-wght-normal.woff2",
    "ibm-plex-mono-latin-400-normal.woff2",
    "ibm-plex-mono-latin-500-normal.woff2",
    "ibm-plex-mono-latin-600-normal.woff2",
  ]) {
    assert.ok(existsSync(join(PUBLIC, "assets/fonts", file)), file);
  }
});

test("no HTML file loads Google Fonts", () => {
  for (const file of walkHtml(PUBLIC)) {
    const body = readFileSync(file, "utf8");
    assert.equal(body.includes("fonts.googleapis.com"), false, file);
    assert.equal(body.includes("fonts.gstatic.com"), false, file);
  }
});

test("ATF is never hidden with opacity:0; no lcp-hero-wrap; LCP is not decoding=async", () => {
  assert.equal(/opacity\s*:\s*0(?:\s|;|!|$)/.test(css), false);
  assert.equal(html.includes('decoding="async"'), false);
  assert.equal(html.includes('id="lcp-hero-wrap"'), false);
  assert.ok(css.includes("never hide ATF"));
});

test("no gtag or AdSense in the homepage head", () => {
  const head = html.slice(0, html.indexOf("</head>"));
  assert.equal(head.includes("googletagmanager.com"), false);
  assert.equal(head.includes("gtag/js"), false);
  assert.equal(head.includes("adsbygoogle"), false);
});

test("cacheControlForPath matches the pagespeed playbook", () => {
  assert.equal(
    cacheControlForPath("/assets/fonts/newsreader-latin-wght-normal.woff2"),
    "public, max-age=31536000, immutable",
  );
  assert.equal(
    cacheControlForPath("/assets/index-AbCdEfGh.js"),
    "public, max-age=31536000, immutable",
  );
  assert.equal(
    cacheControlForPath("/assets/style.css"),
    "public, max-age=86400, must-revalidate",
  );
  assert.equal(
    cacheControlForPath("/assets/main.js"),
    "public, max-age=86400, must-revalidate",
  );
  assert.equal(cacheControlForPath("/assets/style.css").includes("immutable"), false);
  assert.equal(
    cacheControlForPath("/assets/favicon.svg"),
    "public, max-age=604800",
  );
  assert.equal(
    cacheControlForPath("/brand/og.jpg"),
    "public, max-age=604800",
  );
  assert.equal(
    cacheControlForPath("/brand/og.webp"),
    "public, max-age=604800",
  );
});

function mockEnv(files) {
  const methods = [];
  return {
    methods,
    env: {
      ASSETS: {
        async fetch(req) {
          methods.push(req.method);
          const path = new URL(req.url).pathname;
          const rec = files[path];
          if (!rec) {
            return new Response("<!doctype html>missing", {
              status: 404,
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }
          return new Response(rec.body, {
            status: rec.status ?? 200,
            headers: rec.headers,
          });
        },
      },
    },
  };
}

test("HEAD never subfetches ASSETS with incoming HEAD", async () => {
  const { methods, env } = mockEnv({
    "/": {
      body: "<!doctype html><title>x</title>",
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  });
  const res = await worker.fetch(
    new Request("https://polarbearediting.com/", { method: "HEAD" }),
    env,
  );
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "");
  assert.deepEqual(methods, ["GET"]);
  assert.equal(res.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.ok(res.headers.get("strict-transport-security"));
});

test("HTML cache is max-age=0; fonts immutable; unhashed CSS not immutable", async () => {
  const { env } = mockEnv({
    "/": {
      body: "<!doctype html>",
      headers: { "content-type": "text/html; charset=utf-8" },
    },
    "/assets/style.css": {
      body: "body{}",
      headers: { "content-type": "text/css" },
    },
    "/assets/fonts/newsreader-latin-wght-normal.woff2": {
      body: "woff",
      headers: { "content-type": "font/woff2" },
    },
  });
  const htmlRes = await worker.fetch(
    new Request("https://polarbearediting.com/"),
    env,
  );
  assert.equal(
    htmlRes.headers.get("cache-control"),
    "public, max-age=0, must-revalidate",
  );
  const cssRes = await worker.fetch(
    new Request("https://polarbearediting.com/assets/style.css"),
    env,
  );
  assert.equal(
    cssRes.headers.get("cache-control"),
    "public, max-age=86400, must-revalidate",
  );
  assert.equal(cssRes.headers.get("cache-control").includes("immutable"), false);
  const fontRes = await worker.fetch(
    new Request(
      "https://polarbearediting.com/assets/fonts/newsreader-latin-wght-normal.woff2",
    ),
    env,
  );
  assert.equal(
    fontRes.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );
});

test("WebP rewrite only when a real image/webp file exists", async () => {
  const { env } = mockEnv({
    "/brand/og.jpg": {
      body: "jpeg-bytes",
      headers: { "content-type": "image/jpeg" },
    },
    "/brand/og.webp": {
      body: "webp-bytes",
      headers: { "content-type": "image/webp" },
    },
    "/brand/only.jpg": {
      body: "jpeg-bytes",
      headers: { "content-type": "image/jpeg" },
    },
    "/brand/only.webp": {
      body: "<!doctype html>404",
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  });

  const rewritten = await worker.fetch(
    new Request("https://polarbearediting.com/brand/og.jpg", {
      headers: { Accept: "image/webp,image/jpeg" },
    }),
    env,
  );
  assert.equal(rewritten.status, 200);
  assert.equal(rewritten.headers.get("content-type"), "image/webp");
  assert.equal(await rewritten.text(), "webp-bytes");

  const missing = await worker.fetch(
    new Request("https://polarbearediting.com/brand/only.jpg", {
      headers: { Accept: "image/webp,image/jpeg" },
    }),
    env,
  );
  assert.equal(missing.status, 200);
  assert.equal(missing.headers.get("content-type"), "image/jpeg");
  assert.equal(await missing.text(), "jpeg-bytes");
});

test("CRM remains Parsimony Automate via /api/leads", async () => {
  assert.ok(contact.includes('id="inquiry-form"'));
  assert.ok(contact.includes('action="/api/leads"'));
  assert.ok(workerSrc.includes("parsimony-automate"));
  assert.ok(workerSrc.includes("leadconnectorhq.com"));
  const { methods, env } = mockEnv({});
  const res = await worker.fetch(
    new Request("https://polarbearediting.com/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@example.com" }),
    }),
    env,
  );
  assert.equal(res.status, 503);
  assert.deepEqual(methods, []);
  const status = await worker.fetch(
    new Request("https://polarbearediting.com/api/crm/status"),
    env,
  );
  assert.equal(status.status, 200);
  const body = await status.json();
  assert.equal(body.configured, false);
});

test("IndexNow key and og:image from #10 remain", () => {
  assert.ok(existsSync(join(PUBLIC, "6cd2751713803f3d302f7a0dc3a828c8.txt")));
  assert.ok(html.includes("https://polarbearediting.com/brand/og.jpg"));
  assert.ok(existsSync(join(PUBLIC, "brand/og.jpg")));
  assert.ok(existsSync(join(PUBLIC, "brand/og.webp")));
});
