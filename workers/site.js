/**
 * Edge Worker for polarbearediting.com
 * Canonical host, HSTS, cache, real 404s, IndexNow key, Parsimony Automate leads.
 *
 * Cache: hashed /assets + fonts immutable 1y; unhashed JS/CSS 1d must-revalidate;
 * brand ~7d; HTML max-age=0. HEAD never subfetches ASSETS with incoming HEAD.
 * WebP rewrite only when a real image/webp file exists.
 */

const APEX = "polarbearediting.com";
const HSTS = "max-age=31536000";
const HTML_CACHE = "public, max-age=0, must-revalidate";
const FONT_CACHE = "public, max-age=31536000, immutable";
const HASHED_CACHE = "public, max-age=31536000, immutable";
const UNHASHED_SCRIPT_CACHE = "public, max-age=86400, must-revalidate";
const BRAND_CACHE = "public, max-age=604800";
const SITEMAP_CACHE = "public, max-age=300, must-revalidate";

const HASHED_ASSET = /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/;

export function cacheControlForPath(path) {
  const lower = path.toLowerCase();
  if (lower.startsWith("/assets/fonts/") || lower.endsWith(".woff2")) {
    return FONT_CACHE;
  }
  if (path.startsWith("/assets/")) {
    if (HASHED_ASSET.test(path)) return HASHED_CACHE;
    if (/\.(js|css)$/.test(lower)) return UNHASHED_SCRIPT_CACHE;
    return BRAND_CACHE;
  }
  if (path.startsWith("/brand/") || /\.(svg|png|jpe?g|webp|gif|ico)$/.test(lower)) {
    return BRAND_CACHE;
  }
  return null;
}

function withHsts(res) {
  const out = new Response(res.body, res);
  out.headers.set("Strict-Transport-Security", HSTS);
  out.headers.set("X-Content-Type-Options", "nosniff");
  return out;
}

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(extra || {}),
    },
  });
}

/**
 * Proxy ASSETS with an explicit GET. Passing the incoming HEAD method
 * yields an empty body and can 500 a cold isolate.
 */
async function fetchAssets(env, assetUrl, incoming) {
  const headers = new Headers(incoming.headers);
  headers.delete("host");
  const res = await env.ASSETS.fetch(
    new Request(assetUrl, { method: "GET", headers, redirect: "manual" })
  );
  if (incoming.method === "HEAD") {
    return new Response(null, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }
  return new Response(res.body, res);
}

function withCache(res, cacheControl) {
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", cacheControl);
  return out;
}

async function maybeWebpRewrite(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (!/\.(jpe?g|png)$/i.test(url.pathname)) return null;
  const accept = request.headers.get("Accept") || "";
  if (!accept.includes("image/webp")) return null;

  const webpPath = url.pathname.replace(/\.(jpe?g|png)$/i, ".webp");
  const webpUrl = new URL(webpPath + url.search, url.origin);
  const probe = await env.ASSETS.fetch(new Request(webpUrl, { method: "GET" }));
  if (probe.status !== 200) return null;
  const ct = (probe.headers.get("Content-Type") || "").toLowerCase();
  if (!ct.includes("image/webp")) return null;

  const cache = cacheControlForPath(webpPath) || BRAND_CACHE;
  if (request.method === "HEAD") {
    const headers = new Headers(probe.headers);
    headers.set("Cache-Control", cache);
    headers.set("Content-Type", "image/webp");
    return new Response(null, { status: 200, headers });
  }
  const out = new Response(probe.body, probe);
  out.headers.set("Cache-Control", cache);
  out.headers.set("Content-Type", "image/webp");
  return out;
}

function sanitize(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handleLeads(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "https://polarbearediting.com",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }
  if (!env.GHL_PIT || !env.GHL_LOCATION_ID) {
    return json({ ok: false, error: "CRM not configured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  if (sanitize(body.website, 120) || sanitize(body.company, 120) || sanitize(body.fax, 40)) {
    return json({ ok: true, stored: false, skipped: true });
  }

  const name = sanitize(body.name || body.firstName, 80);
  const email = sanitize(body.email, 254).toLowerCase();
  const genre = sanitize(body.genre, 120);
  const wordCount = sanitize(String(body.wordCount || body.words || ""), 32);
  const service = sanitize(body.service, 80);
  const stage = sanitize(body.stage, 80);
  const deadline = sanitize(body.deadline, 80);
  const message = sanitize(body.message, 4000);

  if (!name) return json({ ok: false, error: "Name is required." }, 400);
  if (!isEmail(email)) return json({ ok: false, error: "Enter a valid email address." }, 400);

  const parts = name.split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  try {
    const response = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.GHL_PIT,
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        locationId: env.GHL_LOCATION_ID,
        firstName,
        lastName: lastName || undefined,
        email,
        source: "Polar Bear Editing Website",
        tags: ["website-lead", "polarbearediting", "editing-inquiry"],
        customFields: [],
      }),
    });
    if (!response.ok) throw new Error("upsert " + response.status);
    const result = await response.json();
    const contactId = result.contact?.id || result.id || result.data?.id;
    if (!contactId) throw new Error("missing contact id");

    const note = [
      "Polar Bear Editing inquiry",
      genre && "Genre: " + genre,
      wordCount && "Word count: " + wordCount,
      service && "Service: " + service,
      stage && "Stage: " + stage,
      deadline && "Deadline: " + deadline,
      message && "Message: " + message,
    ]
      .filter(Boolean)
      .join("\n");

    await fetch("https://services.leadconnectorhq.com/contacts/" + contactId + "/notes", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.GHL_PIT,
        Version: "2021-07-28",
      },
      body: JSON.stringify({ body: note }),
    });

    return json({ ok: true, contactId }, 200);
  } catch (err) {
    console.error("leads", err && err.message ? err.message : "upsert failed");
    return json({ ok: false, error: "Could not save inquiry." }, 502);
  }
}

