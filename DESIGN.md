---
version: alpha
name: polarbearediting
description: Polar Bear Editing brand — match live style tokens.
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
  h1:
    fontFamily: Source Sans 3
    fontSize: 2.5rem
    fontWeight: 600
  body-md:
    fontFamily: Source Sans 3
    fontSize: 1rem
    fontWeight: 400
  button:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: 600
rounded:
  md: 14px
  sm: 8px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
---

## Overview

Polar Bear Editing brand — match live style tokens.

**Domain:** polarbearediting.com
**Primary conversion:** Primary CTA
**CSS path:** `public/assets/style.css`

**This file is the normative brand contract.** Change tokens here first, then mirror into CSS, then components.

## Colors

Extracted from live CSS. Prefer these names in new work:

| Token | Value |
|-------|-------|
| **primary** | `#121820` |
| **secondary** | `#3a4554` |
| **tertiary** | `#9ec9e8` |
| **neutral** | `#f7f4ee` |
| **aurora** | `#3d8fbf` |
| **aurora-dim** | `rgba(61, 143, 191, 0.14)` |
| **gold** | `#c4a35a` |
| **gold-dim** | `rgba(196, 163, 90, 0.14)` |
| **ice** | `#9ec9e8` |
| **ice-bright** | `#c5e2f5` |
| **ink** | `#121820` |
| **ink-soft** | `#3a4554` |
| **line** | `#243548` |
| **line-hot** | `#3a526b` |
| **muted** | `#8fa3b8` |
| **night** | `#0b1420` |
| **night-2** | `#111c2c` |
| **ok** | `#3d9b78` |
| **panel** | `#152334` |
| **paper** | `#f7f4ee` |
| **paper-2** | `#efe9df` |
| **pen** | `#c45c4a` |
| **pen-dim** | `rgba(196, 92, 74, 0.14)` |

- Use **tertiary** (or the brand accent listed above) for interaction — not arbitrary new hues.
- Keep product image wells pure white when this is an Amazon-affiliate surface.

## Typography

- **Display:** Source Sans 3
- **Body/UI:** Source Sans 3
- Do not add a third family without updating this file.

## Layout

- Follow existing container max-widths and section padding in the live CSS.
- Sticky headers must leave scroll-margin for in-page anchors.
- Prefer one primary CTA per view.

## Elevation & Depth

- Match existing shadow/glow language in the stylesheet; do not add Material-style heavy elevation unless already present.
- Respect `prefers-reduced-motion` for hover transforms.

## Shapes

Radii from CSS:
- **md:** 14px
- **sm:** 8px

## Components

Map to existing classes in the primary stylesheet (names vary by site):

| Role | Look for |
|------|----------|
| Primary button | `.btn-primary`, `.btn.primary`, brand CTA class |
| Secondary button | `.btn-secondary`, `.btn-ghost`, outline CTA |
| Card | `.card`, `.card-soft`, product card |
| Field | `.field`, form inputs |
| Nav | header/nav link styles |

Reuse these; do not invent a parallel component set.

## Do's and Don'ts

**Do**

- Read this file before UI work on **polarbearediting**.
- Keep brand accent usage consistent with live pages.
- Update this file in the same PR when brand tokens change.

**Don't**

- Don't invent off-palette colors.
- Ship one-off hex in components when a token exists.
- Copy another brand’s palette into this site without an intentional redesign + DESIGN.md rewrite.
