# Polar Bear Editing

**Professional book editing and author education** — returning polarbearediting.com to its roots.

Live (preview): deploy via `npm run deploy` → `*.polarbearediting.workers.dev`  
Production domain: [https://polarbearediting.com](https://polarbearediting.com) (currently Empowery redirect until cutover)

## Roots

Polar Bear Editing began as a fiction/memoir editing practice (critiques, proofreading, covers, formatting) with a distinctive warm-and-witty voice and mascot Alexis. The apex domain later redirected to Empowery. This rebuild restores the editing brand as a world-class, SEO-first static site.

## Stack

- Static site in `public/` (no framework, no build step)
- Cloudflare Worker (`workers/site.js`) for HTTPS, www→apex, sitemap Content-Type
- Deploy: `npm run deploy`

## Local

```bash
npm install
npm run preview   # http://localhost:8893
# or
npm run dev       # wrangler dev
```

## SEO model

| Surface | Role |
|--------|------|
| `/` | Brand + trust + primary conversion |
| `/services/*` | High-intent commercial keywords |
| `/guides/*` | Cornerstone informational SEO / AEO |
| `/tools/editing-cost-calculator/` | Interactive lead magnet |
| `/journal/` | Ongoing topical authority |
| `/llms.txt` | Answer-engine orientation |

## Ship protocol

Branch → PR → review → merge → `npm run deploy` (see `AGENTS.md` / pr-ship-gate).
DNS cutover off Empowery is owner-gated.