async function handleCrmStatus(env) {
  if (!env.GHL_PIT || !env.GHL_LOCATION_ID) {
    return json({ ok: false, configured: false }, 200);
  }
  try {
    const response = await fetch(
      "https://services.leadconnectorhq.com/locations/" + env.GHL_LOCATION_ID,
      {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + env.GHL_PIT,
          Version: "2021-07-28",
        },
      }
    );
    return json({ ok: response.ok, configured: true, provider: "parsimony-automate" }, response.ok ? 200 : 502);
  } catch {
    return json({ ok: false, configured: true, provider: "parsimony-automate" }, 502);
  }
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.hostname === "www." + APEX || (url.hostname === APEX && url.protocol === "http:")) {
    return Response.redirect("https://" + APEX + url.pathname + url.search, 301);
  }

  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/leads") return handleLeads(request, env);
    if (url.pathname === "/api/crm/status" && request.method === "GET") return handleCrmStatus(env);
    return json({ ok: false, error: "Not found" }, 404);
  }

  const webp = await maybeWebpRewrite(request, env, url);
  if (webp) return webp;

  if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") {
    const res = await fetchAssets(env, new URL(url.pathname, url.origin), request);
    if (res.status !== 200) return res;
    const headers = new Headers(res.headers);
    headers.set(
      "Content-Type",
      url.pathname === "/sitemap.xml" ? "application/xml; charset=UTF-8" : "text/plain; charset=UTF-8"
    );
    headers.set("Cache-Control", SITEMAP_CACHE);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  const last = url.pathname.split("/").pop() || "";
  const res = await fetchAssets(env, url, request);
  if (res.status === 404) {
    const out = new Response(res.body, res);
    const ct = out.headers.get("content-type") || "";
    if (/\.[a-z0-9]+$/i.test(last) && ct.includes("text/html")) {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
    }
    if (ct.includes("text/html")) {
      out.headers.set("X-Robots-Tag", "noindex, nofollow");
      out.headers.set("Cache-Control", HTML_CACHE);
    } else {
      const cc = cacheControlForPath(url.pathname);
      if (cc) out.headers.set("Cache-Control", cc);
    }
    return out;
  }

  const ct = (res.headers.get("Content-Type") || "").toLowerCase();
  if (ct.includes("text/html")) return withCache(res, HTML_CACHE);
  const cc = cacheControlForPath(url.pathname);
  return cc ? withCache(res, cc) : res;
}

export default {
  async fetch(request, env) {
    const res = await handleRequest(request, env);
    return withHsts(res);
  },
};
