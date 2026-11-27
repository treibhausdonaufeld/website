# Design reference — Treibhaus Donaufeld

Agent-facing overview of the colors, type and logo used on this website.
Use this file when creating or editing UI so new work stays inside the existing design system.

- **Source of truth for colors:** [`src/styles/tokens.css`](src/styles/tokens.css)
- **Brand board (artboard):** [`design/canvas/Marke.dc.html`](design/canvas/Marke.dc.html)
- **Rendered brand board:** [`design/screenshots/logo-und-farben.png`](design/screenshots/logo-und-farben.png)
- **Colors and logo in the design docs (German):** [`design/README.md`](design/README.md)

**Never hard-code hex values in new components.** Always use the CSS variables from `tokens.css`
(`var(--bg)`, `var(--primary)`, `var(--on-primary)`, …). Hard-coded colors already exist only in
places that cannot use CSS variables (inline HTML e-mails, the inline theme bootstrap in
`Base.astro`, favicon).

---

## TL;DR

| | |
| --- | --- |
| Font | **Kumbh Sans** (variable, OFL) — everything, headings 800, body 400 at ≥ 16 px |
| Primary / brand | Green `#5D7A10` (logo, links, icons) |
| Secondary / CTA | Elderberry `#4A2C7A` (buttons with white text; in dark mode lavender `#B7A2DC` with dark text) |
| Page background | Paper `#FAF8F3`, surfaces white, sections sand `#F0ECE2` |
| Dark mode | Background `#151410`, light green `#B9D27A`, light lavender buttons `#B7A2DC` with dark text |
| Logo, light mode | [`design/logo/logo-gruen.png`](design/logo/logo-gruen.png) |
| Logo, dark mode | [`design/logo/logo-hell-dunkelmodus.png`](design/logo/logo-hell-dunkelmodus.png) |
| Logo component | [`src/components/Logo.astro`](src/components/Logo.astro) |

Rough color proportions of a page (from the brand board): **60 %** paper/white,
**25 %** ink, **10 %** green, **5 %** elderberry. Large elderberry areas are an accent, not a base.

---

## Logo

| File | Purpose |
| --- | --- |
| [`design/logo/logo-gruen.png`](design/logo/logo-gruen.png) | Master, primary green `#5D7A10`, for light backgrounds |
| [`design/logo/logo-hell-dunkelmodus.png`](design/logo/logo-hell-dunkelmodus.png) | Master, light green `#B9D27A`, for dark mode |
| [`design/logo/logo-original.png`](design/logo/logo-original.png) | Original color version (archive/reference only) |
| [`design/logo/bildmarke.svg`](design/logo/bildmarke.svg) | Mark only (stem + leaves) as vector; base for favicons |
| [`src/assets/logo/logo-gruen.png`](src/assets/logo/logo-gruen.png) | Bundled copy used by the site (imported via Vite, hashed URL) |
| [`src/assets/logo/logo-hell-dunkelmodus.png`](src/assets/logo/logo-hell-dunkelmodus.png) | Bundled dark-mode copy |
| [`public/favicon.svg`](public/favicon.svg) | Favicon mark; switches to `#B9D27A` in dark mode |
| [`src/components/Logo.astro`](src/components/Logo.astro) | Renders both variants, CSS decides which one is visible |

**Rules**

- Use the green logo on light backgrounds and the light-green logo on dark backgrounds; never recolor it.
- Minimum height **40 px** on screen so “donaufeld” stays legible. Header uses 44 px on mobile, footer 40 px.
- Clear space around the logo: at least the height of the “t” in “treibhaus”.
- Link the logo to `/` (German) or `/en/` (English) — `Logo.astro` already does this.
- For new pages, render `<Logo />` instead of re-importing the PNGs.
- Favicon/PNG variants must stay transparent (iOS exception: `apple-touch-icon.png` is the light mark on primary green because iOS cannot handle transparency).

---

## Typography

**Kumbh Sans for everything.** Free (SIL OFL 1.1), self-hosted, no external font CDN — a
requirement from the briefing (privacy / no third-party requests).

