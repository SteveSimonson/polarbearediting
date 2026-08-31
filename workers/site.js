/**
 * Edge Worker for polarbearediting.com
 * Canonical host, HSTS, cache, real 404s, IndexNow key, Parsimony Automate leads.
 */

const APEX = "polarbearediting.com";

function withHsts(res) {
  const out = new Response(res.body, res);
  out.headers.set("Strict-Transport-Security", "max-age=31536000");
  out.headers.set("X-Content-Type-Options", "nosniff");
  return out;
}

function json(body, status, extra) {
  return withHsts(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...(extra || {}),
      },
    })
  );
}

function cacheHeaders(res, pathname) {
  const out = new Response(res.body, res);
  if (pathname.startsWith("/assets/")) {
    out.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (pathname.startsWith("/brand/")) {
    out.headers.set("Cache-Control", "public, max-age=604800");
  } else if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    out.headers.set("Cache-Control", "public, max-age=300, must-revalidate");
  } else if (pathname.endsWith(".html") || pathname.endsWith("/") || !pathname.includes(".")) {
    out.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
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
    return withHsts(
      new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "https://polarbearediting.com",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      })
    );
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www." + APEX || (url.hostname === APEX && url.protocol === "http:")) {
      return withHsts(Response.redirect("https://" + APEX + url.pathname + url.search, 301));
    }

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/leads") return handleLeads(request, env);
      if (url.pathname === "/api/crm/status" && request.method === "GET") return handleCrmStatus(env);
      return json({ ok: false, error: "Not found" }, 404);
    }

    if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") {
      const res = await env.ASSETS.fetch(new Request(new URL(url.pathname, url.origin), { method: "GET" }));
      if (res.status !== 200) return withHsts(res);
      const headers = new Headers(res.headers);
      headers.set(
        "Content-Type",
        url.pathname === "/sitemap.xml" ? "application/xml; charset=UTF-8" : "text/plain; charset=UTF-8"
      );
      headers.set("Cache-Control", "public, max-age=300, must-revalidate");
      if (request.method === "HEAD") {
        return withHsts(new Response(null, { status: 200, headers }));
      }
      return withHsts(new Response(res.body, { status: 200, headers }));
    }

    const last = url.pathname.split("/").pop() || "";
    if (request.method === "HEAD") {
      const probe = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
      const headers = cacheHeaders(probe, url.pathname).headers;
      return withHsts(new Response(null, { status: probe.status, headers }));
    }

    const res = await env.ASSETS.fetch(request);
    if (res.status === 404) {
      const out = cacheHeaders(res, url.pathname);
      const ct = out.headers.get("content-type") || "";
      if (/\.[a-z0-9]+$/i.test(last) && ct.includes("text/html")) {
        return withHsts(new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } }));
      }
      if (ct.includes("text/html")) {
        out.headers.set("X-Robots-Tag", "noindex, nofollow");
      }
      return withHsts(out);
    }
    return withHsts(cacheHeaders(res, url.pathname));
  },
};
