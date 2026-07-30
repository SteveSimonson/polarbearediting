# AGENTS — polarbearediting.com

## Purpose

**Polar Bear Editing** is a professional book-editing brand and author-education authority.
The site's job: convert high-intent search traffic (editing services, costs, process) into
inquiries, and own the "how authors get manuscripts ready" content map for SEO/AEO.

## Roots (do not lose this)

- Original brand (Jeannette Spohn era): fiction & memoir editing, critiques, proofreading,
  book covers, Kindle/print formatting; mascot **Alexis**; voice = friendly, thorough, witty.
- Domain is on Cloudflare with Worker routes for apex + www (restored editing identity).
- Legacy content: `pbeditingblog.wordpress.com` (~20 posts) + Medium `@JeannetteSpohn`.

## Positioning

- Domain: **book editing + self-publishing craft** for indie, hybrid, and pre-agent authors.
- Voice: warm authority — editorial rigor with a human pulse. Not corporate. Not cute-only.
- Metaphor: arctic clarity. Cold light on the page. Warmth for the writer.
- Never promise traditional publishing deals, bestseller placement, or guaranteed sales.
- Service CTAs are real leads (`mailto:` / contact form path). Do not invent team bios.

## Hard rules

1. **Network properties** (Parsimony, Catalyst88, HumanityNow, Adamantine, etc.): dofollow when linked.
2. **Third-party / competitor** (Reedsy, Scribendi, etc.): `rel="noopener noreferrer nofollow"` + `target="_blank"`.
3. **No framework, no build step** for the site shell — plain HTML/CSS/JS under `public/`.
4. Brand tokens (CSS custom properties in `public/assets/style.css`):
   - Night `#0B1420`
   - Ice `#9EC9E8`
   - Paper `#F7F4EE`
   - Ink `#121820`
   - Aurora `#3D8FBF`
   - Pen red `#C45C4A` (editor marks / CTAs)
   - Gold `#C4A35A`
5. Legal entity line: **Polar Bear Editing** · contact `hello@polarbearediting.com` until LLC confirmed.
6. Update `sitemap.xml` and `llms.txt` when adding URLs.

## Structure

```
public/                 ← deploy root
  index.html
  services/…            ← high-intent money pages
  guides/…              ← SEO cornerstone content
  journal/…             ← editorial blog
  tools/…               ← calculators / interactive
  about/, contact/
  assets/               ← CSS, JS, favicon, images
workers/site.js
wrangler.jsonc
```

## Change protocol

1. Branch from `main` (`feature/…`, `content/…`).
2. Edit static files under `public/`.
3. Update `sitemap.xml` / `llms.txt` when adding URLs.
4. PR → independent review → merge → `npm run deploy`.
5. **Deploy** after merge when `public/` or `wrangler.jsonc` changes: `npm run deploy`, then verify production.