| | |
| --- | --- |
| Package | [`@fontsource-variable/kumbh-sans`](https://www.npmjs.com/package/@fontsource-variable/kumbh-sans) (v27, weights 100–900, normal style) |
| Import | In [`src/layouts/Base.astro`](src/layouts/Base.astro): `import '@fontsource-variable/kumbh-sans'` + preload of `kumbh-sans-latin-wght-normal.woff2` |
| CSS stack | `font-family: 'Kumbh Sans Variable', 'Kumbh Sans', system-ui, sans-serif` (set on `body` in [`src/styles/global.css`](src/styles/global.css)) |
| Subset | Latin (preloaded). The package registers `latin`, `latin-ext`, `math` and `symbols` via `unicode-range`; only the latin file is preloaded |
| Headings | ExtraBold **800**, tight line-height (1.0–1.15), slight negative letter-spacing on display sizes |
| Emphasis / UI labels | SemiBold **600** or Bold **700** |
| Body | Regular **400**, minimum **16 px**; site default is 17 px / 1.6 |
| Monospace (codes only) | `ui-monospace, Menlo, monospace` for OTP/booking codes — do not use for prose |

Typography scale in use (from the design): display 72 px, hero 56 px, section 32–36 px,
card title 24–26 px, body 17–18 px, meta 15 px.
Do not introduce another font family, and do not load fonts from Google Fonts.

---

## Colors

All values are CSS custom properties. Both themes are defined in **three** places in
`tokens.css` — `:root`, `:root[data-theme='dark']`, and the
`@media (prefers-color-scheme: dark)` block. **When adding a token, add it to all three.**

### Core palette by role

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#FAF8F3` | `#151410` | Page background (paper) |
| `--surface` | `#FFFFFF` | `#1F1D19` | Cards, forms, white surfaces |
| `--surface-2` | `#ECE6F4` | `#2A2238` | Elderflower tinted surface |
| `--tint` | `#F0ECE2` | `#26231E` | Section background (sand) |
| `--line` | `#E2DDD1` | `#36322B` | Borders, dividers |
| `--line-soft` | `#EDE9E0` | `#2C2924` | Subtle dividers |
| `--line-strong` | `#C9C0AE` | `#504A40` | Strong borders, table rules |
| `--field` | `#7A7262` | `#9A9282` | Input borders / placeholder-ish text |
| `--ink` | `#1E1C19` | `#F1EEE6` | Main text (ink) |
| `--muted` | `#5F5A50` | `#BDB6A8` | Secondary text (stone) |
| `--primary-text` | `#2F4410` | `#DDE7C0` | Green-tinted headings on background |
| `--link` | `#5D7A10` | `#B9D27A` | Links |
| `--primary` | `#4A2C7A` | `#B7A2DC` | Buttons / brand accent (elderberry) |
| `--primary-hover` | `#3A2262` | `#CDBFE6` | Button hover |
| `--on-primary` | `#FFFFFF` | `#1A1320` | Text on primary |
| `--brand` | `#4A2C7A` | `#B7A2DC` | Brand accent (same as primary) |
| `--on-brand` | `#FFFFFF` | `#1A1320` | Text on brand |
| `--icon` | `#5D7A10` | `#A9C46A` | Icons |
| `--leaf` | `#5D7A10` | `#A9C46A` | Decorative leaf/green accents |

### Bands, footer, status

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--band` | `#5D7A10` | `#1E2A0E` | “Sag hallo” callout band (primary green) |
| `--band-2` | `#4A620C` | `#18220A` | Second band shade |
| `--on-band` | `#FFFFFF` | `#F1EEE6` | Text on band |
| `--on-band-2` | `#F3F6EC` | `#C9D0B6` | Secondary text on band |
| `--band-accent` | `#ECE6F4` | `#ECE6F4` | Button/panel inside band (elderflower) |
| `--on-accent` | `#2A1946` | `#2A1946` | Text on band accent |
| `--footer` | `#1E1C19` | `#0E0D0B` | Footer background |
| `--on-footer` | `#CFC9BC` | `#BDB6A8` | Footer text |
| `--on-footer-strong` | `#FFFFFF` | `#F1EEE6` | Footer headings/strong text |
| `--footer-link` | `#ECE6F4` | `#CDBFE6` | Footer links |
| `--hint` | `#ECE6F4` | `#2A2238` | Hint/notice background |
| `--todo-bg` | `#FFF0B3` | `#4A3C0A` | TODO highlight (design placeholders only) |
| `--todo-ink` | `#5E4300` | `#FFE38A` | TODO text |
| `--err` | `#A3261B` | `#F07A6A` | Error border/icon |
| `--on-err` | `#FFFFFF` | `#15140F` | Text on error color |
| `--err-text` | `#8A2E1F` | `#FF9E90` | Error text |
| `--err-bg` | `#FCEDEA` | `#3A1A15` | Error background |
| `--ok-bg` | `#E8EFD6` | `#26301A` | Success background |

### Placeholders and booking-status colors

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--ph1` | `#ECE7DC` | `#23211C` | Photo placeholder base |
| `--ph2` | `#F4F1EA` | `#2A2721` | Photo placeholder stripe |
| `--ph-line` | `#B0A795` | `#5A5446` | Placeholder outline |
| `--ph-ink` | `#4A4539` | `#BDB6A8` | Placeholder label |
| `--st-free` | `#FFFFFF` | `#1F1D19` | Slot free |
| `--st-req` | `#FFF0B3` | `#4A3C0A` | Slot requested / pending |
| `--st-busy` | `#4A2C7A` | `#B7A2DC` | Slot booked |
| `--st-block` | `repeating-linear-gradient(135deg, #C9C0AE 0 4px, #EDE9E0 4px 8px)` | same with `#504A40` / `#2C2924` | Blocked slot (hatched) |

Signal colors stay separate: errors are red `#A3261B`, TODO yellow `#FFF0B3` is for design
placeholders only, never for production UI.

---

## Combinations that work

Contrast ratios below are WCAG 2.1 and were calculated from the tokens above.
Normal text needs ≥ 4.5 : 1, large/bold text ≥ 3 : 1, UI borders ≥ 3 : 1.

### Light mode

| Combination | Ratio | Use for |
| --- | --- | --- |
| `--ink` `#1E1C19` on `--bg` `#FAF8F3` | 16.0 : 1 | Body text — default |
| `--ink` on `--surface` `#FFFFFF` | 17.0 : 1 | Text in cards/forms |
| `--muted` `#5F5A50` on `--bg` | 6.5 : 1 | Meta text, captions |
| `--on-primary` white on `--primary` `#4A2C7A` | 10.9 : 1 | **Primary button**: “Raum buchen” |
| `--on-accent` `#2A1946` on `--band-accent` `#ECE6F4` | 13.0 : 1 | Light button/panel inside the dark band |
| `--on-band` white on `--band` `#5D7A10` | 4.9 : 1 | “Sag hallo” band text |
| `--on-band-2` `#F3F6EC` on `--band` | 4.5 : 1 | Secondary text in the band |
| `--link` `#5D7A10` on `--surface` white | 4.9 : 1 | Links and inline links on white |
| `--link` on `--bg` `#FAF8F3` | 4.7 : 1 | Links on the page background (just passes) |
| `--primary-text` `#2F4410` on `--bg` | 10.1 : 1 | Green-tinted headings |
| `--err-text` `#8A2E1F` on `--err-bg` `#FCEDEA` | 7.4 : 1 | Form errors |
| `--todo-ink` `#5E4300` on `--todo-bg` `#FFF0B3` | 8.1 : 1 | TODO notes in drafts |
| `--on-footer` `#CFC9BC` on `--footer` `#1E1C19` | 10.3 : 1 | Footer text |
| `--footer-link` `#ECE6F4` on `--footer` | 13.9 : 1 | Footer links |

### Dark mode

| Combination | Ratio | Use for |
| --- | --- | --- |
| `--ink` `#F1EEE6` on `--bg` `#151410` | 15.9 : 1 | Body text |
| `--ink` on `--surface` `#1F1D19` | 14.5 : 1* | Text in cards |
| `--muted` `#BDB6A8` on `--bg` | 9.2 : 1 | Meta text |
| `--on-primary` `#1A1320` on `--primary` `#B7A2DC` | 8.0 : 1 | **Primary button** (dark text on lavender) |
| `--on-band` `#F1EEE6` on `--band` `#1E2A0E` | 13.0 : 1 | Band text |
| `--link` `#B9D27A` on `--bg` | 11.0 : 1 | Links |
| `--icon` / `--leaf` `#A9C46A` on `--bg` | 9.5 : 1 | Icons |
| `--err` `#F07A6A` on `--bg` | 6.8 : 1 | Errors |
| `--on-footer` `#BDB6A8` on `--footer` `#0E0D0B` | 9.6 : 1 | Footer text |

\* Calculated against `#1F1D19`; fine for both body and large text.

### Avoid these combinations

| Combination | Ratio | Why |
| --- | --- | --- |
| `--link` `#5D7A10` on `--tint` sand `#F0ECE2` | 4.2 : 1 | Fails normal text; use `--ink`/`--muted`, or reserve green for large bold text only |
| `--link` `#5D7A10` on `--band-accent` `#ECE6F4` | 4.0 : 1 | Fails normal text — use `--on-accent` `#2A1946` instead |
| White text on `--band-accent` / `--hint` `#ECE6F4` | 1.2 : 1 | Elderflower is a background; always pair with dark text |
| White text on `--primary` in dark mode `#B7A2DC` | 2.3 : 1 | Use `--on-primary` `#1A1320` instead |
| `--primary` `#4A2C7A` on `--footer` `#1E1C19` | 1.6 : 1 | Don't use elderberry text in the footer; use `--footer-link` |
| Large areas of `--primary` | — | Elderberry is an accent (≈5 % of the page), keep it for CTAs and highlights |

---

## Practical recipes

```css
/* Primary call-to-action — the only large elderberry use */
.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
}
.btn-primary:hover { background: var(--primary-hover); }

/* Secondary/outline button */
.btn-secondary {
  border: 2px solid var(--primary);
  color: var(--primary);
  background: transparent;
}

/* Card */
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px; /* 6–8 px buttons/chips, 8–12 px cards, 14–20 px large panels */
}

/* Dark "Sag hallo" band with elderflower button */
.band { background: var(--band); color: var(--on-band); }
.band .btn { background: var(--band-accent); color: var(--on-accent); }
```

- Radii: 6–8 px buttons and small chips, 8–12 px cards and notices, 14–20 px large panels/placeholders.
- Focus ring: `3px solid var(--primary)` (`:focus-visible` in `global.css`).
- Dark mode follows `data-theme` on `<html>` with a `prefers-color-scheme` fallback; do not build
  separate color sets per component.
- When adding a new color role: add a token in all three `tokens.css` blocks, use it via `var()`,
  then update this file.
