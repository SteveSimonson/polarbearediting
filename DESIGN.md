---
version: alpha
name: polarbearediting
description: Polar Bear Editing — arctic desk, manuscript marks.
colors:
  primary: "#121820"
  secondary: "#3a4554"
  tertiary: "#9ec9e8"
  neutral: "#f7f4ee"
  aurora: "#3d8fbf"
  aurora-dim: "rgba(61, 143, 191, 0.14)"
  gold: "#c4a35a"
  gold-dim: "rgba(196, 163, 90, 0.14)"
  ice: "#9ec9e8"
  ice-bright: "#c5e2f5"
  ink: "#121820"
  ink-soft: "#3a4554"
  line: "#243548"
  line-hot: "#3a526b"
  muted: "#8fa3b8"
  night: "#0b1420"
  night-2: "#111c2c"
  ok: "#3d9b78"
  panel: "#152334"
  paper: "#f7f4ee"
  paper-2: "#efe9df"
  pen: "#c45c4a"
  pen-dim: "rgba(196, 92, 74, 0.14)"
typography:
  display:
    fontFamily: Newsreader
    fontWeight: 400
    note: Optical size on; italic for emphasis. Never as body.
  body-md:
    fontFamily: Source Sans 3
    fontSize: 1.0625rem
    fontWeight: 400
  utility:
    fontFamily: IBM Plex Mono
    fontSize: 0.72rem
    fontWeight: 500
  button:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: 700
rounded:
  md: 14px
  sm: 8px
  paper: 2px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
  card:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.paper}"
    mark: "left tick uses pen on hover"
---

## Overview

Polar Bear Editing brand — arctic night, ice light, red-pen marks on a manuscript.

**Domain:** polarbearediting.com
**Primary conversion:** Request a sample edit / Get a quote
**CSS path:** `public/assets/style.css`

**This file is the normative brand contract.** Change tokens here first, then mirror into CSS, then components.

**Subject:** professional book editing for indie, hybrid, and pre-agent authors.
**Atmosphere:** cold light on the page; warmth for the writer.
**Signature:** the red pen. Underlines, carets, margin ticks, `stet`. Not a generic pill rainbow.

## Colors

Do not invent hues. Pen is an instrument, not a theme color to spray.

| Token | Value | Job |
|-------|-------|-----|
| **night** | `#0b1420` | Page ground |
| **night-2** | `#111c2c` | Panels |
| **aurora** | `#3d8fbf` | Climate / glow |
| **ice** | `#9ec9e8` | Links, emphasis wash |
| **ice-bright** | `#c5e2f5` | Hover ice |
| **paper** | `#f7f4ee` | Manuscript surfaces, type on night |
| **paper-2** | `#efe9df` | Paper shade |
| **ink** | `#121820` | Type on paper |
| **pen** | `#c45c4a` | Marks + primary CTA |
| **gold** | `#c4a35a` | Folio / eyebrows only |
| **line** | `#243548` | Rules |

## Typography

Three roles. Do not add a fourth family.

- **Display:** Newsreader — large, optical size, weight 400. Italic for the one marked phrase. Size jumps of ~3× body, not 1.5×.
- **Body / UI:** Source Sans 3 — 400 body, 700 on buttons.
- **Utility:** IBM Plex Mono — eyebrows, folios, word counts, `stet`.

Never Inter, Roboto, system-ui as the designed stack. Never Space Grotesk.

## Signature

The page should read as a marked manuscript sitting in polar night.

- `.mark` / hero `em`: ice italic with a pen underline
- Cards: hairline left tick that goes pen on hover
- Quotes: paper stock, sharp binding edge, a `stet` folio
- Process steps: folio numbers (this *is* a sequence)
- Background: aurora + frost grain — not a flat `#0b1420`

Spend boldness here. Keep chrome quiet.

## Layout

- Follow existing container max-widths and section padding.
- Sticky headers must leave scroll-margin for in-page anchors.
- Prefer one primary CTA per view.

## Elevation & Depth

- Soft night shadow only (`--shadow`). No Material cards.
- Honor `prefers-reduced-motion`. One orchestrated hero rise, not scatter.

## Shapes

- **md:** 14px (night chrome)
- **sm:** 8px
- **paper:** 2px on the binding edge of manuscript surfaces

## Components

| Role | Look for |
|------|----------|
| Primary button | `.btn-primary` (pen fill) |
| Secondary button | `.btn-secondary` (ghost rule) |
| Card | `.card` |
| Field | `.field` |
| Nav | `.site-header` / `.nav-cta` |
| Mark | `.mark`, `h1 em` |

Reuse these; do not invent a parallel component set.

## Do's and Don'ts

**Do**

- Read this file before UI work on **polarbearediting**.
- Use pen as markup and the one primary CTA.
- Update this file in the same PR when brand tokens change.

**Don't**

- Don't invent off-palette colors.
- Don't set display type in Source Sans 3.
- Don't turn the whole site cream or broadsheet.
- Ship one-off hex in components when a token exists.
