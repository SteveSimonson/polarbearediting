/**
 * Edge Worker for polarbearediting.com
 * - www → apex 301
 * - force HTTPS
 * - sitemap.xml + robots Content-Type
 * - static assets for everything else
 */

const CANONICAL_HOST = "polarbearediting.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only rewrite host when serving on the real domain (not workers.dev)
    if (url.hostname === "www.polarbearediting.com") {
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.protocol === "http:" && url.hostname.endsWith("polarbearediting.com")) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") {
      const assetReq = new Request(new URL(url.pathname, url.origin), request);
      const res = await env.ASSETS.fetch(assetReq);
      if (res.status !== 200) return res;
      const headers = new Headers(res.headers);
      if (url.pathname === "/sitemap.xml") {
        headers.set("Content-Type", "application/xml; charset=UTF-8");
      } else {
        headers.set("Content-Type", "text/plain; charset=UTF-8");
      }
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Cache-Control", "public, max-age=300, must-revalidate");
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
